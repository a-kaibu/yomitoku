---
title: "途中の合計を、今の要素を含めない形で一つずつずらして返す"
description: "MoreLINQ の PreScan。種の値から始め、各要素を組み込む前の累積値を返す。Scan と違い、最後の累積値は返さず、結果の数は元の列と同じ。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/PreScan.cs
lines: [68, 84]
function: "MoreEnumerable.PreScan<TSource>(IEnumerable<TSource>, Func, TSource)"
difficulty: 2
format: 2
tags: [アルゴリズム, 遅延評価, イテレータ]
---

## ひとことで

`PreScan` は、列の **途中の累積値** を順に返す関数です。ただし、今の要素を含めず、**1 つ前までの累積値** を返します。
たとえば `1, 2, 3` を足し算で処理し、種を `0` にすると、結果は `0, 1, 3` になります。

最後の合計 `6` は返さないので、結果の数は元の列と同じ 3 個です。

## コード

```csharp:line-numbers=68
            {
                var aggregator = identity;
                using var e = source.GetEnumerator();

                if (e.MoveNext())
                {
                    yield return aggregator;
                    var current = e.Current;

                    while (e.MoveNext())
                    {
                        aggregator = transformation(aggregator, current);
                        yield return aggregator;
                        current = e.Current;
                    }
                }
            }
```

## 前提知識

- **累積値（aggregator）**: ここまでの要素を組み込んだ結果です。
- **種（identity）**: 累積値の最初の値です。足し算なら `0`、掛け算なら `1` になります。
- **`transformation`**: 今の累積値と、次の要素を受け取り、新しい累積値を返す関数です。
- **`IEnumerator<T>`**: 列を 1 つずつ進める道具です。`MoveNext()` で次へ進み、`Current` で今の要素を読みます。
- **`using var`**: この関数の終わりで、道具を自動的に片付ける書き方です。

## 何をしているか

### 1. 累積値を種で始める

```csharp:line-numbers=69
                var aggregator = identity;
                using var e = source.GetEnumerator();
```

累積値を種の値にします。列を読む道具も用意します。

### 2. 最初に種の値を返す

```csharp:line-numbers=72
                if (e.MoveNext())
                {
                    yield return aggregator;
                    var current = e.Current;
```

列に要素が 1 つでもあれば、まず種の値を返します。最初の要素は、まだ累積値に組み込みません。

### 3. 次の要素を組み込んでから返す

```csharp:line-numbers=77
                    while (e.MoveNext())
                    {
                        aggregator = transformation(aggregator, current);
                        yield return aggregator;
```

残りの要素を順に読み、今の要素を組み込んだ累積値を作って返します。ここで返すのは、組み込む前の累積値の次の値です。

### 4. 最後の要素を組み込まずに終わる

```csharp:line-numbers=81
                        current = e.Current;
                    }
                }
```

最後の要素は、組み込んでも返す相手がないので、そのまま終わります。

## ここがすごい

- **1 つずらすだけで別の結果**: 「今の要素を含む」累積値（`Scan`）と比べて、1 つずれた値を返すので、「1 つ前までの合計」が直接得られます。
- **列の長さを変えない**: 結果の数が元の列と同じなので、位置の対応が取りやすいです。
- **遅延評価**: 必要になった分だけ、1 つずつ累積値を返します。

## まとめ

- 種の値を最初に返す。
- 各要素は、返した後に累積値へ組み込む。
- 結果は、元の列と同じ数で、1 つ前までの累積値になる。
