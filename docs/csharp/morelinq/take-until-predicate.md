---
title: "条件に合う要素を含めて、そこで列を打ち切る"
description: "MoreLINQ の TakeUntil。要素を返してから条件を調べ、条件を満たしたらそこで止める。条件に合う要素も結果に含まれる点がポイント。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/TakeUntil.cs
lines: [62, 70]
function: "MoreEnumerable.TakeUntil<TSource>(IEnumerable<TSource>, Func<TSource, bool>)"
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, 探索]
---

## ひとことで

`TakeUntil(predicate)` は、列の要素を先頭から順に返し、**条件を満たす要素を返したら、そこで止める** 関数です。
たとえば `1, 2, 3, 4` に「3 以上」という条件で `TakeUntil` を使うと、`1, 2, 3` が返ります。

条件を満たす要素も、結果に含まれます。

## コード

```csharp:line-numbers=62
            static IEnumerable<TSource> _(IEnumerable<TSource> source, Func<TSource, bool> predicate)
            {
                foreach (var item in source)
                {
                    yield return item;
                    if (predicate(item))
                        yield break;
                }
            }
```

## 前提知識

- **`Func<TSource, bool>`**: 要素を受け取り、`true` か `false` を返す関数の型です。ここでは「ここで止める」という条件を表します。
- **`foreach`**: 列の要素を先頭から順に取り出す繰り返しです。
- **`yield return`**: 値を 1 つずつ返す書き方です。遅延評価（必要になったときに 1 つずつ計算すること）に使われます。
- **`yield break`**: 列の終わりを示して、それ以上の値を返さない書き方です。

## 何をしているか

### 1. 要素を順に取り出す

```csharp:line-numbers=64
                foreach (var item in source)
                {
```

`foreach` で、列の要素を先頭から 1 つずつ取り出します。

### 2. 要素を返してから、条件を調べる

```csharp:line-numbers=66
                    yield return item;
                    if (predicate(item))
                        yield break;
```

要素を先に返し、そのあとで条件を調べます。先に返すので、条件を満たした要素も結果に残ります。

### 3. 条件を満たしたら止める

```csharp:line-numbers=69
                }
```

条件が `true` だったら、`yield break` で列を終わらせます。それより後ろの要素は、読まれずに終わります。

## ここがすごい

- **`TakeWhile` との違い**: `TakeWhile` は条件を満たさなくなった時点で止め、その要素は含めません。`TakeUntil` は一致した要素を含めます。
- **後ろは読まない**: 条件で止まったら、残りの要素は取り出されません。大きな列や、無限に続く列でも使えます。
- **遅延評価**: `yield return` で 1 つずつ返すので、必要になった分だけ列を読みます。

## まとめ

- 要素を 1 つずつ返し、そのあと条件を調べる。
- 条件を満たした要素は含めて、そこで列を終わらせる。
- 一致しなければ、列の全部を返す。
