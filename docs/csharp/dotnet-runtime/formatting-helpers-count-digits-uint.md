---
title: "足し算 1 回とシフトで 10 進数の桁数を数える"
description: "uint の 10 進桁数を求める CountDigits。Daniel Lemire の手法で、log2 で引いた 64 ビットの定数を足して上位 32 ビットを取るだけで、ちょうど桁数が出てくる。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Buffers/Text/FormattingHelpers.CountDigits.cs
lines: [63, 106]
function: "FormattingHelpers.CountDigits(uint)"
difficulty: 3
format: 2
tags: [ビット演算, 数値計算, ハック]
---

## ひとことで

`CountDigits(uint)` は、整数を 10 進数で書いたときの **桁数** を返します。`7` なら 1、`99` なら 2、`100` なら 3 です。
数値を文字列にするとき、先に桁数がわかれば必要なバッファの長さを一度で決められます。

素直に書けば「10 で割り続ける」か「10, 100, 1000…と比べ続ける」ですが、この関数は **表引き 1 回・足し算 1 回・シフト 1 回** で答えを出します。

## コード

::: code-group

```csharp:line-numbers=63 [日本語訳]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static int CountDigits(uint value)
        {
            // Daniel Lemire の方法 (https://lemire.me/blog/2021/06/03/computing-the-number-of-digits-of-an-integer-even-faster) に基づく
            ReadOnlySpan<long> table =
            [
                4294967296,
                8589934582,
                8589934582,
                8589934582,
                12884901788,
                12884901788,
                12884901788,
                17179868184,
                17179868184,
                17179868184,
                21474826480,
                21474826480,
                21474826480,
                21474826480,
                25769703776,
                25769703776,
                25769703776,
                30063771072,
                30063771072,
                30063771072,
                34349738368,
                34349738368,
                34349738368,
                34349738368,
                38554705664,
                38554705664,
                38554705664,
                41949672960,
                41949672960,
                41949672960,
                42949672960,
                42949672960,
            ];
            Debug.Assert(table.Length == 32, "Every result of uint.Log2(value) needs a long entry in the table.");

            long tableValue = table[(int)uint.Log2(value)];
            return (int)((value + tableValue) >> 32);
        }
```

```csharp:line-numbers=63 [原文]
        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static int CountDigits(uint value)
        {
            // Algorithm based on https://lemire.me/blog/2021/06/03/computing-the-number-of-digits-of-an-integer-even-faster.
            ReadOnlySpan<long> table =
            [
                4294967296,
                8589934582,
                8589934582,
                8589934582,
                12884901788,
                12884901788,
                12884901788,
                17179868184,
                17179868184,
                17179868184,
                21474826480,
                21474826480,
                21474826480,
                21474826480,
                25769703776,
                25769703776,
                25769703776,
                30063771072,
                30063771072,
                30063771072,
                34349738368,
                34349738368,
                34349738368,
                34349738368,
                38554705664,
                38554705664,
                38554705664,
                41949672960,
                41949672960,
                41949672960,
                42949672960,
                42949672960,
            ];
            Debug.Assert(table.Length == 32, "Every result of uint.Log2(value) needs a long entry in the table.");

            long tableValue = table[(int)uint.Log2(value)];
            return (int)((value + tableValue) >> 32);
        }
```

:::

## 前提知識

- **`uint` と `long`**: `uint` は 32 ビット符号なし整数、`long` は 64 ビット符号付き整数です。`value + tableValue` では `uint` が自動的に `long` に広げられてから足されます。
- **`uint.Log2(value)`**: 一番上の 1 のビットの位置（0〜31）を返します。`99` は 2 進数で 7 桁（`1100011`）なので 6 です。CPU 命令 1 個で計算できます。
- **`ReadOnlySpan<long> table = [ ... ];`**: 定数の配列です。C# コンパイラはこの書き方を見ると、実行のたびに配列を作らず、DLL に埋め込んだデータを直接参照するコードを出します。
- **`>> 32`**: 64 ビットの値を右に 32 ずらすと、**上位 32 ビットだけ** が残ります。
- **`Debug.Assert`**: デバッグビルドでだけ動く確認です。リリース版では消えます。

## 何をしているか

### 1. log2 で「だいたいの桁数」を絞る

2 進数の桁数（= log2 + 1）がわかると、10 進数の桁数は **2 通りのどちらか** に絞れます。
たとえば log2 が 6 の数は 64〜127 で、10 進数では 2 桁（64〜99）か 3 桁（100〜127）です。

### 2. 表の値を足して上位 32 ビットを取る

```csharp:line-numbers=104
            long tableValue = table[(int)uint.Log2(value)];
            return (int)((value + tableValue) >> 32);
```

表の各要素は、上位 32 ビットに「桁数」、下位 32 ビットに「しきい値の補正」を詰めた値です。
log2 = 6 のときの値 `12884901788` は `3 × 2³² − 100` になっています。

- `value = 99` → `99 + 3 × 2³² − 100 = 3 × 2³² − 1`。上位 32 ビットは **2**。
- `value = 100` → `100 + 3 × 2³² − 100 = 3 × 2³²`。上位 32 ビットは **3**。

つまり、**100 を境に繰り上がりが起きるかどうか** で桁数が 1 つ変わります。比較も分岐もなしに「100 未満なら 2、以上なら 3」が計算できるのです。

### 3. 境界がない区間

log2 = 0〜2（値 1〜7）は必ず 1 桁なので、表の値は `4294967296`（= 1 × 2³²、補正なし）です。`value` は 7 以下なので繰り上がらず、答えは常に 1 です。`value = 0` のときも `Log2(0) = 0` なので 1 桁になります。

## ここがすごい

- **比較を繰り上がりに置き換える**: 「value が 10ᵏ 以上か」という判定を、`2³² − 10ᵏ` を足したときに上位ビットへ繰り上がるかどうかに置き換えています。分岐がないので、CPU の分岐予測ミスが起きません。
- **1 つの数に 2 つの情報を詰める**: 上位に答え、下位にしきい値という詰め方で、表を 1 回引くだけで済みます。
- **出典が明記されている**: コメントにある通り、Daniel Lemire 氏のブログで紹介された手法です。同じファイルの `ulong` 版は fmt ライブラリ由来の別の手法（log2 → 10 のべき乗表 → 比較 1 回）を使っていて、値の幅に応じて手法を選び分けているのがわかります。
- **`uint` の範囲だけで成り立つ**: `uint` の最大値でも 64 ビットの足し算はあふれません。値の範囲が限られていることをうまく利用しています。

## まとめ

- 2 進数の桁数（log2）がわかれば、10 進数の桁数は 2 通りに絞れる。
- 「しきい値以上か」は、補正値を足したときの繰り上がりで判定できる。
- 64 ビット整数の上位と下位に別々の情報を入れておくと、表引き 1 回で多くのことができる。
