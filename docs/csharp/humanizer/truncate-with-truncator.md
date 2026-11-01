---
title: "指定した切り詰め方で、文字列を短くする"
description: "Humanizer の Truncate（ITruncator を指定する形）。null なら null を返し、そうでなければ渡された切り詰めの方法に処理を任せる。切り詰める位置や記号は呼び出し側が決める。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/TruncateExtensions.cs
lines: [116, 127]
function: "TruncateExtensions.Truncate(string?, int, string?, ITruncator, TruncateFrom)"
difficulty: 2
format: 2
tags: [文字列処理, 防御的プログラミング, 型システム]
---

## ひとことで

`Truncate` は、長い文字列を **指定した長さまで短くする** 関数です。
たとえば `"This is a long string"` を、省略の記号 `"..."` を使って長さ 10 に切り詰めると、`"This is..."` になります。

切り詰める方法そのものは、`ITruncator` という部品に任せています。この関数は、`null` の確認と、部品への受け渡しだけを行います。

## コード

```csharp:line-numbers=116
    [return: NotNullIfNotNull(nameof(input))]
    public static string? Truncate(this string? input, int length, string? truncationString, ITruncator truncator, TruncateFrom from = TruncateFrom.Right)
    {
        ArgumentNullException.ThrowIfNull(truncator);

        if (input == null)
        {
            return null;
        }

        return truncator.Truncate(input, length, truncationString, from);
    }
```

## 前提知識

- **`ITruncator`**: 切り詰めの方法を表す約束（インターフェース）です。どこで切るか、長さをどう数えるかを決めます。
- **`TruncateFrom`**: 切り詰めを、文字列の左から行うか、右から行うかを表す列挙型です。
- **`ArgumentNullException.ThrowIfNull`**: 引数が `null` なら、例外を投げる .NET の関数です。
- **`NotNullIfNotNull` 属性**: 入力が `null` でなければ、戻り値も `null` ではないことを、コンパイラに伝える印です。

## 何をしているか

### 1. 切り詰めの方法が `null` でないか確かめる

```csharp:line-numbers=119
        ArgumentNullException.ThrowIfNull(truncator);
```

切り詰めの部品が `null` なら、例外を投げます。切り詰めができないためです。

### 2. 文字列が `null` なら、そのまま null

```csharp:line-numbers=121
        if (input == null)
        {
            return null;
        }
```

入力が `null` なら、切り詰める対象がないので、`null` を返します。

### 3. 切り詰めの部品に任せる

```csharp:line-numbers=126
        return truncator.Truncate(input, length, truncationString, from);
```

それ以外は、`ITruncator` に、文字列、長さ、省略の記号、切り詰める側を渡して、結果を返してもらいます。

## ここがすごい

- **方法を差し替えられる**: 切り詰め方の部品を渡すので、用途に合わせて、いろいろな切り詰め方を使えます。
- **`null` の扱いが明確**: 入力が `null` なら `null` を返すので、呼び出し側は null 判定を続けて書けます。
- **役割が分かれている**: この関数は確認と受け渡しだけで、実際の切り詰めは部品が担当します。

## まとめ

- 切り詰めの部品が `null` なら例外にする。
- 入力が `null` なら、`null` を返す。
- それ以外は、部品に文字列と条件を渡して、結果を返してもらう。
