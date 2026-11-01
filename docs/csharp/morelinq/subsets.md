---
title: "空集合から元の集合まで、すべての部分集合を順に作る"
description: "与えられた列のすべての部分集合を、サイズの小さい順に生成する MoreLINQ の Subsets。空集合と元の集合を特別扱いして、再帰を外側の 1 段で済ませる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Subsets.cs
lines: [50, 78]
function: "MoreEnumerable.Subsets"
difficulty: 2
format: 2
tags: [アルゴリズム, イテレータ, 再帰]
---

## ひとことで

`Subsets` は、列の **すべての部分集合**（要素を一部だけ選んだ組み合わせ）を返す関数です。
たとえば `[1, 2]` の部分集合は `[]`、`[1]`、`[2]`、`[1, 2]` の 4 つです。

要素が n 個あれば部分集合は 2ⁿ 個あるので、列は大きくなるとすぐに膨らみます。この関数は、それを 1 つずつ `yield` で返します。

## コード

::: code-group

```csharp:line-numbers=50 [日本語訳]
        public static IEnumerable<IList<T>> Subsets<T>(this IEnumerable<T> sequence)
        {
            if (sequence == null) throw new ArgumentNullException(nameof(sequence));

            return _(sequence);

            static IEnumerable<IList<T>> _(IEnumerable<T> sequence)
            {
                var sequenceAsList = sequence.ToList();
                var sequenceLength = sequenceAsList.Count;

                yield return []; // 最初の部分集合は空集合

                // 次の確認は、空の集合の順列を扱う場合も解決する。
                if (sequenceLength is 0)
                    yield break;

                // それ以外の部分集合は、部分集合の生成器を使って計算する…

                for (var k = 1; k < sequenceLength; k++)
                {
                    // 途中の各部分集合は、辞書順に並んだ K 個の部分集合である。
                    foreach (var subset in Subsets(sequenceAsList, k))
                        yield return subset;
                }

                yield return sequenceAsList; // 最後の部分集合は元の集合そのもの。
            }
        }
```

```csharp:line-numbers=50 [原文]
        public static IEnumerable<IList<T>> Subsets<T>(this IEnumerable<T> sequence)
        {
            if (sequence == null) throw new ArgumentNullException(nameof(sequence));

            return _(sequence);

            static IEnumerable<IList<T>> _(IEnumerable<T> sequence)
            {
                var sequenceAsList = sequence.ToList();
                var sequenceLength = sequenceAsList.Count;

                yield return []; // the first subset is the empty set

                // next check also resolves the case of permuting empty sets
                if (sequenceLength is 0)
                    yield break;

                // all other subsets are computed using the subset generator...

                for (var k = 1; k < sequenceLength; k++)
                {
                    // each intermediate subset is a lexographically ordered K-subset
                    foreach (var subset in Subsets(sequenceAsList, k))
                        yield return subset;
                }

                yield return sequenceAsList; // the last subset is the original set itself
            }
        }
```

:::

## 前提知識

- **部分集合**: 元の集合から 0 個以上の要素を選んだ組み合わせのことです。空集合（何も選ばない）も含みます。
- **`[]`（コレクション式）**: 空のリストを表す C# の書き方です。
- **`ToList()`**: 列をいったんリストにします。後で個数を数えたり、番号で読んだりできます。
- **`yield break`**: 列を終わらせます。
- **`Subsets(sequenceAsList, k)`**: 同じクラスにある別の関数で、「サイズ `k` の部分集合」だけを返します。ここではその結果を、サイズの小さいものから順に返しています。

## 何をしているか

### 1. 空集合と、要素が 0 個の場合を扱う

```csharp:line-numbers=58
                var sequenceAsList = sequence.ToList();
                var sequenceLength = sequenceAsList.Count;

                yield return []; // 最初の部分集合は空集合

                // 次の確認は、空の集合の順列を扱う場合も解決する。
                if (sequenceLength is 0)
                    yield break;
```

最初の部分集合は必ず空集合 `[]` です。元の列が空なら、空集合だけを返して終わります。

### 2. サイズ 1 から n − 1 までを順に返す

```csharp:line-numbers=67
                // それ以外の部分集合は、部分集合の生成器を使って計算する…

                for (var k = 1; k < sequenceLength; k++)
                {
                    // 途中の各部分集合は、辞書順に並んだ K 個の部分集合である。
                    foreach (var subset in Subsets(sequenceAsList, k))
                        yield return subset;
                }
```

サイズ `k` の部分集合を、`k = 1` から `k = n - 1` まで順に返します。それぞれの中身は、`Subsets(sequenceAsList, k)` が作ります。

### 3. 元の集合そのものを最後に返す

```csharp:line-numbers=76
                yield return sequenceAsList; // 最後の部分集合は元の集合そのもの。
```

元の列の全部を最後に返します。これで、サイズの小さい順に並んだすべての部分集合が得られます。

`[1, 2]` では、`[]`、`[1]`、`[2]`、`[1, 2]` の順です。

## ここがすごい

- **端の場合を別に書く**: 空集合と元の集合は、サイズの計算の中に入れずに、最初と最後に直接返しています。だから中の計算は「サイズが 1 以上 n 未満」だけを扱えばよく、単純になります。
- **列を先にリストにする**: 同じ列を何度も読むので、最初に 1 回だけ `ToList()` しています。元の列が一度しか読めない（ファイルの読み込みなど）場合でも安全です。
- **サイズの順に並ぶ**: 「小さい組み合わせから大きいものへ」と並ぶので、結果を眺めるときに分かりやすくなります。
- **メモリを抑える**: 部分集合を全部覚えておくのではなく、1 つずつ `yield` で返すので、大きな列でも一度に全部のメモリを使いません（ただし件数は 2ⁿ 個です）。

## まとめ

- 部分集合は、空集合と元の集合を端として別に書くと分かりやすい。
- サイズ順に作れば、結果の順番が予測しやすい。
- 数が指数的に増える問題は、`yield` で 1 つずつ返すと扱いやすい。
