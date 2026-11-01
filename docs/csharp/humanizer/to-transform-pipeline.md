---
title: "文字列を、複数の変換を順番に通して変形する"
description: "Humanizer の To.Transform。変換の配列を Aggregate で順に適用し、前の変換の結果を次の変換の入力にする。変換の組み合わせを、1 つの関数で表す。"
language: csharp
project: "Humanizer"
repo: https://github.com/Humanizr/Humanizer
license: MIT
copyright: "Copyright (c) .NET Foundation and Contributors"
commit: "4574b93883bf48e3f0f3bca73297054537317ab2"
file: src/Humanizer/Transformer/To.cs
lines: [11, 12]
function: "To.Transform(string, IStringTransformer[])"
difficulty: 2
format: 2
tags: [イディオム, 文字列処理, 関数型]
---

## ひとことで

`Transform` は、文字列に **複数の変換を、指定した順番で次々に適用する** 関数です。
たとえば「小文字にする」「先頭を大文字にする」という 2 つの変換を並べると、その順に両方が適用されます。

変換を 1 つの関数に詰め込まず、部品として並べて組み合わせられる形にしています。

## コード

```csharp:line-numbers=11
    public static string Transform(this string input, params IStringTransformer[] transformers) =>
        transformers.Aggregate(input, (current, stringTransformer) => stringTransformer.Transform(current));
```

## 前提知識

- **`IStringTransformer`**: 文字列を受け取り、変換した文字列を返す変換の約束（インターフェース）です。
- **`params`**: 引数を、個数を決めずに並べて渡せる書き方です。
- **`Aggregate`**: 列の要素を順に使い、途中の結果を更新していく LINQ の関数です。最初の値（種）から始めます。
- **連鎖**: 前の処理の出力を、次の処理の入力にすることです。

## 何をしているか

### 1. 変換を並べた列を用意する

```csharp:line-numbers=11
    public static string Transform(this string input, params IStringTransformer[] transformers) =>
```

`transformers` は、適用する変換の一覧です。呼び出すときに、順に並べて渡します。

### 2. 入力を種として、順に変換する

```csharp:line-numbers=12
        transformers.Aggregate(input, (current, stringTransformer) => stringTransformer.Transform(current));
```

`Aggregate` は、最初の値として `input` を使います。そして、変換の一覧を先頭から順に取り出し、今の文字列にその変換を適用して、結果を次へ渡します。

最後に残った文字列が、関数の結果になります。

## ここがすごい

- **部品を組み合わせられる**: 変換を 1 つずつ書いておけば、呼び出す側が、必要な順番で組み合わせられます。
- **順番が明確**: 変換は指定された順に適用されるので、結果を予測しやすいです。
- **短い**: 変換を回す処理は、`Aggregate` の 1 行にまとまっています。

## まとめ

- 変換を、指定された順に並べる。
- 入力を種として、変換を 1 つずつ適用する。
- 最後の結果が、変換をすべて通した文字列になる。
