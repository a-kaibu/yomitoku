---
title: "条件に合う要素と合わない要素を、2 つの列に分ける"
description: "MoreLINQ の Partition。述語で全要素を「真」と「偽」に振り分け、2 つの列を組で返す。内部では GroupBy で同じキーの要素をまとめ、そのグループを取り出している。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Partition.cs
lines: [83, 91]
function: "MoreEnumerable.Partition<T, TResult>(IEnumerable<T>, Func<T, bool>, Func<IEnumerable<T>, IEnumerable<T>, TResult>)"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, 関数型]
---

## ひとことで

`Partition(predicate)` は、列の要素を **条件に合うものと合わないもの** の 2 つに分けます。
たとえば `1, 2, 3, 4, 5` を「偶数か」で分けると、偶数の `2, 4` と、奇数の `1, 3, 5` の 2 つの列になります。

結果は、`(True, False)` という組で受け取れます。分けたい基準を、1 つの関数で与えるだけで済みます。

## コード

```csharp:line-numbers=83
        public static TResult Partition<T, TResult>(this IEnumerable<T> source,
            Func<T, bool> predicate, Func<IEnumerable<T>, IEnumerable<T>, TResult> resultSelector)
        {
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (predicate == null) throw new ArgumentNullException(nameof(predicate));
            if (resultSelector == null) throw new ArgumentNullException(nameof(resultSelector));

            return source.GroupBy(predicate).Partition(resultSelector);
        }
```

## 前提知識

- **述語（predicate）**: 要素を受け取り、条件に合うかを `true` か `false` で返す関数です。
- **`GroupBy`**: 要素を、キーの値ごとに 1 つのグループにまとめる LINQ の関数です。ここでは、キーが `true` か `false` になります。
- **`IGrouping<TKey, TElement>`**: 同じキーを持つ要素の集まりです。キーとあわせて列として読めます。
- **タプル**: 2 つ以上の値を 1 つにまとめた組です。`(True, False)` の形で、2 つの列を一緒に返します。
- **`resultSelector`**: 2 つの列を受け取り、最終的な結果の形に変える関数です。

## 何をしているか

### 1. 引数を確かめる

```csharp:line-numbers=86
            if (source == null) throw new ArgumentNullException(nameof(source));
            if (predicate == null) throw new ArgumentNullException(nameof(predicate));
            if (resultSelector == null) throw new ArgumentNullException(nameof(resultSelector));
```

元の列、述語、結果の関数が `null` でないかを確かめます。

### 2. 述語でグループに分ける

```csharp:line-numbers=90
            return source.GroupBy(predicate).Partition(resultSelector);
```

`source.GroupBy(predicate)` で、述語の結果（`true` / `false`）ごとに要素をまとめます。そのグループの組を、`Partition` の内部の処理に渡します。

### 3. 2 つの列を組にして返す

ふつうに使う場合の、タプルを返す版は、この関数を次のように呼んでいます。

```csharp:line-numbers=48
        public static (IEnumerable<T> True, IEnumerable<T> False)
            Partition<T>(this IEnumerable<T> source, Func<T, bool> predicate) =>
            source.Partition(predicate, ValueTuple.Create);
```

`ValueTuple.Create` を結果の関数として渡すので、`(True, False)` の組が返ります。

## ここがすごい

- **条件で一度に分けられる**: 分けたい条件を 1 つだけ書けば、2 つの列が同時に得られます。
- **既存の仕組みを組み合わせる**: 新たに振り分けの仕組みを作らず、`GroupBy` に任せています。
- **結果の形を選べる**: `resultSelector` で、組でも別の値でも、好きな形にまとめられます。
- **注意点**: `GroupBy` は、グループを作るために、全要素を先に読みます。長い列では、読み込みと保持のコストがかかる点に注意が必要です。

## まとめ

- `Partition` は、述語で列を「真」と「偽」の 2 つに分け、組で返す。
- 内部では `GroupBy` で同じキーの要素をまとめて、グループを取り出している。
- `GroupBy` は全要素を先に読むので、大きな列ではメモリの使用量に注意する。
