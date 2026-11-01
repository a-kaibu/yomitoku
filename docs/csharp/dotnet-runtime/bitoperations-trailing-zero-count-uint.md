---
title: "一番下の 1 を取り出して de Bruijn 表で位置を引く"
description: "末尾に並ぶ 0 の数を数える TrailingZeroCount。x & -x で最下位の 1 だけを残し、de Bruijn 数との掛け算で位置を割り出す。境界チェックを省く細かい工夫も。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Numerics/BitOperations.cs
lines: [539, 577]
function: "BitOperations.TrailingZeroCount(uint)"
difficulty: 3
tags: [ビット演算, ハック, 低レイヤ]
---

## ひとことで

`TrailingZeroCount` は、整数を 2 進数で書いたとき **右端から 0 がいくつ続くか** を数える関数です。
`8`（`1000`）なら 3、`12`（`1100`）なら 2 です。0 のときは 32 を返します。

CPU 命令（`TZCNT`、Arm の `RBIT` + `CLZ`、x86 の `BSF`）を順に試し、どれもなければ「最下位の 1 を取り出す」技と de Bruijn 数の掛け算で答えを出します。

## コード

```csharp:line-numbers=539
        [Intrinsic]
        [CLSCompliant(false)]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static int TrailingZeroCount(uint value)
        {
            if (Bmi1.IsSupported)
            {
                // TZCNT contract is 0->32
                return (int)Bmi1.TrailingZeroCount(value);
            }

            if (ArmBase.IsSupported)
            {
                return ArmBase.LeadingZeroCount(ArmBase.ReverseElementBits(value));
            }

            if (WasmBase.IsSupported)
            {
                return WasmBase.TrailingZeroCount(value);
            }

            // Unguarded fallback contract is 0->0, BSF contract is 0->undefined
            if (value == 0)
            {
                return 32;
            }

            if (X86Base.IsSupported)
            {
                return (int)X86Base.BitScanForward(value);
            }

            // uint.MaxValue >> 27 is always in range [0 - 31] so we use Unsafe.AddByteOffset to avoid bounds check
            return Unsafe.AddByteOffset(
                // Using deBruijn sequence, k=2, n=5 (2^5=32) : 0b_0000_0111_0111_1100_1011_0101_0011_0001u
                ref MemoryMarshal.GetReference(TrailingZeroCountDeBruijn),
                // uint|long -> IntPtr cast on 32-bit platforms does expensive overflow checks not needed here
                (IntPtr)(int)(((value & (uint)-(int)value) * 0x077CB531u) >> 27)); // Multi-cast mitigates redundant conv.u8
        }
```

`TrailingZeroCountDeBruijn` は同じファイルの 28〜34 行目にある 32 要素の表です。

## 前提知識

- **2 の補数**: コンピュータは負の数を「全ビットを反転して 1 を足す」形で表します。そのため `x & -x` を計算すると、**x の一番下にある 1 のビットだけ** が残ります。例: `12 = 1100`、`-12 = …0100` で、AND は `0100`。
- **`(uint)-(int)value`**: `uint` はそのままでは符号反転できないので、いったん `int` にしてマイナスを付け、`uint` に戻しています。ビットの並びとしては 2 の補数の符号反転になります。
- **`ref` と `Unsafe.AddByteOffset`**: `ref` は「変数そのものへの参照」です。`MemoryMarshal.GetReference(span)` で表の先頭への参照を取り、`Unsafe.AddByteOffset` でそこから n バイト先の要素を読みます。通常の `span[i]` と違い、**範囲チェックを行いません**。
- **`IntPtr`**: ポインタと同じ幅（32 ビット環境なら 32 ビット、64 ビット環境なら 64 ビット）の整数です。
- **ArmBase.ReverseElementBits**: ビットの並びを左右反転する命令（`RBIT`）です。反転すれば「右端の 0」は「左端の 0」になるので、先頭ゼロを数える命令が使えます。

## 何をしているか

### 1. CPU 命令を順に試す（544〜569 行目）

- `Bmi1`（x86 の `TZCNT`）: 0 のとき 32 を返す、この関数と同じ約束の命令です。
- Arm: ビットを反転してから `LeadingZeroCount`。
- WebAssembly: 専用命令。
- 古い x86 の `BSF`: 0 のときの結果が未定義なので、先に 561〜564 行目で 0 を処理しています。

### 2. ソフトウェア版（572〜576 行目）

`value = 12` で追います。

1. `value & -value` = `4`（一番下の 1 だけ）。結果は必ず `2^k` の形で、32 通りしかありません。
2. `4 × 0x077CB531` は定数を 2 ビット左にずらしたものと同じです。de Bruijn 数なので、ずらし量 k ごとに上位 5 ビットがすべて違う値になります。
3. `>> 27` で上位 5 ビットを取り出すと 3 になり、表の 3 番目（`TrailingZeroCountDeBruijn[3]`）を引くと `2` が得られます。

掛け算が「k ビットの左シフト」になることがポイントで、Log2 版（塗りつぶし後の `2^(k+1)-1` を掛ける）より素直な形です。

## ここがすごい

- **`x & -x` という古典テクニック**: 一番下の 1 だけを残す、ビット演算でもっともよく知られた技の 1 つです。これで入力が 32 通りに絞られます。
- **範囲チェックの省略を理由つきで**: 571 行目のコメントの通り、`>> 27` の結果は必ず 0〜31 なので、範囲外アクセスは起こりえません。それを人間が保証したうえで `Unsafe.AddByteOffset` を使い、JIT が挿入する範囲チェックを消しています。
- **キャストの順番まで気にしている**: 575〜576 行目のコメントにある通り、`uint` から直接 `IntPtr` にすると 32 ビット環境であふれ確認のコードが入ることがあるため、`int` を経由させています。1 命令単位で詰めているのがわかります。
- **0 の扱いを契約として明示**: 各命令の「0 のとき何を返すか」がコメントで整理されていて、古い命令の未定義動作を if 1 つで吸収しています。

## まとめ

- `x & -x` で一番下の 1 だけを取り出せる。
- 2 のべき乗 × de Bruijn 数は「シフト」なので、上位ビットで位置を判別できる。
- 安全だと証明できる場所だけ `Unsafe` で範囲チェックを外すのが、.NET の高速化の定番。
