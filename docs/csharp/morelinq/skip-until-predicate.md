---
title: "条件に合う要素が出るまで、列を読み飛ばす"
description: "MoreLINQ の SkipUntil。条件を満たす要素が現れるまでは捨て、その要素と以降の全要素を返す。do-while で最初の一致を探す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/SkipUntil.cs
lines: [62, 75]
function: "MoreEnumerable.SkipUntil<TSource>(IEnumerable<TSource>, Func<TSource, bool>)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, 探索]
---

## ひとことで

`SkipUntil(predicate)` は、列の中で **条件を満たす要素が初めて現れるまで** 要素を捨て、そこから先を全部返す関数です。
たとえば `1, 2, 3, 4` に「3 以上」という条件で `SkipUntil` を使うと、`3, 4` が返ります。

`TakeWhile` や `SkipWhile` と違い、「条件を満たさない間」ではなく、「条件を満たすまで」で区切るのが特徴です。

## コード

```csharp:line-numbers=62
            static IEnumerable<TSource> _(IEnumerable<TSource> source, Func<TSource, bool> predicate)
            {
                using var enumerator = source.GetEnumerator();

                do
                {
                    if (!enumerator.MoveNext())
                        yield break;
                }
                while (!predicate(enumerator.Current));

                while (enumerator.MoveNext())
                    yield return enumerator.Current;
            }
```

## 前提知識

- **`Func<TSource, bool>`**: 要素を受け取り、`true` か `false` を返す関数の型です。ここでは「条件」を表します。
- **`IEnumerator`**: 列を 1 つずつ進める道具です。`MoveNext()` で次へ進み、`Current` で今の要素を読みます。
- **`do ... while`**: 先に 1 回実行してから、条件を調べる繰り返しの書き方です。最低 1 回は中身が動きます。
- **`yield break`**: 列の終わりを示して、それ以上の値を返さない書き方です。
- **`using var`**: この関数の終わりで、道具を自動的に片付ける書き方です。

## 何をしているか

### 1. 道具を用意する

```csharp:line-numbers=64
                using var enumerator = source.GetEnumerator();
```

列を進める道具（`enumerator`）を作ります。`using var` なので、関数が終わるときに片付けられます。

### 2. 条件に合う要素が出るまで進める

```csharp:line-numbers=66
                do
                {
                    if (!enumerator.MoveNext())
                        yield break;
                }
                while (!predicate(enumerator.Current));
```

`do ... while` で、要素を 1 つ進めて、条件を調べます。条件を満たさない間は、同じ繰り返しを続けます。

進められなくなったら（列の終わりなら）、何も返さずに終わります。

### 3. 一致した要素から先を全部返す

```csharp:line-numbers=73
                while (enumerator.MoveNext())
                    yield return enumerator.Current;
```

条件を満たす要素が見つかったところで、ループを抜けます。その要素を含めて、残りの要素を全部返します。

## ここがすごい

- **一致した要素は残す**: `do ... while` の形のおかげで、一致した要素を捨てずに、そのまま先頭として返せます。
- **遅延評価**: `yield return` で 1 つずつ返すので、必要になるまで列を読み進めません。
- **道具の後片付け**: `using var` のおかげで、途中で終わっても道具が確実に片付けられます。

## まとめ

- 条件を満たす要素が出るまで、要素を捨てて進める。
- 一致した要素とその後の要素は、すべて返す。
- 一致しなければ、何も返さずに終わる。
