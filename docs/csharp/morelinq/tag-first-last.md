---
title: "要素ごとに、先頭か末尾かの印を付けて返す"
description: "MoreLINQ の TagFirstLast。各要素が先頭か末尾かを bool で受け取り、結果を作る関数に渡す。末尾の判定のため、1 つ先まで読む。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/TagFirstLast.cs
lines: [64, 81]
function: "MoreEnumerable.TagFirstLast<TSource, TResult>(IEnumerable<TSource>, Func<TSource, bool, bool, TResult>)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, 状態機械]
---

## ひとことで

`TagFirstLast` は、列の各要素に **先頭かどうか** と **末尾かどうか** の印を付けて、結果を作る関数です。
たとえば `a, b, c` に使うと、`a` は「先頭」、`c` は「末尾」として扱われます。

印の付け方は、結果を作る関数（`resultSelector`）に、`true` / `false` の 2 つの値で渡されます。

## コード

```csharp:line-numbers=64
            static IEnumerable<TResult> _(IEnumerable<TSource> source, Func<TSource, bool, bool, TResult> resultSelector)
            {
                using var enumerator = source.GetEnumerator();

                if (!enumerator.MoveNext())
                    yield break;

                var current = enumerator.Current;
                var hasNext = enumerator.MoveNext();
                yield return resultSelector(current, true, !hasNext);

                while (hasNext)
                {
                    current = enumerator.Current;
                    hasNext = enumerator.MoveNext();
                    yield return resultSelector(current, false, !hasNext);
                }
            }
```

## 前提知識

- **`IEnumerator`**: 列を 1 つずつ進める道具です。`MoveNext()` で次へ進み、`Current` で今の要素を読みます。
- **`MoveNext()`**: 次の要素があれば `true` を返し、進めます。要素がなければ `false` を返します。
- **`using var`**: この関数の終わりで、道具を自動的に片付ける書き方です。
- **`yield break`**: 列の終わりを示して、それ以上の値を返さない書き方です。
- **`Func<TSource, bool, bool, TResult>`**: 要素と 2 つの `bool` を受け取り、結果を返す関数の型です。

## 何をしているか

### 1. 空の列なら、何も返さない

```csharp:line-numbers=66
                using var enumerator = source.GetEnumerator();

                if (!enumerator.MoveNext())
                    yield break;
```

最初に `MoveNext()` を呼びます。次の要素がなければ、結果を 1 つも返さずに終わります。

### 2. 先頭の要素を、1 つ先まで読んで返す

```csharp:line-numbers=71
                var current = enumerator.Current;
                var hasNext = enumerator.MoveNext();
                yield return resultSelector(current, true, !hasNext);
```

先頭の要素を `current` に取っておきます。そのあと、もう 1 つ先へ進めて、次の要素があるかを `hasNext` に覚えます。

先頭には `true`（先頭）と、`!hasNext`（次がなければ末尾）を渡します。先に 1 つ読んでおくのは、今の要素が末尾かどうかを判定するためです。

### 3. 残りの要素を、同じように返す

```csharp:line-numbers=75
                while (hasNext)
                {
                    current = enumerator.Current;
                    hasNext = enumerator.MoveNext();
                    yield return resultSelector(current, false, !hasNext);
                }
```

`hasNext` が `true` の間、`current` を次の要素に進めて、同じ判定を行います。先頭ではないので、先頭の印は `false` です。

## ここがすごい

- **1 つ先読みで末尾を判定**: 列の長さが分からなくても、今の要素の後に続きがあるかで末尾を判定できます。
- **2 回だけ読まない**: 列は 1 回だけ先に進むので、遅延評価のまま、大きな列でも使えます。
- **判定は呼び出し側に任せる**: 結果の作り方は `resultSelector` に任せているので、印を使ってどんな形の結果にもできます。

## まとめ

- 先頭か末尾かを、`bool` の印として結果を作る関数に渡す。
- 末尾の判定のため、1 つ先まで読んで続きがあるかを見る。
- 空の列では、何も返さずに終わる。
