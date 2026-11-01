---
title: "ローマ数字の文字列を、右から見て整数に直す"
description: "Humanizer の FromRoman。ローマ数字を右から 1 文字ずつ読み、小さい数字が前にあれば引く（IV = 4 など）というルールで整数に変換する。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/RomanNumeralExtensions.cs
lines: [111, 141]
function: "RomanNumeralExtensions.FromRoman(CharSpan)"
difficulty: 2
format: 2
tags: [文字列処理, アルゴリズム, 正規表現]
---

## ひとことで

`FromRoman` は、ローマ数字の文字列（たとえば `XIV`）を **整数**（この場合は `14`）に直す関数です。
`"MCMXC".FromRoman()` は `1990` になります。

ローマ数字には「`IV` は `5 - 1 = 4`」のように、小さい数字を大きい数字の前に置くと引く、というルールがあります。この関数は、そのルールを右から読んで扱います。

## コード

```csharp:line-numbers=111
    public static int FromRoman(CharSpan input)
    {
        input = input.Trim();

        var length = input.Length;

        if (length == 0 || IsInvalidRomanNumeral(input))
        {
            throw new ArgumentException("Empty or invalid Roman numeral string.", nameof(input));
        }

        var total = 0;
        var i = length;

        while (i > 0)
        {
            var digit = GetRomanNumeralCharValue(input[--i]);
            if (i > 0)
            {
                var previousDigit = GetRomanNumeralCharValue(input[i - 1]);
                if (previousDigit < digit)
                {
                    digit -= previousDigit;
                    i--;
                }
            }

            total += digit;
        }

        return total;
```

## 前提知識

- **ローマ数字**: `I=1`, `V=5`, `X=10`, `L=50`, `C=100`, `D=500`, `M=1000` の 7 文字を組み合わせて数を表す書き方です。
- **減算の書き方**: 小さい文字が大きい文字の前にあるときは、引き算の意味になります。`IX` は `10 - 1 = 9` です。
- **`CharSpan`**: 文字の並びの一部分を、コピーせずに指す型です。ここでは、入力の文字列を読むために使います。
- **`Trim()`**: 前後の空白を取り除きます。
- **`IsInvalidRomanNumeral`**: 入力がローマ数字として正しいかを、正規表現で調べる補助の関数です。

## 何をしているか

### 1. 入力を確かめる

```csharp:line-numbers=113
        input = input.Trim();

        var length = input.Length;

        if (length == 0 || IsInvalidRomanNumeral(input))
        {
            throw new ArgumentException("Empty or invalid Roman numeral string.", nameof(input));
        }
```

前後の空白を取り除き、空だったり、正しいローマ数字でなかったりすると例外を投げます。

### 2. 右から 1 文字ずつ読む

```csharp:line-numbers=122
        var total = 0;
        var i = length;

        while (i > 0)
        {
            var digit = GetRomanNumeralCharValue(input[--i]);
```

`i` は、まだ読んでいない位置です。右端から 1 文字取り出し、その文字の値を `digit` に入れます。

### 3. 前の文字が小さければ引く

```csharp:line-numbers=128
            if (i > 0)
            {
                var previousDigit = GetRomanNumeralCharValue(input[i - 1]);
                if (previousDigit < digit)
                {
                    digit -= previousDigit;
                    i--;
                }
```

さらに左の文字の値を `previousDigit` として見ます。それが `digit` より小さければ、`digit` からその値を引き、左の文字も読んだことにします（`i--`）。

### 4. 合計に足す

```csharp:line-numbers=138
            total += digit;
        }

        return total;
```

求めた `digit` を `total` に足します。最後に `total` を返します。

### 具体例で確かめる

`XIV` を読むと、次のようになります。

```
V（5）を読む → 左の I（1）は小さいので 5 - 1 = 4 とし、I も読んだことにする → 合計 4
X（10）を読む → 左に文字がない → 合計 4 + 10 = 14
```

## ここがすごい

- **右から読むと、引き算の判定が簡単**: 大きい文字を先に読み、その左が小さいかどうかを見るだけで済みます。
- **1 回の走査で終わる**: 文字列を一度だけ読むので、速く、メモリも余分に使いません。
- **入力を先に検査する**: 不正な文字列を、後の計算の前に弾きます。
- **`CharSpan` で部分文字列を作らない**: 途中の文字列を新しく作らずに、位置だけで読めます。

## まとめ

- `FromRoman` は、ローマ数字を右から読み、小さい文字が前にあれば引いて整数に直す。
- 読む前に、空白の除去と正しい形式かどうかの検査を行う。
- 1 回の走査で、`XIV` は `14`、`MCMXC` は `1990` になる。
