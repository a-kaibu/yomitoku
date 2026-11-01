---
title: "文字列を切るとき、単語の途中で切れないように手前へ戻す"
description: "Humanizer の TruncateFromRight。指定の長さに収めるため末尾を省略記号に置き換えるとき、切る位置が単語の途中なら、直前の空白まで戻して単語を残さない。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/Truncation/DynamicLengthAndPreserveWordsTruncator.cs
lines: [83, 110]
function: "DynamicLengthAndPreserveWordsTruncator.TruncateFromRight(string, int, string)"
difficulty: 2
format: 2
tags: [文字列処理, 可読性, 防御的プログラミング]
---

## ひとことで

`TruncateFromRight` は、長い文字列を **指定の長さに収める** ために、末尾を `...` などの省略記号に置き換える処理です。
たとえば `The quick brown fox jumps` を長さ 12 に収めると、`The quick...` になります。

単純に文字数で切ると、`The quick bro...` のように単語の途中で切れてしまいます。この関数は、それを避けます。

## コード

::: code-group

```csharp:line-numbers=83 [日本語訳]
    static string TruncateFromRight(string value, int length, string truncationString)
    {
        var effectiveLength = length - truncationString.Length;
        if (effectiveLength <= 0)
        {
            return truncationString;
        }
        // 切る位置が単語の途中なら、直前の単語の区切りまで戻す。
        if (effectiveLength < value.Length && !char.IsWhiteSpace(value[effectiveLength]))
        {
            var lastSpace = LastIndexOfWhiteSpace(value, effectiveLength);
            if (lastSpace > 0)
            {
                effectiveLength = lastSpace;
            }
            else
            {
                return truncationString;
            }
        }
        var prefix = value[..effectiveLength].TrimEnd();
        if (prefix.Length == 0)
        {
            return truncationString;
        }

        return prefix + truncationString;
    }
```

```csharp:line-numbers=83 [原文]
    static string TruncateFromRight(string value, int length, string truncationString)
    {
        var effectiveLength = length - truncationString.Length;
        if (effectiveLength <= 0)
        {
            return truncationString;
        }
        // If the cutoff falls in the middle of a word, backtrack to the last word boundary.
        if (effectiveLength < value.Length && !char.IsWhiteSpace(value[effectiveLength]))
        {
            var lastSpace = LastIndexOfWhiteSpace(value, effectiveLength);
            if (lastSpace > 0)
            {
                effectiveLength = lastSpace;
            }
            else
            {
                return truncationString;
            }
        }
        var prefix = value[..effectiveLength].TrimEnd();
        if (prefix.Length == 0)
        {
            return truncationString;
        }

        return prefix + truncationString;
    }
```

:::

## 前提知識

- **省略記号（truncation string）**: 切った後に付ける記号です。ここでは `...` などを指します。
- **空白文字**: スペースや改行などの、単語の区切りになる文字です。
- **`char.IsWhiteSpace`**: 1 文字が空白かどうかを調べる、標準の関数です。
- **`value[..n]`（範囲の指定）**: 先頭から `n` 文字目の手前までを取り出す書き方です。
- **`TrimEnd`**: 文字列の末尾の空白を取り除きます。

## 何をしているか

### 1. 省略記号の分を残す

```csharp:line-numbers=85
        var effectiveLength = length - truncationString.Length;
        if (effectiveLength <= 0)
        {
            return truncationString;
        }
```

全体の長さから省略記号の長さを引いて、本文に使える長さを求めます。残りがなければ、省略記号だけを返します。

### 2. 切る位置が単語の途中か調べる

```csharp:line-numbers=90
        // 切る位置が単語の途中なら、直前の単語の区切りまで戻す。
        if (effectiveLength < value.Length && !char.IsWhiteSpace(value[effectiveLength]))
        {
            var lastSpace = LastIndexOfWhiteSpace(value, effectiveLength);
            if (lastSpace > 0)
            {
                effectiveLength = lastSpace;
            }
```

切る位置の文字が空白でなければ、単語の途中で切ろうとしています。その場合は、`LastIndexOfWhiteSpace` で直前の空白の位置まで戻します。

```csharp:line-numbers=98
            else
            {
                return truncationString;
            }
```

直前に空白が見つからない場合は、単語を 1 つも残せないので、省略記号だけを返します。

### 3. 末尾の空白を取って、省略記号を付ける

```csharp:line-numbers=103
        var prefix = value[..effectiveLength].TrimEnd();
        if (prefix.Length == 0)
        {
            return truncationString;
        }

        return prefix + truncationString;
```

切った文字列の末尾の空白を取り除き、空でなければ省略記号を付けて返します。

### 具体例で確かめる

`The quick brown fox jumps` を、省略記号 `...` で長さ 13 に収めます。

```
本文の長さ = 13 - 3 = 10
value[10] = 'b'（空白ではない）→ 直前の空白は位置 9
prefix = "The quick"（末尾の空白なし）
結果 = "The quick..."
```

## ここがすごい

- **単語を壊さない**: 切る位置が単語の途中なら、直前の区切りまで戻すので、読みやすさが保たれます。
- **切る位置の判定が 1 回**: 空白かどうかを 1 文字だけ見て、戻すかどうかを決めます。
- **省略記号が長すぎても壊れない**: 本文に使える長さが 0 以下なら、省略記号だけを返し、負の範囲を読みません。
- **末尾の空白を整える**: `TrimEnd` で、`quick ...` のような不自然な空白を防ぎます。

## まとめ

- `TruncateFromRight` は、末尾を省略記号に置き換えて、指定の長さに収める。
- 切る位置が単語の途中なら、直前の空白まで戻して単語を残さない。
- 本文の長さが足りないときは、省略記号だけを返して安全に終える。
