---
title: "同じキーを持つ要素を、最初の 1 個だけ残して取り除く"
description: "MoreLINQ の DistinctBy。要素から取り出したキーで重複を判定し、初めて出会ったキーの要素だけを返す。HashSet の Add の戻り値を使うのが仕組み。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/DistinctBy.cs
lines: [83, 94]
function: "MoreEnumerable.DistinctBy<TSource, TKey>(IEnumerable<TSource>, Func<TSource, TKey>, IEqualityComparer<TKey>?)"
difficulty: 2
format: 2
tags: [データ構造, ハッシュ, 遅延評価]
---

## ひとことで

`DistinctBy(keySelector)` は、列の中から **同じキーを持つ要素を 2 個目以降取り除く** 関数です。
たとえば、名前の長さをキーにして `["ab", "cd", "efg"]` を重複除去すると、`"ab"` と `"efg"` の 2 つが残ります。`"cd"` は `"ab"` と長さが同じなので、取り除かれます。

LINQ の `Distinct` は、要素そのものが同じかで判定します。`DistinctBy` は、要素から取り出した **キー** で判定するので、「ある項目が同じもの」を決められます。

## コード

```csharp:line-numbers=83
            static IEnumerable<TSource> _(
                IEnumerable<TSource> source,
                Func<TSource, TKey> keySelector,
                IEqualityComparer<TKey>? comparer)
            {
                var knownKeys = new HashSet<TKey>(comparer);
                foreach (var element in source)
                {
                    if (knownKeys.Add(keySelector(element)))
                        yield return element;
                }
            }
```

## 前提知識

- **キー（key）**: 要素の中から、比べたい値を 1 つ取り出したものです。ここでは `keySelector` 関数で求めます。
- **`HashSet<T>`**: 同じ値が 2 つ入らない集合です。値が既に入っているかを、速く調べられます。
- **`HashSet.Add` の戻り値**: 追加できたら `true`、既に入っていたら `false` を返します。この性質を重複判定に使います。
- **`IEqualityComparer<TKey>`**: キー同士が「同じ」かどうかを決める比較の道具です。`null` のときは、既定の比べ方を使います。
- **`yield return`**: 1 つずつ、要求されたときに値を返す書き方です。

## 何をしているか

### 1. 既出のキーを入れる集合を用意する

```csharp:line-numbers=88
                var knownKeys = new HashSet<TKey>(comparer);
```

これまでに出たキーを入れる `HashSet` を作ります。`comparer` を渡せば、比べ方も指定できます。

### 2. 1 要素ずつ、キーが新しいかを確かめる

```csharp:line-numbers=89
                foreach (var element in source)
                {
                    if (knownKeys.Add(keySelector(element)))
```

要素を先頭から順に取り出し、そのキーを `knownKeys.Add` に入れます。まだ無いキーなら `Add` が `true` になり、そのキーは初めて出たものです。

### 3. 初めてのキーの要素だけ返す

```csharp:line-numbers=92
                        yield return element;
```

`true` のときだけ、その要素を `yield return` します。2 回目以降に同じキーが来ると、`Add` は `false` を返すので、その要素は捨てられます。

## ここがすごい

- **判定と登録を 1 回で済ませる**: `Add` が「入っていたか」と「入れたか」を同時に返すので、`Contains` と `Add` の 2 回の検索が要りません。
- **元の順番を保つ**: 先頭から順に処理し、最初に出た要素を残すので、残った要素の並び順は元のままです。
- **遅延して返す**: 要素を 1 つずつ見て、必要なときに返します。全体を先に作りません。
- **比べ方を差し替えられる**: 大文字・小文字を区別しないなど、キーの比べ方を自由に決められます。

## まとめ

- `DistinctBy` は、キーで重複を判定し、初めて出た要素だけを返す。
- 重複判定には `HashSet.Add` の戻り値を使い、検索と登録を 1 回で済ませる。
- 元の順番を保ち、比べ方（`IEqualityComparer`）も指定できる。
