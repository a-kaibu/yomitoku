---
title: "各要素と、その少し後の要素を組にして取り出す"
description: "MoreLINQ の Lead。現在の要素と、offset 個先の要素を一緒に変換関数へ渡す。列の終わりでは既定の値を組み合わせる。前後の値を比べる処理に便利。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Lead.cs
lines: [85, 110]
function: "MoreEnumerable.Lead<TSource, TResult>(IEnumerable<TSource>, int, TSource, Func<TSource, TSource, TResult>)"
difficulty: 3
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Lead(offset, defaultLeadValue, resultSelector)` は、各要素を **`offset` 個先の要素と組にして** 変換する関数です。
たとえば `1, 2, 3, 4` に `Lead(1, 0, (x, y) => (x, y))` を使うと、`(1, 2)`, `(2, 3)`, `(3, 4)`, `(4, 0)` の組が返ります。

「次の値を見ながら、今の値を処理する」という場面で使います。前後の差を求めるような処理に便利です。

## コード

::: code-group

```csharp:line-numbers=85 [日本語訳]
            static IEnumerable<TResult> _(
                IEnumerable<TSource> source,
                int offset,
                TSource defaultLeadValue,
                Func<TSource, TSource, TResult> resultSelector)
            {
                var leadQueue = new Queue<TSource>(offset);
                using var iter = source.GetEnumerator();

                bool hasMore;
                // まず、先読みをして、呼び出し側へ流す要素の分だけキューに溜める。
                // 流す予定の要素を、先に読んでおく。
                while ((hasMore = iter.MoveNext()) && leadQueue.Count < offset)
                    leadQueue.Enqueue(iter.Current);
                // 次に、元の列に要素がある限り、キューの先頭と現在の要素から結果を返す。
                // キューの先頭は、現在の要素より offset 個前の要素になっている。
                while (hasMore)
                {
                    yield return resultSelector(leadQueue.Dequeue(), iter.Current);
                    leadQueue.Enqueue(iter.Current);
                    hasMore = iter.MoveNext();
                }
                // 最後に、キューに残った要素を、既定の先読みの値と組み合わせて返す。
                while (leadQueue.Count > 0)
                    yield return resultSelector(leadQueue.Dequeue(), defaultLeadValue);
            }
```

```csharp:line-numbers=85 [原文]
            static IEnumerable<TResult> _(
                IEnumerable<TSource> source,
                int offset,
                TSource defaultLeadValue,
                Func<TSource, TSource, TResult> resultSelector)
            {
                var leadQueue = new Queue<TSource>(offset);
                using var iter = source.GetEnumerator();

                bool hasMore;
                // first, prefetch and populate the lead queue with the next step of
                // items to be streamed out to the consumer of the sequence
                while ((hasMore = iter.MoveNext()) && leadQueue.Count < offset)
                    leadQueue.Enqueue(iter.Current);
                // next, while the source sequence has items, yield the result of
                // the projection function applied to the top of queue and current item
                while (hasMore)
                {
                    yield return resultSelector(leadQueue.Dequeue(), iter.Current);
                    leadQueue.Enqueue(iter.Current);
                    hasMore = iter.MoveNext();
                }
                // yield the remaining values in the lead queue with the default lead value
                while (leadQueue.Count > 0)
                    yield return resultSelector(leadQueue.Dequeue(), defaultLeadValue);
            }
```

:::

## 前提知識

- **先読み（prefetch）**: 要素を、必要になる前に先に読んでおくことです。
- **`Queue<T>`（キュー）**: 先に入れた要素から先に取り出す入れ物です。ここでは、先読みした要素を順番どおりに待たせておくために使います。
- **`offset`**: 何個先の要素と組にするかを表す数です。`1` なら、次の要素と組にします。
- **`defaultLeadValue`**: 列の終わりで、組にする先の要素がないときに使う既定の値です。
- **`using var`**: 列挙子を、関数を抜けるときに後片付けします。

## 何をしているか

### 1. 先読みして、キューを満たす

```csharp:line-numbers=91
                var leadQueue = new Queue<TSource>(offset);
                using var iter = source.GetEnumerator();

                bool hasMore;
                // まず、先読みをして、呼び出し側へ流す要素の分だけキューに溜める。
                // 流す予定の要素を、先に読んでおく。
                while ((hasMore = iter.MoveNext()) && leadQueue.Count < offset)
                    leadQueue.Enqueue(iter.Current);
```

キューの容量を `offset` にして、先の要素を `offset` 個まで読んで溜めます。列が途中で終わったら、`hasMore` が `false` になります。

### 2. 組を作りながら流す

```csharp:line-numbers=99
                // 次に、元の列に要素がある限り、キューの先頭と現在の要素から結果を返す。
                // キューの先頭は、現在の要素より offset 個前の要素になっている。
                while (hasMore)
                {
                    yield return resultSelector(leadQueue.Dequeue(), iter.Current);
                    leadQueue.Enqueue(iter.Current);
                    hasMore = iter.MoveNext();
                }
```

キューの先頭（今より `offset` 個前の要素）と、今の要素を組にして変換します。そのあと今の要素をキューに入れ、次の要素へ進みます。

### 3. 残りを既定の値と組にする

```csharp:line-numbers=107
                // 最後に、キューに残った要素を、既定の先読みの値と組み合わせて返す。
                while (leadQueue.Count > 0)
                    yield return resultSelector(leadQueue.Dequeue(), defaultLeadValue);
```

列の終わりに達したら、キューに残った要素を、既定の値と組み合わせて返します。

### 具体例で確かめる

`1, 2, 3, 4` に `Lead(1, 0, ...)` を使うと、次のように進みます。

```
先読み: キューに 1
今 2 → (1, 2)、キューに 2
今 3 → (2, 3)、キューに 3
今 4 → (3, 4)、キューに 4
終わり: 残り 4 → (4, 0)
```

## ここがすごい

- **必要な分だけ覚える**: キューには `offset` 個の要素しか入らないので、長い列でもメモリを多く使いません。
- **1 回の走査で済む**: 列を先頭から 1 回だけ読み、先読みの分を溜めながら組を作ります。
- **終わりの処理を明示**: 列の終わりでも、既定の値を使って組を完成させるので、要素が 1 つ欠けることがありません。
- **遅延して返す**: 組を作るのは、呼び出し側が要求したときです。

## まとめ

- `Lead` は、各要素を `offset` 個先の要素と組にして、変換関数に渡す。
- 先読みした要素はキューに溜め、列の終わりでは既定の値を組み合わせる。
- 1 回の走査で、必要なメモリは `offset` 個分だけで済む。
