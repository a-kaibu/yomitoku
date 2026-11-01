---
title: "列の一部分を、位置を指定して取り出す"
description: "MoreLINQ の Slice。開始位置と個数を指定して部分列を取り出す。配列やリストなら添字で直接読み、それ以外は Skip と Take の組み合わせで取り出す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Slice.cs
lines: [50, 69]
function: "MoreEnumerable.Slice<T>(IEnumerable<T>, int, int)"
difficulty: 2
format: 2
tags: [イテレータ, 最適化, 遅延評価]
---

## ひとことで

`Slice(startIndex, count)` は、列の `startIndex` 番目から、**`count` 個ぶん** の要素を取り出す関数です。
たとえば `{ 0, 1, 2, 3, 4 }` に `Slice(1, 3)` を使うと、`1, 2, 3` が返ります。

配列やリストは添字で直接読めるので、その性質を生かした速い経路を選んでいます。

## コード

```csharp:line-numbers=50
        public static IEnumerable<T> Slice<T>(this IEnumerable<T> sequence, int startIndex, int count)
        {
            if (sequence == null) throw new ArgumentNullException(nameof(sequence));
            if (startIndex < 0) throw new ArgumentOutOfRangeException(nameof(startIndex));
            if (count < 0) throw new ArgumentOutOfRangeException(nameof(count));

            return sequence switch
            {
                IList<T> list => SliceList(startIndex, count, list.Count, i => list[i]),
                IReadOnlyList<T> list => SliceList(startIndex, count, list.Count, i => list[i]),
                var seq => seq.Skip(startIndex).Take(count)
            };

            static IEnumerable<T> SliceList(int startIndex, int count, int listCount, Func<int, T> indexer)
            {
                var countdown = count;
                var index = startIndex;
                while (index < listCount && countdown-- > 0)
                    yield return indexer(index++);
            }
```

## 前提知識

- **部分列（ぶぶんれつ）**: 元の列の一部分を取り出した列です。
- **添字（そえじ）**: 列の中の位置を表す番号です。0 から始まります。
- **`IList<T>` と `IReadOnlyList<T>`**: 添字で要素を直接読める列の型です。`list[i]` のように書けます。
- **`Skip` と `Take`**: `Skip(n)` は最初の n 個を飛ばし、`Take(n)` は先頭から n 個を取り出す LINQ の関数です。
- **`switch` 式**: 値の型によって、処理を振り分ける書き方です。

## 何をしているか

### 1. 引数を確かめる

```csharp:line-numbers=52
            if (sequence == null) throw new ArgumentNullException(nameof(sequence));
            if (startIndex < 0) throw new ArgumentOutOfRangeException(nameof(startIndex));
            if (count < 0) throw new ArgumentOutOfRangeException(nameof(count));
```

`sequence` が `null` でないか、開始位置と個数がマイナスでないかを確かめます。

### 2. 添字で読める列は、直接取り出す

```csharp:line-numbers=56
            return sequence switch
            {
                IList<T> list => SliceList(startIndex, count, list.Count, i => list[i]),
                IReadOnlyList<T> list => SliceList(startIndex, count, list.Count, i => list[i]),
                var seq => seq.Skip(startIndex).Take(count)
```

列が `IList<T>` か `IReadOnlyList<T>` なら、`SliceList` に添字の読み方を渡します。これなら、飛ばす要素を 1 つずつ読む必要がありません。

### 3. その他の列は Skip と Take で

```csharp:line-numbers=60
                var seq => seq.Skip(startIndex).Take(count)
```

添字で読めない列は、`Skip(startIndex).Take(count)` で取り出します。こちらは先頭から読みながら進みます。

### 4. 添字で取り出す処理

```csharp:line-numbers=63
            static IEnumerable<T> SliceList(int startIndex, int count, int listCount, Func<int, T> indexer)
            {
                var countdown = count;
                var index = startIndex;
                while (index < listCount && countdown-- > 0)
                    yield return indexer(index++);
```

`SliceList` は、残りの個数（`countdown`）と現在の位置（`index`）を持ち、列の終わりか個数の上限まで、添字を進めながら値を返します。

## ここがすごい

- **添字の列は速い**: 最初の位置まで読み飛ばさず、目的の位置から直接読めます。長い列でも、取り出す個数の分だけ作業します。
- **型で経路を選ぶ**: 同じ関数の中で、列の性質に合わせて最適な方法を選んでいます。呼び出す側は何も気にしなくて済みます。
- **列の終わりを越えない**: `index < listCount` の条件により、列より長い個数を指定しても、存在する分だけを返します。
- **遅延して返す**: 結果を先に配列にせず、必要なときに 1 つずつ返します。

## まとめ

- `Slice` は、開始位置と個数を指定して、列の一部分を取り出す。
- 添字で読める列は直接読み、それ以外は `Skip` と `Take` で取り出す。
- 列の終わりを超えず、存在する分だけを遅延して返す。
