---
title: "整数を、大きい記号から順に貪欲に並べてローマ数字にする"
description: "Humanizer の ToRoman。値の大きい記号の組から順に、残りの値以下である限り書き足していく。1〜3999 の整数をローマ数字の文字列に変換する。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/RomanNumeralExtensions.cs
lines: [168, 192]
function: "RomanNumeralExtensions.ToRoman(int)"
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, 数値計算]
---

## ひとことで

`ToRoman` は、整数を **ローマ数字の文字列** に直す関数です。
`1994.ToRoman()` は `"MCMXCIV"` になります。

値の大きい記号の組から順に、残りの値を超えない限り書き足していきます。引き算の書き方（`CM` や `IV`）も、同じ仕組みで自然に出てきます。

## コード

```csharp:line-numbers=168
    public static string ToRoman(this int input)
    {
        const int minValue = 1;
        const int maxValue = 3999;
        const int maxRomanNumeralLength = 15;

        if (input is < minValue or > maxValue)
        {
            throw new ArgumentOutOfRangeException(nameof(input));
        }

        Span<char> builder = stackalloc char[maxRomanNumeralLength];
        var pos = 0;

        foreach (var pair in RomanNumeralsSequence)
        {
            while (input >= pair.Value)
            {
                pair.Key.AsSpan().CopyTo(builder[pos..]);
                pos += pair.Key.Length;
                input -= pair.Value;
            }
        }

        return builder[..pos].ToString();
```

## 前提知識

- **貪欲法（どんよくほう）**: 今その場で最も大きいものを選び続ける考え方です。ローマ数字では、大きい記号から順に使うと、正しい形になります。
- **記号の表**: `RomanNumeralsSequence` は、`("M", 1000)`, `("CM", 900)`, …, `("I", 1)` の組を、大きい順に並べた表です。`CM` や `IV` のような引き算の形も、表に含めています。
- **`stackalloc`**: 結果の文字を置くための領域を、スタック（一時的な作業領域）に確保します。最長でも 15 文字の枠を用意しています。
- **`Span<char>`**: 文字の並びを指す型です。`builder[pos..]` のように、一部分へ書き込めます。
- **範囲の検査**: 1 から 3999 まで以外の値は、ローマ数字で表せないので例外を投げます。

## 何をしているか

### 1. 範囲を確かめる

```csharp:line-numbers=174
        if (input is < minValue or > maxValue)
        {
            throw new ArgumentOutOfRangeException(nameof(input));
```

1 未満や 3999 を超える値は、例外で知らせます。

### 2. 大きい記号から順に書き足す

```csharp:line-numbers=182
        foreach (var pair in RomanNumeralsSequence)
        {
            while (input >= pair.Value)
            {
                pair.Key.AsSpan().CopyTo(builder[pos..]);
                pos += pair.Key.Length;
                input -= pair.Value;
            }
```

表を大きい順に見ていきます。残りの値が記号の値以上である限り、その記号を `builder` に書き、値から引きます。

### 3. 書いた分だけ文字列にする

```csharp:line-numbers=192
        return builder[..pos].ToString();
```

`pos` までの部分を文字列にして返します。

### 具体例で確かめる

`1994` を変換すると、次のようになります。

```
1994 ≥ 1000 (M)   → M,     残り 994
 994 ≥  900 (CM)  → CM,    残り  94
  94 ≥   90 (XC)  → XC,    残り   4
   4 ≥    4 (IV)  → IV,    残り   0
結果: MCMXCIV
```

## ここがすごい

- **表を見るだけで書ける**: 引き算の規則を特別に書かずに、`CM` や `IV` を表の記号として扱うだけで正しい形になります。
- **文字列を何度も作らない**: `stackalloc` と `Span<char>` で、一時的な文字列を作らずに結果を組み立てます。
- **結果の長さが分かっている**: 最長の 3999 でも 9 文字に収まるので、15 文字の枠で十分です。
- **範囲外を弾く**: ローマ数字で表せる範囲を先に決めておくので、おかしな値を変換せずに済みます。

## まとめ

- `ToRoman` は、大きい記号の組から順に貪欲に書き足して、ローマ数字にする。
- `CM` や `IV` のような引き算の形は、記号の表に含めておくことで自然に扱える。
- 結果は `stackalloc` の一時領域に組み立て、最後に文字列として返す。
