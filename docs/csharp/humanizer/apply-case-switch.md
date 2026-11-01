---
title: "文字列を指定した大文字・小文字の形式に変換する"
description: "Humanizer の ApplyCase。LetterCasing の値に応じて、Title、小文字、大文字、文頭だけ大文字の変換を switch 式で選ぶ。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/CasingExtensions.cs
lines: [29, 37]
function: "CasingExtensions.ApplyCase(string, LetterCasing)"
difficulty: 1
format: 2
tags: [文字列処理, イディオム, エラー処理]
---

## ひとことで

`ApplyCase` は、文字列を **指定された書式（大文字・小文字のルール）に変換する** 関数です。
たとえば `"some string"` に `LetterCasing.Title` を指定すると、`"Some String"` になります。

変換の中身は、ここでは選ぶだけで、実際の変換は別の関数に任せています。

## コード

```csharp:line-numbers=29
    public static string ApplyCase(this string input, LetterCasing casing) =>
        casing switch
        {
            LetterCasing.Title => input.Transform(To.TitleCase),
            LetterCasing.LowerCase => input.Transform(To.LowerCase),
            LetterCasing.AllCaps => input.Transform(To.UpperCase),
            LetterCasing.Sentence => input.Transform(To.SentenceCase),
            _ => throw new ArgumentOutOfRangeException(nameof(casing))
        };
```

## 前提知識

- **`LetterCasing`**: 大文字・小文字の書式を表す列挙型です。`Title`、`LowerCase`、`AllCaps`、`Sentence` などの値があります。
- **`switch` 式**: 値によって結果を選ぶ式です。`case => 結果` の形で並べ、`=>` で結果を書きます。
- **`_` パターン**: どの値にも当てはまる、最後の受け皿（既定の場合）を表します。
- **式形式のメンバ（`=>`）**: 1 行の式で、メソッドの中身を書く書き方です。
- **`ArgumentOutOfRangeException`**: 引数の値が想定の範囲外のときに投げる例外です。

## 何をしているか

### 1. 指定された書式を見る

```csharp:line-numbers=30
        casing switch
        {
```

`casing` の値を `switch` で調べます。式全体の結果が、この関数の結果になります。

### 2. 書式ごとに変換を選ぶ

```csharp:line-numbers=32
            LetterCasing.Title => input.Transform(To.TitleCase),
            LetterCasing.LowerCase => input.Transform(To.LowerCase),
            LetterCasing.AllCaps => input.Transform(To.UpperCase),
            LetterCasing.Sentence => input.Transform(To.SentenceCase),
```

`Title` なら単語の先頭を大文字にする変換、`LowerCase` なら小文字にする変換、といったように、書式に合った変換の関数（`To.TitleCase` など）を `Transform` に渡します。

### 3. 想定外の値は例外にする

```csharp:line-numbers=36
            _ => throw new ArgumentOutOfRangeException(nameof(casing))
```

列挙型には、定義されていない値も入ることがあります。どの書式にも当てはまらない場合は、例外を投げて知らせます。

## ここがすごい

- **分岐が一覧で読める**: `switch` 式なので、書式と変換の対応が 1 行ずつ並び、読みやすくなっています。
- **変換の仕事を分けている**: 「どの書式か」の選択と、「実際の変換」を別々の関数に分けています。
- **想定外を黙らせない**: 最後の `_` で例外を投げるので、定義漏れがあればすぐ分かります。

## まとめ

- `LetterCasing` の値を `switch` 式で調べる。
- 書式ごとに、対応する変換を `Transform` に渡す。
- 想定外の値は例外にして、知らせる。
