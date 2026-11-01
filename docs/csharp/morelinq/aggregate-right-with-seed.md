---
title: "列を末尾から先頭へ向かって、種の値と順に畳み込む"
description: "MoreLINQ の AggregateRight(seed, func)。列を一度リストに変えてから、末尾の要素から順に func を適用し、結果を積み上げる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/AggregateRight.cs
lines: [80, 88]
function: "MoreEnumerable.AggregateRight<TSource, TAccumulate>(IEnumerable<TSource>, TAccumulate, Func)"
difficulty: 2
format: 2
tags: [アルゴリズム, イディオム, データ構造]
---

## ひとことで

`AggregateRight(seed, func)` は、LINQ の `Aggregate` と逆向きに、**列の末尾から先頭へ** 畳み込む関数です。
たとえば `1, 2, 3` に、「要素を、今の結果の前に付け足す」処理を使うと、末尾の `3` から順に処理されて、結果は `1, 2, 3` の順に並びます。

最初の値（種 `seed`）から始めて、各要素を順に組み込んでいきます。

## コード

```csharp:line-numbers=80
        public static TAccumulate AggregateRight<TSource, TAccumulate>(this IEnumerable<TSource> source, TAccumulate seed, Func<TSource, TAccumulate, TAccumulate> func)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (func == null) throw new ArgumentNullException(nameof(func));

            var list = source.ToListLike();

            return AggregateRightImpl(list, seed, func, list.Count);
        }
```

## 前提知識

- **畳み込み（Aggregate）**: 列の要素を 1 つずつ使い、途中の結果（累積値）を更新していく処理です。合計や連結などに使われます。
- **種（seed）**: 畳み込みを始めるときの、最初の累積値です。
- **`ToListLike`**: 列を、番号で読める形（リストのような形）に変える MoreLINQ の関数です。
- **`Func<TSource, TAccumulate, TAccumulate>`**: 要素と今の累積値を受け取り、新しい累積値を返す関数です。
- **末尾から読む**: 番号を後ろから減らして読むので、末尾の要素が最初に処理されます。

## 何をしているか

### 1. 引数を確かめる

```csharp:line-numbers=82
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (func == null) throw new ArgumentNullException(nameof(func));
```

列と処理が `null` でないことを確かめます。

### 2. 列を番号で読める形にする

```csharp:line-numbers=85
            var list = source.ToListLike();
```

列をリストのような形に変えます。これで、末尾から番号で要素を読めます。

### 3. 末尾から順に畳み込む

```csharp:line-numbers=87
            return AggregateRightImpl(list, seed, func, list.Count);
```

`AggregateRightImpl` に任せます。中身は、番号を末尾から減らしながら、`func(list[i], accumulator)` を呼び、累積値を更新する処理です。

```csharp:line-numbers=125
        static TResult AggregateRightImpl<TSource, TResult>(ListLike<TSource> list, TResult accumulator, Func<TSource, TResult, TResult> func, int i)
        {
            while (i-- > 0)
            {
                accumulator = func(list[i], accumulator);
            }

            return accumulator;
        }
```

番号が 0 になるまで、末尾の要素から順に処理されるため、最後に先頭の要素が組み込まれます。

## ここがすごい

- **向きを変えるだけ**: 通常の畳み込みと同じ仕組みで、向きだけを逆にしています。
- **結果を読みやすく組める**: 末尾から組み立てるので、「先頭の要素が最後に付け足される」形の処理が、そのまま書けます。
- **列を 1 回だけ読む**: 変換の後は、番号で読むだけなので、列を再度たどる必要がありません。

## まとめ

- 列を番号で読める形にしてから、末尾の要素から順に処理する。
- 種の値から始めて、累積値を `func` で更新していく。
- 最後に先頭の要素が組み込まれ、その時点の累積値が結果になる。
