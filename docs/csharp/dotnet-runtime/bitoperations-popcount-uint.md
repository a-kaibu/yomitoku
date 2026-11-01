---
title: "1 のビットを数える：CPU 命令から SWAR の掛け算まで"
description: "BitOperations.PopCount は x86 の POPCNT、Arm の SIMD 命令、どちらもなければビット並列の足し算と掛け算で 1 の個数を数える。3 段構えの実装を読む。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Numerics/BitOperations.cs
lines: [427, 461]
function: "BitOperations.PopCount(uint)"
difficulty: 3
tags: [ビット演算, 最適化, 低レイヤ]
---

## ひとことで

`PopCount` は 32 ビット整数のうち **1 になっているビットの数** を返します（population count、ポップカウント）。
`7`（`111`）なら 3、`0x80000001` なら 2 です。

x86 の `POPCNT` 命令、Arm のベクトル命令、そしてどちらも使えないときのソフトウェア実装という 3 段構えになっていて、ソフトウェア版では「ビットを小さな箱に分けて同時に足す」技を使います。

## コード

```csharp:line-numbers=427
        [Intrinsic]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        [CLSCompliant(false)]
        public static int PopCount(uint value)
        {
            if (Popcnt.IsSupported)
            {
                return (int)Popcnt.PopCount(value);
            }

            if (AdvSimd.Arm64.IsSupported)
            {
                // PopCount works on vector so convert input value to vector first.

                Vector64<uint> input = Vector64.CreateScalar(value);
                Vector64<byte> aggregated = AdvSimd.Arm64.AddAcross(AdvSimd.PopCount(input.AsByte()));
                return aggregated.ToScalar();
            }

            return SoftwareFallback(value);

            static int SoftwareFallback(uint value)
            {
                const uint c1 = 0x_55555555u;
                const uint c2 = 0x_33333333u;
                const uint c3 = 0x_0F0F0F0Fu;
                const uint c4 = 0x_01010101u;

                value -= (value >> 1) & c1;
                value = (value & c2) + ((value >> 2) & c2);
                value = (((value + (value >> 4)) & c3) * c4) >> 24;

                return (int)value;
            }
        }
```

## 前提知識

- **`[Intrinsic]`**: JIT コンパイラが特別扱いする関数の印です。可能なら関数呼び出しそのものを CPU 命令 1 個に置き換えます。
- **`Popcnt.IsSupported`**: 実行中の CPU が x86 の `POPCNT` 命令を持っているか。JIT にとっては定数なので、使わない分岐はマシン語から消えます。
- **`Vector64<uint>`**: 64 ビット幅の SIMD レジスタ（1 つの命令で複数の値をまとめて扱うレジスタ）を表す型です。`AsByte()` は中身を 8 個の byte として見直します。
- **ローカル関数**: 448 行目の `static int SoftwareFallback(...)` のように、関数の中に関数を書けます。`static` を付けると外側の変数を使えないことが保証されます。
- **`const`**: コンパイル時に決まる定数です。`0x_55555555u` のように `_` で区切って読みやすくできます。
- **`-=`**: `value = value - ...` の略です。

## 何をしているか

### 1. x86: POPCNT 命令（432〜435 行目）

命令 1 個で答えが出ます。

### 2. Arm64: バイトごとに数えて合計（437〜444 行目）

Arm には 32 ビット整数のための popcount 命令がないため、値をベクトルレジスタに入れ、`AdvSimd.PopCount` で **8 バイトそれぞれの 1 の数** を数えます。続く `AddAcross` で全バイトを合計し、`ToScalar()` で普通の整数に戻します。

### 3. ソフトウェア版（448〜460 行目）

`value = 0b1101_1011`（下位 8 ビットだけ、1 は 6 個）で追います。

**455 行目**: 2 ビットずつの箱に、その箱の 1 の数を入れます。2 ビットの値 `ab` は `2a + b` なので、そこから `a` を引くと `a + b` になる、という引き算の技です。

```
11 01 10 11 → 10 01 01 10   （2, 1, 1, 2）
```

**456 行目**: 隣り合う 2 ビットの箱を足して 4 ビットの箱にします。`c2 = 0011…` が箱の片側を取り出すマスクです。

```
10 01 | 01 10 → 0011 | 0011   （3, 3）
```

**457 行目**: まず `value + (value >> 4)` と `& c3` で 8 ビット（1 バイト）ごとの個数にします（例では `0000 0110` = 6）。
最後に `c4 = 0x01010101` を掛けます。この掛け算は「4 つのバイトをすべて最上位バイトに足し合わせる」働きをするので、`>> 24` で最上位バイトを取り出せば全体の合計になります。

## ここがすごい

- **掛け算で 4 つの足し算をまとめる**: `x * 0x01010101` は `x + (x << 8) + (x << 16) + (x << 24)` と同じです。これで 4 バイトの合計を最上位バイトに集められます。合計は最大 32 で 1 バイトに収まるので、繰り上がりの心配もありません。
- **ループの代わりにレジスタ内並列（SWAR）**: 32 回の確認の代わりに、十数個の算術命令で終わります。入力によって速さが変わらないことも利点です。
- **CPU ごとに最適な道を用意**: 命令があればそれを使い、なければ別の命令の組み合わせ、それもなければ純粋な算術、と段階的に落ちていく設計です。`IsSupported` のおかげで、実際に実行されるのは 1 つの道だけです。

## まとめ

- 2 ビット → 4 ビット → 8 ビットと箱を広げながら足すと、ループなしで 1 の数を数えられる。
- `0x01010101` を掛けると、各バイトの合計を一番上のバイトに集められる。
- `[Intrinsic]` と `IsSupported` によって、.NET は CPU の専用命令とソフトウェア実装を自然に切り替えられる。
