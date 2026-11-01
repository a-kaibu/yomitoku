---
title: "列の末尾にある条件に合う要素だけを、先読みせずに除く"
description: "MoreLINQ の SkipLastWhile（順に読む場合）。条件に合う要素をキューに一時的に溜め、条件に合わない要素が来たときに溜めた分を先に返す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/SkipLastWhile.cs
lines: [66, 85]
function: "MoreEnumerable.SkipLastWhile<T>(IEnumerable<T>, Func<T, bool>)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`SkipLastWhile(predicate)` は、列の **末尾側にある、条件に合う要素** を取り除く関数です。
たとえば `1, 2, 0, 0` に「0 である」という条件を使うと、末尾の `0, 0` が取り除かれ、`1, 2` が返ります。

列の長さが分からない、ふつうの列（`ListLike` でないもの）では、先に末尾を見ることができません。そこで、この版は **条件に合う要素を一時的に溜めておく** やり方を使います。

## コード

```csharp:line-numbers=66
            static IEnumerable<T> IterateSequence(IEnumerable<T> source, Func<T, bool> predicate)
            {
                Queue<T>? queue = null;
                foreach (var item in source)
                {
                    if (predicate(item))
                    {
                        queue ??= new Queue<T>();
                        queue.Enqueue(item);
                    }
                    else
                    {
                        while (queue?.Count > 0)
                        {
                            yield return queue.Dequeue();
                        }
                        yield return item;
                    }
                }
            }
```

## 前提知識

- **キュー（`Queue<T>`）**: 先に入れたものから先に取り出す入れ物です。
- **`??=`（null 合体代入）**: 左の値が `null` のときだけ、右の値を代入する書き方です。ここでは、キューを初めて使うときに作ります。
- **`queue?.Count`**: キューが `null` でなければ、件数を読む書き方です。`null` なら、結果は `null` になります。
- **`predicate`**: 要素を受け取り、条件に合うかを `true` か `false` で返す関数です。
- **`yield return`**: 値を 1 つずつ返す書き方です。

## 何をしているか

### 1. 要素を順に読む

```csharp:line-numbers=68
                Queue<T>? queue = null;
                foreach (var item in source)
```

溜めておく入れ物（キュー）は、最初は作りません。列の要素を先頭から順に読みます。

### 2. 条件に合う要素は、溜めておく

```csharp:line-numbers=71
                    if (predicate(item))
                    {
                        queue ??= new Queue<T>();
                        queue.Enqueue(item);
                    }
```

要素が条件に合えば、まだ返さずにキューに入れます。末尾になるかもしれないので、今は保留しておきます。

### 3. 条件に合わない要素が来たら、溜めた分を返す

```csharp:line-numbers=76
                    else
                    {
                        while (queue?.Count > 0)
                        {
                            yield return queue.Dequeue();
                        }
                        yield return item;
```

条件に合わない要素が来たら、保留していた要素を先頭から順に返します。そのあとで、今の要素を返します。保留していた要素は、末尾ではなかったことが分かったからです。

### 4. 末尾の保留分は返さない

```csharp:line-numbers=84
                }
```

列が終わったときに、まだキューに残っている要素は、末尾にある条件に合うものです。返さずに終わります。

## ここがすごい

- **先読みしない**: 列の長さや末尾を先に調べる必要がありません。1 回の読み取りで済みます。
- **保留を最小限にする**: 溜めるのは、条件に合う要素が連続している間だけです。条件に合わない要素が来たら、すぐ返します。
- **遅延評価**: `yield return` で、必要になった分だけ返します。

## まとめ

- 条件に合う要素は、キューに溜めて保留する。
- 条件に合わない要素が来たら、保留分を先頭から返し、今の要素も返す。
- 列の終わりに残った保留分は、末尾にあるので捨てる。
