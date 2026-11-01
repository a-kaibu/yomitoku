---
title: "列を一定の個数ごとのかたまりに分けて返す"
description: "MoreLINQ の Batch。列の要素を size 個ずつのバケツに分け、最後の余りも別のバケツとして返す。一度に全部を読まずに、かたまり単位で処理したいときに使う。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Batch.cs
lines: [125, 148]
function: "MoreEnumerable.Batch<TSource, TResult>(IEnumerable<TSource>, int, Func<TSource[], TResult>)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Batch` は、列を **`size` 個ずつのかたまり（バケツ）** に分けて、順に返す関数です。
たとえば `1` から `7` までの列を `size = 3` で分けると、`[1, 2, 3]`, `[4, 5, 6]`, `[7]` の 3 つになります。

大量のデータを、一定の数ずつ DB への書き込みや API の送信に分けるときに役立ちます。

## コード

::: code-group

```csharp:line-numbers=125 [日本語訳]
                        TSource[]? bucket = null;
                        var count = 0;

                        foreach (var item in source)
                        {
                            bucket ??= new TSource[size];
                            bucket[count++] = item;

                            // バケツは、いっぱいになるまで全部メモリに溜めてから返す。
                            if (count != size)
                                continue;

                            yield return resultSelector(bucket);

                            bucket = null;
                            count = 0;
                        }

                        // 最後に、残りの要素が入ったバケツを返す。
                        if (count > 0)
                        {
                            Array.Resize(ref bucket, count);
                            yield return resultSelector(bucket);
                        }
```

```csharp:line-numbers=125 [原文]
                        TSource[]? bucket = null;
                        var count = 0;

                        foreach (var item in source)
                        {
                            bucket ??= new TSource[size];
                            bucket[count++] = item;

                            // The bucket is fully buffered before it's yielded
                            if (count != size)
                                continue;

                            yield return resultSelector(bucket);

                            bucket = null;
                            count = 0;
                        }

                        // Return the last bucket with all remaining elements
                        if (count > 0)
                        {
                            Array.Resize(ref bucket, count);
                            yield return resultSelector(bucket);
                        }
```

:::

## 前提知識

- **バケツ**: この関数では、要素を一時的に入れておく配列のことです。
- **`TSource[]`**: 要素の型の配列です。`int` の列なら `int[]` になります。
- **`resultSelector`**: バケツを受け取り、別の値に変換する関数です。`Batch(3)` では、バケツの配列をそのまま返すので、変換は不要です。
- **`foreach`**: 列の要素を 1 つずつ取り出す書き方です。
- **`Array.Resize`**: 配列の長さを変えます。最後のバケツが `size` 個に満たないときに、長さを切り詰めるために使います。

## 何をしているか

### 1. バケツに要素を入れる

```csharp:line-numbers=126
                        var count = 0;

                        foreach (var item in source)
                        {
                            bucket ??= new TSource[size];
                            bucket[count++] = item;
```

まだ作っていないときだけ、`size` 個入る配列を作ります。`bucket[count++]` で、要素を先頭から順に入れます。

### 2. いっぱいになったら返す

```csharp:line-numbers=133
                            // バケツは、いっぱいになるまで全部メモリに溜めてから返す。
                            if (count != size)
                                continue;

                            yield return resultSelector(bucket);

                            bucket = null;
                            count = 0;
```

バケツの要素数が `size` に達したら、`resultSelector` に渡して返します。その後、バケツと数を空に戻して、次のかたまりに備えます。

### 3. 余りを返す

```csharp:line-numbers=143
                        // 最後に、残りの要素が入ったバケツを返す。
                        if (count > 0)
                        {
                            Array.Resize(ref bucket, count);
                            yield return resultSelector(bucket);
                        }
```

列の最後に要素が残っていれば、配列を残りの長さに切り詰めて、最後のバケツとして返します。

## ここがすごい

- **全部を先に読まない**: かたまりが揃った時点で返すので、大きな列でも一度に抱え込まずに済みます。
- **最後の余りを逃さない**: 割り切れなかった要素も、最後のバケツとして必ず返します。
- **変換を後から差し込める**: `resultSelector` を渡せば、かたまりを別の値に変換して返せます。
- **空の列には何も返さない**: 要素が 1 つもなければ、バケツは作られず、何も返りません。

## まとめ

- `Batch` は、列を `size` 個ずつのバケツに分けて順に返す。
- いっぱいになったバケツはすぐ返し、最後の余りも忘れず返す。
- `resultSelector` を使うと、バケツを別の値に変換できる。
