---
title: "列の要素を流しながら、途中で別の処理を行う"
description: "MoreLINQ の Pipe。各要素を返す前に指定した処理（Action）を実行する。要素の中身は変えず、途中の様子を見るのに使う。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Pipe.cs
lines: [48, 55]
function: "MoreEnumerable.Pipe<T>(IEnumerable<T>, Action<T>)"
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, 入出力]
---

## ひとことで

`Pipe(action)` は、列の要素を **変えずに通しながら**、各要素に対して `action` という処理を実行する関数です。
たとえば、列を流している途中で、要素をログに書き出したり、数を数えたりするのに使えます。

返される列の中身は、元の列とまったく同じです。

## コード

```csharp:line-numbers=48
            static IEnumerable<T> _(IEnumerable<T> source, Action<T> action)
            {
                foreach (var element in source)
                {
                    action(element);
                    yield return element;
                }
            }
```

## 前提知識

- **`Action<T>`**: 要素を 1 つ受け取り、何かを行う（戻り値はない）関数の型です。
- **`foreach`**: 列の要素を先頭から順に取り出す繰り返しです。
- **`yield return`**: 値を 1 つずつ返す書き方です。遅延評価（必要になったときに 1 つずつ計算すること）に使われます。
- **遅延評価**: 列を作った時点ではなく、実際に読み出されたときに処理が動く仕組みです。

## 何をしているか

### 1. 要素を 1 つずつ取り出す

```csharp:line-numbers=50
                foreach (var element in source)
                {
```

`foreach` で、元の列の要素を先頭から取り出します。

### 2. 指定された処理を実行する

```csharp:line-numbers=52
                    action(element);
```

取り出した要素を `action` に渡して、処理を実行します。ここでは要素の値は変わりません。

### 3. 要素をそのまま返す

```csharp:line-numbers=53
                    yield return element;
```

同じ要素を、そのまま結果として返します。

## ここがすごい

- **元の列を変えない**: 要素を変換せず、そのまま流します。副作用（画面やログへの出力など）だけを追加できます。
- **遅延評価で動く**: `Pipe` を書いた時点では、何も実行されません。列を読んだときに、1 つずつ `action` が呼ばれます。
- **連鎖できる**: `Select` や `Where` と同じように、LINQ の処理の途中に挟めます。

## まとめ

- 各要素に `action` を実行してから、そのまま返す。
- 元の列の中身は変わらない。
- 列を実際に読むまで、`action` は実行されない。
