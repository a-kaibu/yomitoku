---
title: "1 回の引き算と比較だけで、有効な Unicode の値かを判定する"
description: ".NET の UnicodeUtility.IsValidUnicodeScalar。0 から 0x10FFFF の範囲に、サロゲートの範囲（0xD800〜0xDFFF）を除いた値だけを、1 回の引き算、XOR、比較で判定する。"
language: csharp
project: ".NET Runtime"
repo: https://github.com/dotnet/runtime
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "f368d14df0c3905d3b80073d709685af83ba895d"
file: src/libraries/System.Private.CoreLib/src/System/Text/UnicodeUtility.cs
lines: [169, 183]
function: "UnicodeUtility.IsValidUnicodeScalar(uint)"
difficulty: 3
format: 2
tags: [Unicode, ビット演算, 最適化]
---

## ひとことで

`IsValidUnicodeScalar(value)` は、整数が **有効な Unicode の文字番号** かを判定する関数です。
有効なのは、0 から `0x10FFFF` までの値のうち、**サロゲート**（`0xD800` から `0xDFFF`）を除いたものです。たとえば `0x41`（`A`）は `true`、`0xD800` は `false`、`0x110000` は `false` です。

判定は、範囲を 2 回比べる書き方でもできます。しかしこの関数は、**引き算、XOR、比較の 1 回ずつ** で済ませています。

## コード

::: code-group

```csharp:line-numbers=169 [日本語訳]
        public static bool IsValidUnicodeScalar(uint value)
        {
            // x86 では、lea・xor・cmp の 3 命令だけで済む、最適化された判定。
            //
            // 引き算の後、入力の値は次のように変わる:
            // [ 00000000..0010FFFF ] -> [ FFEF0000..FFFFFFFF ]
            //
            // サロゲートの範囲 [ FFEFD800..FFEFDFFF ] を、有効な値から除外したい。
            // XOR の後、この除外の範囲は [ FFEF0000..FFEF07FF ] になる。
            //
            // よって、範囲 [ FFEF0800..FFFFFFFF ] に、サロゲートを除く有効な値がすべて入る。
            // この 1 回の比較で、有効かどうかを判定できる。

            return ((value - 0x110000u) ^ 0xD800u) >= 0xFFEF0800u;
        }
```

```csharp:line-numbers=169 [原文]
        public static bool IsValidUnicodeScalar(uint value)
        {
            // This is an optimized check that on x86 is just three instructions: lea, xor, cmp.
            //
            // After the subtraction operation, the input value is modified as such:
            // [ 00000000..0010FFFF ] -> [ FFEF0000..FFFFFFFF ]
            //
            // We now want to _exclude_ the range [ FFEFD800..FFEFDFFF ] (surrogates) from being valid.
            // After the xor, this particular exclusion range becomes [ FFEF0000..FFEF07FF ].
            //
            // So now the range [ FFEF0800..FFFFFFFF ] contains all valid code points,
            // excluding surrogates. This allows us to perform a single comparison.

            return ((value - 0x110000u) ^ 0xD800u) >= 0xFFEF0800u;
        }
```

:::

## 前提知識

- **Unicode の文字番号（コードポイント）**: 世界の文字に付けられた番号です。最大は `0x10FFFF` です。
- **サロゲート**: `char` 1 つに収まらない文字を 2 つの `char` で表すための、特別な範囲（`0xD800`〜`0xDFFF`）です。単独では文字になりません。
- **符号なし整数（`uint`）**: 0 以上だけを表す整数です。引き算で負になると、大きな数に折り返します。
- **XOR（排他的論理和, `^`）**: 桁ごとに、違うときだけ 1 にする演算です。
- **折り返し**: 符号なしの引き算で 0 より小さくなると、2 の 32 乗から引いた大きな値になる性質です。

## 何をしているか

### 1. 範囲を引き算で動かす

```csharp:line-numbers=182
            return ((value - 0x110000u) ^ 0xD800u) >= 0xFFEF0800u;
```

`value - 0x110000` で、有効な範囲 `[0, 0x10FFFF]` を、折り返した大きな値の範囲に移します。有効な値は、すべて `0xFFEF0000` 以上になります。

### 2. サロゲートだけを別の範囲へずらす

```csharp:line-numbers=182
            return ((value - 0x110000u) ^ 0xD800u) >= 0xFFEF0800u;
```

同じ式の中で `^ 0xD800` を行うと、サロゲートの範囲だけが、より小さい範囲に移ります。他の有効な値は、大きい範囲に残ります。

### 3. 1 回の比較で決める

```csharp:line-numbers=182
            return ((value - 0x110000u) ^ 0xD800u) >= 0xFFEF0800u;
```

`>= 0xFFEF0800` と比べます。サロゲートだけが、この比較で `false` になります。範囲の外の値も、同じように `false` になります。

### 具体例で確かめる

```
0x0041  → 有効な範囲で、サロゲートではない → true
0xD800  → サロゲートの範囲 → false
0x10FFFF → 最大の有効な値 → true
0x110000 → 範囲の外 → false
```

## ここがすごい

- **比較が 1 回**: 範囲の両端とサロゲートの除外を、引き算と XOR で 1 つの範囲にまとめています。分岐が 1 つも無いので、速く動きます。
- **x86 では 3 命令**: コメントにあるとおり、機械語の命令も数個で済みます。よく呼ばれる部分なので、この差が効きます。
- **符号なしの性質を利用**: 範囲の外の値を、折り返しを使って一度に大きな値へ移しています。
- **仕様をコメントに残す**: 途中の値の変化を注釈で示しているので、後から読んでも理由が追えます。

## まとめ

- `IsValidUnicodeScalar` は、有効な Unicode の文字番号かどうかを、引き算・XOR・比較の 1 回で判定する。
- 有効な範囲とサロゲートの範囲を、符号なしの折り返しで 1 つの範囲にまとめる。
- 分岐がなく、機械語の命令数も少ないので、よく使われる判定を速く行える。
