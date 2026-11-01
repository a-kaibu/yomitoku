---
title: "「次の 2 のべき乗」を 1 回のシフトで求める"
description: "値を 2 のべき乗に切り上げる BitOperations.RoundUpToPowerOf2。CPU 命令がある環境では先頭ゼロの数から一発で答えを出し、ない環境では古典的なビットハックで埋める。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Numerics/BitOperations.cs
lines: [95, 117]
function: "BitOperations.RoundUpToPowerOf2(uint)"
difficulty: 2
format: 2
tags: [ビット演算, 最適化, 標準ライブラリ]
---

## ひとことで

`RoundUpToPowerOf2` は、与えられた値を **それ以上で最小の 2 のべき乗**（1, 2, 4, 8, 16, …）に切り上げる関数です。
たとえば `5` なら `8`、`8` ならそのまま `8`、`100` なら `128` を返します。

ハッシュテーブルやバッファの容量を「2 のべき乗」にそろえたいときによく使われます。この関数は、CPU の命令が使える環境とそうでない環境の 2 通りの書き方を持っていて、どちらもループを使いません。

## コード

::: code-group

```csharp:line-numbers=95 [日本語訳]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        [CLSCompliant(false)]
        public static uint RoundUpToPowerOf2(uint value)
        {
            if (X86Base.IsSupported || ArmBase.IsSupported || WasmBase.IsSupported)
            {
#if TARGET_64BIT
                return (uint)(0x1_0000_0000ul >> LeadingZeroCount(value - 1));
#else
                int shift = 32 - LeadingZeroCount(value - 1);
                return (1u ^ (uint)(shift >> 5)) << shift;
#endif
            }

            // https://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2 に基づく
            --value;
            value |= value >> 1;
            value |= value >> 2;
            value |= value >> 4;
            value |= value >> 8;
            value |= value >> 16;
            return value + 1;
        }
```

```csharp:line-numbers=95 [原文]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        [CLSCompliant(false)]
        public static uint RoundUpToPowerOf2(uint value)
        {
            if (X86Base.IsSupported || ArmBase.IsSupported || WasmBase.IsSupported)
            {
#if TARGET_64BIT
                return (uint)(0x1_0000_0000ul >> LeadingZeroCount(value - 1));
#else
                int shift = 32 - LeadingZeroCount(value - 1);
                return (1u ^ (uint)(shift >> 5)) << shift;
#endif
            }

            // Based on https://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2
            --value;
            value |= value >> 1;
            value |= value >> 2;
            value |= value >> 4;
            value |= value >> 8;
            value |= value >> 16;
            return value + 1;
        }
```

:::

## 前提知識

- **`uint`**: C# の「符号なし 32 ビット整数」です。0 から約 42 億までを表せます。`ulong` は 64 ビット版です。
- **`0x1_0000_0000ul`**: 16 進数リテラルです。`_` は読みやすくするための区切りで、値には影響しません。末尾の `ul` は「この数は `ulong`（64 ビット符号なし）です」という印です。値は 2³² です。
- **`>>`（右シフト）と `|=`**: `value >> 1` はビット列を右へ 1 つずらします。`value |= x` は `value = value | x` の略で、`|` は桁ごとの OR（どちらかが 1 なら 1）です。
- **`#if TARGET_64BIT` 〜 `#else` 〜 `#endif`**: コンパイル時の条件分岐（プリプロセッサ）です。64 ビット向けにビルドするときは上側、32 ビット向けなら下側のコードだけが残ります。
- **`X86Base.IsSupported` など**: .NET の「ハードウェア組み込み命令（intrinsics）」の API です。実行中の CPU が該当命令に対応していれば `true` になります。JIT コンパイラ（実行時にマシン語へ変換する仕組み）はこの値を定数として扱うので、不要な側の分岐はマシン語から丸ごと消えます。
- **属性 `[MethodImpl(MethodImplOptions.AggressiveInlining)]`**: 「この関数は呼び出し元に展開（インライン化）してほしい」というコンパイラへのヒントです。`[CLSCompliant(false)]` は「`uint` を使うので、符号なし整数を持たない言語からは使いにくい」という印です。
- **`LeadingZeroCount(x)`**: 32 ビットの値を左端から見たとき、最初の 1 が出てくるまでに 0 がいくつ並ぶかを返します。たとえば `4`（`000…0100`）なら 29 です。

## 何をしているか

### 1. CPU 命令がある場合

```csharp:line-numbers=99
            if (X86Base.IsSupported || ArmBase.IsSupported || WasmBase.IsSupported)
            {
#if TARGET_64BIT
                return (uint)(0x1_0000_0000ul >> LeadingZeroCount(value - 1));
#else
                int shift = 32 - LeadingZeroCount(value - 1);
                return (1u ^ (uint)(shift >> 5)) << shift;
#endif
            }
```

x86・Arm・WebAssembly では、先頭のゼロを数える命令（`LZCNT` など）が使えます。考え方はこうです。

- `value - 1` の先頭ゼロの数を `n` とすると、`value - 1` は 32 − n ビットで書ける数です。
- すると答えは 2^(32 − n) です。

64 ビット環境では、これを **`2³² >> n`** と 1 回のシフトで計算しています。`value = 5` で追うと:

```
value - 1 = 4 = 000…0100   → 先頭ゼロ n = 29
2^32 >> 29 = 2^3 = 8       → 答え 8
```

`value = 8` なら `value - 1 = 7`（`0111`）で n = 29、やはり 8 になります。最初に 1 を引いておくことで「すでに 2 のべき乗なら、そのまま返す」がうまく実現できています。

### 2. 32 ビット環境での工夫

```csharp:line-numbers=104
                int shift = 32 - LeadingZeroCount(value - 1);
                return (1u ^ (uint)(shift >> 5)) << shift;
```

32 ビット環境では 64 ビットの `2³²` を気軽に使えないので、`shift = 32 - n` を求めて `1u << shift` を作ります。
ただし C#（と x86 CPU）のシフトは **シフト量の下位 5 ビットしか見ない** ため、`shift == 32` のとき `1u << 32` は 0 ではなく 1 になってしまいます。

そこで `(1u ^ (uint)(shift >> 5))` という式を使います。`shift` が 32 のときだけ `shift >> 5` が 1 になり、`1 ^ 1 = 0` で結果を 0 にできます。分岐（if）を使わずに、ドキュメントにある「あふれたら 0 を返す」という約束を守っています。

### 3. CPU 命令がない場合

```csharp:line-numbers=109
            // https://graphics.stanford.edu/~seander/bithacks.html#RoundUpPowerOf2 に基づく
            --value;
            value |= value >> 1;
            value |= value >> 2;
            value |= value >> 4;
            value |= value >> 8;
            value |= value >> 16;
            return value + 1;
```

有名な「Bit Twiddling Hacks」の方法です。`value = 100` で追ってみます。

```
--value        → 99 = 0110 0011
value |= >>1   →      0111 0011
value |= >>2   →      0111 1111
…（以降は変化なし）
value + 1      → 1000 0000 = 128
```

1 を引いてから「一番上の 1 より下の桁をすべて 1 で塗りつぶし」、最後に 1 を足すと、ちょうど次の 2 のべき乗になります。シフト量を 1, 2, 4, 8, 16 と倍々にしているので、5 回で 32 ビットすべてを塗りつぶせます。

## ここがすごい

- **同じ答えを 3 通りの方法で出している**: 64 ビット + 命令あり、32 ビット + 命令あり、命令なし。JIT が CPU に合わせて不要な分岐を消すので、実際に動くマシン語はどれか 1 つだけになり、余計なチェックの負担がありません。
- **境界値の扱いがていねい**: `value = 0` のとき、64 ビット版では `0 - 1` が `uint` の最大値になり先頭ゼロが 0 個、`2³² >> 0` を `uint` に切り詰めて 0 になります。塗りつぶし版でも最大値 + 1 があふれて 0 になります。どの経路でも「0 または あふれ → 0」という約束が自然に守られています。
- **シフトの落とし穴を XOR で回避**: 「32 ビット値を 32 ビットシフトすると 0 にならない」という CPU の性質を知ったうえで、`shift >> 5` を使って分岐なしで補正しています。
- **出典をコメントに残している**: ビットハックの元ネタの URL が書かれているので、読む人が自分で確かめられます。

## まとめ

- 「1 を引いてから切り上げる」と、すでに 2 のべき乗の値をそのまま返せる。
- 先頭ゼロの数がわかれば、2 のべき乗への切り上げは 1 回のシフトで済む。
- シフト量がビット幅と同じになると結果が期待と違う。境界値は必ず確かめる。
- .NET では `IsSupported` で CPU ごとの最適な実装を選び、使わない分岐は JIT が消してくれる。
