---
title: "要素と、その位置の番号を組にして取り出す"
description: "MoreLINQ の Index。列の各要素に 0 からの番号（または開始番号）を付けて、番号と値の組として返す。foreach で位置を知りたいときに使う。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Index.cs
lines: [54, 58]
function: "MoreEnumerable.Index<TSource>(IEnumerable<TSource>, int)"
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, イディオム]
---

## ひとことで

`Index` は、列の各要素に **番号を付けて**、`番号と値の組` として返す関数です。
たとえば `["a", "b", "c"]` は、`(0, "a")`, `(1, "b")`, `(2, "c")` になります。

通常の `foreach` では、今何番目かを自分で数える必要があります。この関数を使うと、番号を一緒に受け取れます。

## コード

```csharp:line-numbers=54
        public static IEnumerable<KeyValuePair<int, TSource>> Index<TSource>(this IEnumerable<TSource> source, int startIndex)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            return source.Select((item, index) => new KeyValuePair<int, TSource>(startIndex + index, item));
        }
```

## 前提知識

- **`KeyValuePair<TKey, TValue>`**: 2 つの値を、「キー」と「値」の組として持つ型です。ここでは「番号（キー）」と「要素（値）」の組です。
- **`Select` の番号付き版**: `Select((item, index) => ...)` は、要素と、その位置（0 から始まる番号）を受け取れます。
- **`startIndex`**: 番号を何から数えるかを指定する値です。`0` を渡せば、通常どおり 0 から始まります。
- **遅延評価**: 結果を先に全部作らず、取り出されるたびに計算する仕組みです。

## 何をしているか

### 1. 引数を確かめる

```csharp:line-numbers=56
            if (source == null) throw new ArgumentNullException(nameof(source));
```

`source` が `null` なら、例外で知らせます。

### 2. 番号と要素の組を作る

```csharp:line-numbers=57
            return source.Select((item, index) => new KeyValuePair<int, TSource>(startIndex + index, item));
```

`Select` を使い、`startIndex + index` を番号、`item` を値として組を作ります。`startIndex` を足すので、開始番号を自由に決められます。

### 使い方の例

```csharp
var names = new[] { "a", "b", "c" };
foreach (var pair in names.Index(1))
    Console.WriteLine($"{pair.Key}: {pair.Value}");
// 1: a
// 2: b
// 3: c
```

開始番号を `1` にすると、番号が 1 から始まります。

## ここがすごい

- **番号を自分で数えなくてよい**: 位置を管理する変数が要りません。書き忘れやずれを防げます。
- **開始番号を選べる**: 1 から数えたい表示や、別の列の続きの番号にも使えます。
- **既存の `Select` の仕組みを使う**: 新しい仕組みを作らず、標準の `Select` の番号付き版に任せています。
- **遅延して返す**: 列の長さが大きくても、必要な分だけ組を作ります。

## まとめ

- `Index` は、要素に番号を付けて、番号と値の組として返す。
- 開始番号は指定でき、省略すると 0 から数える。
- 位置を自分で数える代わりに、番号付きの組を `foreach` で受け取れる。
