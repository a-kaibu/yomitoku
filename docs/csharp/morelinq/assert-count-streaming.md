---
title: "列の要素数が指定の数と一致するかを、読みながら確かめる"
description: "MoreLINQ の AssertCount の中身。要素数が分かれば先に比べ、分からなければ読みながら数える。数が多すぎれば途中で、少なすぎれば最後に例外を投げる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/AssertCount.cs
lines: [75, 93]
function: "MoreEnumerable.AssertCount<TSource>(IEnumerable<TSource>, int, Func<int, int, Exception>)"
difficulty: 2
format: 2
tags: [防御的プログラミング, エラー処理, イテレータ]
---

## ひとことで

`AssertCount(count)` は、列の要素数が **ちょうど `count` 個であることを確かめる** 関数です。
数が違えば、例外を投げます。列をそのまま返すので、途中で数を確かめながら使えます。

たとえば、`1, 2, 3` に `AssertCount(3)` を使うと、3 つの要素をそのまま返します。`AssertCount(2)` なら、例外になります。

## コード

```csharp:line-numbers=75
            static IEnumerable<TSource> _(IEnumerable<TSource> source, int count, Func<int, int, Exception> errorSelector)
            {
                if (source.TryAsCollectionLike() is { Count: var collectionCount }
                    && collectionCount.CompareTo(count) is var comparison && comparison != 0)
                {
                    throw errorSelector(comparison, count);
                }

                var iterations = 0;
                foreach (var element in source)
                {
                    iterations++;
                    if (iterations > count)
                        throw errorSelector(1, count);
                    yield return element;
                }
                if (iterations != count)
                    throw errorSelector(-1, count);
            }
```

## 前提知識

- **`TryAsCollectionLike`**: 列の要素数を、列を読まずに取り出せるかを試す MoreLINQ の関数です。取り出せなければ `null` になります。
- **`CompareTo`**: 2 つの数を比べて、小さければ負、大きければ正、等しければ 0 を返す関数です。
- **`errorSelector`**: 例外を作る関数です。何を比べた結果かを、引数で受け取ります。
- **`yield return`**: 値を 1 つずつ返す書き方です。遅延評価（必要になったときに 1 つずつ計算すること）に使われます。

## 何をしているか

### 1. 要素数が分かる列なら、先に比べる

```csharp:line-numbers=77
                if (source.TryAsCollectionLike() is { Count: var collectionCount }
                    && collectionCount.CompareTo(count) is var comparison && comparison != 0)
                {
                    throw errorSelector(comparison, count);
                }
```

要素数を読み取れる列なら、読まずに数を比べます。違えば、そこで例外を投げます。

### 2. 数えながら読む

```csharp:line-numbers=83
                var iterations = 0;
                foreach (var element in source)
```

要素数が分からない列は、数を 0 から数える準備をして、先頭から読みます。

### 3. 多すぎれば、その時点で例外

```csharp:line-numbers=86
                    iterations++;
                    if (iterations > count)
                        throw errorSelector(1, count);
                    yield return element;
```

要素を 1 つ読むたびに数を増やします。指定の数を超えたら、その時点で例外を投げます。超えた要素は返しません。

### 4. 少なすぎれば、最後に例外

```csharp:line-numbers=91
                if (iterations != count)
                    throw errorSelector(-1, count);
```

全部読み終わった後で、数が指定と違えば例外を投げます。少ない場合は、読み終わるまで分からないからです。

## ここがすごい

- **早く失敗する**: 要素数が分かる列は、読まずに判定します。多すぎる場合も、超えた時点で止まります。
- **結果を流しながら確かめる**: 要素は 1 つずつ返すので、全部をメモリに置かずに検査できます。
- **例外を差し替えられる**: 例外を作る関数を引数で渡せるので、用途に合ったメッセージを付けられます。

## まとめ

- 要素数が分かれば、読まずに比べて例外にする。
- 分からなければ、読みながら数える。
- 多すぎればその時点、少なすぎれば最後に例外を投げる。
