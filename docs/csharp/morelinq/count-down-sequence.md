---
title: "列の末尾から数えたカウントダウンを、要素と一緒に付ける"
description: "MoreLINQ の CountDown。末尾の数個の要素に、末尾を 0 とするカウントダウンの値を付ける。全体を先に数えられない列でも、直近の数個だけを待ってから返す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/CountDown.cs
lines: [88, 104]
function: "MoreEnumerable.CountDown<T, TResult>(IEnumerable<T>, int, Func<T, int?, TResult>)"
difficulty: 3
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`CountDown(count, resultSelector)` は、列の **末尾から数えた番号** を、各要素に付けて返す関数です。
末尾の要素が `0`、その 1 つ前が `1`、というように数えます。末尾の `count` 個より前の要素には、番号の代わりに `null` を付けます。

たとえば `a, b, c, d` に `CountDown(2)` を使うと、`a` と `b` には `null`、`c` には `1`、`d` には `0` が付きます。

## コード

```csharp:line-numbers=88
            static IEnumerable<TResult> IterateSequence(
                IEnumerable<T> source,
                int count,
                Func<T, int?, TResult> resultSelector)
            {
                var queue = new Queue<T>(Math.Max(1, count + 1));

                foreach (var item in source)
                {
                    queue.Enqueue(item);
                    if (queue.Count > count)
                        yield return resultSelector(queue.Dequeue(), null);
                }

                while (queue.Count > 0)
                    yield return resultSelector(queue.Dequeue(), queue.Count);
            }
```

## 前提知識

- **`Queue<T>`（キュー）**: 先に入れた要素から先に取り出す入れ物です。`Enqueue` で入れ、`Dequeue` で取り出します。
- **遅延評価**: 結果を先に作らず、取り出されたときに計算する仕組みです。
- **`int?`（null 許容の整数）**: 値があるか、`null` かを表せる整数の型です。番号を付けない要素には `null` を使います。
- **末尾から数える**: 列の全体の長さが分からなくても、最後に残った要素から順に番号を決められます。
- **`Math.Max(1, count + 1)`**: キューの初期容量です。少なくとも 1 を確保します。

## 何をしているか

この部分は、列の長さが事前に分からない場合の処理です。直近の `count` 個だけを手元に残します。

### 1. 要素を入れて、古いものを返す

```csharp:line-numbers=93
                var queue = new Queue<T>(Math.Max(1, count + 1));

                foreach (var item in source)
                {
                    queue.Enqueue(item);
```

要素を 1 つずつキューに入れます。

```csharp:line-numbers=98
                    if (queue.Count > count)
                        yield return resultSelector(queue.Dequeue(), null);
```

キューの要素数が `count` を超えたら、先頭の要素（これは末尾から `count` 個より前になった要素）を取り出して、番号を `null` にして返します。

### 2. 最後に残った要素に番号を付けて返す

```csharp:line-numbers=102
                while (queue.Count > 0)
                    yield return resultSelector(queue.Dequeue(), queue.Count);
```

列の終わりに達したら、キューに残った要素を取り出していきます。取り出した後の残りの数を番号にして返します。残りが 0 の要素が、末尾の要素になります。

### 具体例で確かめる

`a, b, c, d` に `CountDown(2)` を使うと、次のように進みます。

```
a を入れる（2 個以下）→ 何も返さない
b を入れる（2 個以下）→ 何も返さない
c を入れる（3 個）→ a を返す（番号 null）
d を入れる（3 個）→ b を返す（番号 null）
終わり: 残りは c, d
  c を取り出す（残り 1）→ 番号 1
  d を取り出す（残り 0）→ 番号 0
```

## ここがすごい

- **必要な分だけ覚える**: 直近の `count` 個と 1 個だけを手元に残すので、長い列でも使うメモリは少なく済みます。
- **番号の付け方が簡単**: 残りの数を番号にするだけで、末尾からの位置が分かります。
- **遅延して返す**: 途中の要素は、番号が決まった時点で返します。列の終わりを待つのは、最後の数個だけです。
- **リストは別の経路**: 長さが分かる列では、添字から番号を直接計算して、キューを使いません。

## まとめ

- `CountDown` は、末尾を 0 とする番号を、要素と一緒に返す。
- 長さが分からない列では、直近の `count` 個だけをキューに溜め、古い要素から返す。
- 末尾の数個は、残りの数を番号にして最後にまとめて返す。
