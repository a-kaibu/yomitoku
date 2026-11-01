---
title: "31 - x を 31 ^ x と書いて 1 命令減らす"
description: "先頭ゼロの数を数える LeadingZeroCount。LZCNT がない古い x86 では BSR 命令の結果を XOR で裏返す。引き算を XOR に置き換える理由がコメントで説明されている。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Numerics/BitOperations.cs
lines: [172, 208]
function: "BitOperations.LeadingZeroCount(uint)"
difficulty: 2
tags: [ビット演算, 最適化, 低レイヤ]
---

## ひとことで

`LeadingZeroCount` は、32 ビット整数を左端から見て **最初の 1 が出てくるまでに 0 がいくつ並ぶか** を返します。
`1` なら 31、`0x80000000` なら 0、`0` なら 32 です。

CPU ごとに使える命令が違うため、いくつもの道を用意しています。中でも、古い x86 向けの「`31 - x` の代わりに `31 ^ x`」という小技がおもしろいところです。

## コード

```csharp:line-numbers=172
        [Intrinsic]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        [CLSCompliant(false)]
        public static int LeadingZeroCount(uint value)
        {
            if (Lzcnt.IsSupported)
            {
                // LZCNT contract is 0->32
                return (int)Lzcnt.LeadingZeroCount(value);
            }

            if (ArmBase.IsSupported)
            {
                return ArmBase.LeadingZeroCount(value);
            }

            if (WasmBase.IsSupported)
            {
                return WasmBase.LeadingZeroCount(value);
            }

            // Unguarded fallback contract is 0->31, BSR contract is 0->undefined
            if (value == 0)
            {
                return 32;
            }

            if (X86Base.IsSupported)
            {
                // LZCNT returns index starting from MSB, whereas BSR gives the index from LSB.
                // 31 ^ BSR here is equivalent to 31 - BSR since the BSR result is always between 0 and 31.
                // This saves an instruction, as subtraction from constant requires either MOV/SUB or NEG/ADD.
                return 31 ^ (int)X86Base.BitScanReverse(value);
            }

            return 31 ^ Log2SoftwareFallback(value);
        }
```

## 前提知識

- **`Lzcnt`、`ArmBase`、`WasmBase`、`X86Base`**: .NET が用意している CPU 命令の窓口クラスです。`IsSupported` が `true` のときだけ、その命令を呼べます。
- **`BitScanReverse`（BSR 命令）**: 一番上の 1 の位置を **右端から** 数えて返す x86 の古い命令です。`8`（`1000`）なら 3 を返します。入力が 0 のときの結果は「未定義」です。
- **`^`（XOR、排他的論理和）**: 桁ごとに「違えば 1、同じなら 0」にする演算です。
- **契約（contract）**: コメントにある「0->32」は「入力 0 に対して 32 を返す」という約束のことです。命令によってこの約束が違います。

## 何をしているか

### 1. 先頭ゼロ数をそのまま数える命令（177〜191 行目）

x86 の `LZCNT`、Arm の `CLZ`、WebAssembly の `clz` は、どれも「0 なら 32」という約束でこの関数の仕様と一致するので、そのまま返します。

### 2. 0 の特別扱い（193〜197 行目）

ここから先の BSR とソフトウェア版は 0 を正しく扱えないので、先に `32` を返してしまいます。

### 3. BSR の結果を裏返す（199〜205 行目）

BSR は一番上の 1 の位置 `p`（右から数えて 0〜31）を返します。先頭ゼロの数は `31 - p` です。

例: `value = 8` なら `p = 3`、答えは `31 - 3 = 28`。

ここで `31` は 2 進数で `11111` です。0〜31 の数 `p` に対して `11111 - p` は **各ビットを反転すること** と同じなので、`31 ^ p` と書いても結果は変わりません。`3 = 00011` → `31 ^ 3 = 11100 = 28` です。

### 4. ソフトウェア版（207 行目）

`Log2SoftwareFallback`（一番上の 1 の位置を求める関数）の結果を、同じく `31 ^` で裏返します。

## ここがすごい

- **1 命令の差にこだわる**: コメント（201〜203 行目）によると、x86 では「定数から引く」には `MOV` + `SUB` か `NEG` + `ADD` の 2 命令が必要ですが、XOR なら 1 命令で済みます。値の範囲が 0〜31 に限られることを利用した、数学的に安全な置き換えです。
- **命令ごとの「0 の約束」の違いを吸収**: `LZCNT` は 0→32、BSR は 0→未定義、ソフトウェア版は 0→0。こうした違いを if 1 つでまとめ、呼び出す側からは常に同じ動きに見えるようにしています。
- **`[Intrinsic]` で呼び出し自体が命令になる**: 実際には JIT がこの関数呼び出しを `LZCNT` などの命令に直接置き換えることが多く、ここに書かれた C# は「置き換えできないとき」の実装も兼ねています。

## まとめ

- 0〜2ⁿ−1 の範囲では、`(2ⁿ−1) - x` と `(2ⁿ−1) ^ x` は同じ値になる。
- 命令ごとの境界値（0 のとき）の約束は違うので、ラッパー関数で統一すると使いやすい。
- 高性能なライブラリは、CPU の命令数レベルまで意識して書かれている。
