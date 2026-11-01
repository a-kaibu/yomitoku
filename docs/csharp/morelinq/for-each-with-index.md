---
title: "列の要素と番号を組にして、順に処理を行う"
description: "MoreLINQ の ForEach(Action<T, int>)。要素と 0 から始まる番号を一緒に受け取って、各要素に処理を行う。結果を返さない、即時の処理。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/ForEach.cs
lines: [50, 58]
function: "MoreEnumerable.ForEach<T>(IEnumerable<T>, Action<T, int>)"
difficulty: 1
format: 2
tags: [イディオム, 可読性, 入出力]
---

## ひとことで

`ForEach(action)` は、列の要素を **先頭から順に** 取り出し、各要素に処理（`action`）を行う関数です。
この版では、処理に **要素と番号（0 から始まる）** の両方を渡します。

たとえば `"a", "b"` に対して使うと、`("a", 0)`、`("b", 1)` の順に処理が行われます。

## コード

```csharp:line-numbers=50
        public static void ForEach<T>(this IEnumerable<T> source, Action<T, int> action)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (action == null) throw new ArgumentNullException(nameof(action));

            var index = 0;
            foreach (var element in source)
                action(element, index++);
        }
```

## 前提知識

- **`Action<T, int>`**: 2 つの引数を受け取り、戻り値のない処理を表す関数の型です。ここでは、要素と番号が渡されます。
- **`foreach`**: 列の要素を先頭から順に取り出す繰り返しです。
- **後置増分（`index++`）**: 今の値を使ってから、1 増やす書き方です。
- **即時の処理**: `ForEach` は、呼び出した時点で処理を全部行います。結果の列は返しません。

## 何をしているか

### 1. 引数の確認

```csharp:line-numbers=52
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (action == null) throw new ArgumentNullException(nameof(action));
```

列と処理がどちらも `null` でないことを確かめます。`null` なら、例外を投げます。

### 2. 番号を 0 から用意する

```csharp:line-numbers=55
            var index = 0;
```

番号を入れる変数 `index` を、0 で用意します。

### 3. 要素と番号を組にして処理する

```csharp:line-numbers=56
            foreach (var element in source)
                action(element, index++);
```

列を先頭から順に取り出します。要素と今の番号を `action` に渡し、そのあとで番号を 1 増やします。

## ここがすごい

- **番号を自分で数えなくてよい**: 呼び出し側は、番号の管理をしなくても、番号付きの処理を書けます。
- **短く読める**: 通常の `foreach` と違い、番号を付ける処理が 1 か所にまとまっています。
- **結果を返さない**: 画面への出力や、ログの記録など、副作用のための処理に向いています。

## まとめ

- 列を先頭から順に取り出す。
- 要素と 0 から始まる番号を、一緒に `action` に渡す。
- 結果は返さず、処理だけを行う。
