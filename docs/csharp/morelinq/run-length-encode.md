---
title: "同じ値の連続を「値と個数」の組に縮める"
description: "同じ値が続く部分を数えて、値と連続回数の組として返す MoreLINQ の RunLengthEncode。空の列の扱いを while で書き分けている。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/RunLengthEncode.cs
lines: [48, 84]
function: "MoreEnumerable.RunLengthEncode"
difficulty: 2
format: 2
tags: [イテレータ, 文字列処理, アルゴリズム]
---

## ひとことで

`RunLengthEncode` は、同じ値が続く部分を **値と連続回数の組**（ランレングス圧縮）に変換する関数です。
たとえば `"aaabcc"` は `('a', 3), ('b', 1), ('c', 2)` になります。

画像や文字列を簡単に圧縮する方法として古くからある考え方で、MoreLINQ ではこれを列の操作として使えるようにしています。

## コード

::: code-group

```csharp:line-numbers=48 [日本語訳]
        public static IEnumerable<KeyValuePair<T, int>> RunLengthEncode<T>(this IEnumerable<T> sequence, IEqualityComparer<T>? comparer)
        {
            if (sequence == null) throw new ArgumentNullException(nameof(sequence));

            return _(sequence, comparer ?? EqualityComparer<T>.Default);

            static IEnumerable<KeyValuePair<T, int>> _(IEnumerable<T> sequence, IEqualityComparer<T> comparer)
            {
                // この実装は foreach ループでも書けるが、
                // 空の列などの特殊なケースを扱うには、
                // 明示的なイテレータと while ループのほうが扱いやすいとわかった。

                using var iter = sequence.GetEnumerator();

                if (iter.MoveNext())
                {
                    var prevItem = iter.Current;
                    var runCount = 1;

                    while (iter.MoveNext())
                    {
                        if (comparer.Equals(prevItem, iter.Current))
                        {
                            ++runCount;
                        }
                        else
                        {
                            yield return new KeyValuePair<T, int>(prevItem, runCount);
                            prevItem = iter.Current;
                            runCount = 1;
                        }
                    }

                    yield return new KeyValuePair<T, int>(prevItem, runCount);
                }
            }
        }
```

```csharp:line-numbers=48 [原文]
        public static IEnumerable<KeyValuePair<T, int>> RunLengthEncode<T>(this IEnumerable<T> sequence, IEqualityComparer<T>? comparer)
        {
            if (sequence == null) throw new ArgumentNullException(nameof(sequence));

            return _(sequence, comparer ?? EqualityComparer<T>.Default);

            static IEnumerable<KeyValuePair<T, int>> _(IEnumerable<T> sequence, IEqualityComparer<T> comparer)
            {
                // This implementation could also have been written using a foreach loop,
                // but it proved to be easier to deal with edge certain cases that occur
                // (such as empty sequences) using an explicit iterator and a while loop.

                using var iter = sequence.GetEnumerator();

                if (iter.MoveNext())
                {
                    var prevItem = iter.Current;
                    var runCount = 1;

                    while (iter.MoveNext())
                    {
                        if (comparer.Equals(prevItem, iter.Current))
                        {
                            ++runCount;
                        }
                        else
                        {
                            yield return new KeyValuePair<T, int>(prevItem, runCount);
                            prevItem = iter.Current;
                            runCount = 1;
                        }
                    }

                    yield return new KeyValuePair<T, int>(prevItem, runCount);
                }
            }
        }
```

:::

## 前提知識

- **`KeyValuePair<T, int>`**: 2 つの値を 1 組にした型です。`Key` と `Value` で取り出します。ここでは「値」と「個数」の組です。
- **`IEqualityComparer<T>`**: 2 つの値が「同じか」を判定する仕組みです。`null` を渡すと、型の既定の比較（`EqualityComparer<T>.Default`）が使われます。
- **`comparer ?? ...`**: `??` は「左が `null` なら右」という意味です。
- **`using var iter = ...`**: 列の読み取りが終わったら自動で片付けます。
- **`while` と `if (iter.MoveNext())`**: 空の列かどうかを最初に確かめる書き方です。

## 何をしているか

### 1. 空の列を先に除く

```csharp:line-numbers=60
                using var iter = sequence.GetEnumerator();

                if (iter.MoveNext())
                {
                    var prevItem = iter.Current;
```

`MoveNext()` が `false` なら列は空なので、何も返さずに終わります。最初の要素を `prevItem`、連続回数を `runCount = 1` で始めます。

### 2. 同じ値なら数え、違えば組を返す

```csharp:line-numbers=67
                    while (iter.MoveNext())
                    {
                        if (comparer.Equals(prevItem, iter.Current))
                        {
                            ++runCount;
                        }
                        else
                        {
                            yield return new KeyValuePair<T, int>(prevItem, runCount);
                            prevItem = iter.Current;
                            runCount = 1;
                        }
                    }
```

次の要素が前と同じなら `runCount` を増やします。違うなら、今までの組を `yield return` して、新しい値で数え直します。

`"aab"` の場合は次のように進みます。

```
最初:  prev = 'a', count = 1
'a' が来る: 同じ → count = 2
'b' が来る: 違う → ('a', 2) を返す、prev = 'b', count = 1
終わり:  ('b', 1) を返す
```

### 3. 最後の組を返す

```csharp:line-numbers=81
                    yield return new KeyValuePair<T, int>(prevItem, runCount);
```

列の最後は、ループの中では返されないので、ループのあとで必ず返します。

## ここがすごい

- **空の列と 1 要素の列を自然に扱う**: 最初の `MoveNext()` で空かどうかを判定し、ループの後に残りの 1 組を返すので、要素が 1 つだけの場合も特別な処理が要りません。
- **比較器を差し替えられる**: `IEqualityComparer<T>` を受け取るので、大文字と小文字を無視するなど、「同じ」の意味を利用者が決められます。
- **コメントが書き方の理由を説明している**: 関数の冒頭のコメントには、なぜ `foreach` ではなく `while` で書いたのかが書かれています。空の列など特殊な場合を扱いやすいからです。
- **ひとつの走査で済む**: 列を 1 回だけ読みます。連続した値を覚えておくのは、直前の値と連続回数の 2 つだけです。

## まとめ

- 同じ値の連続は「値と回数」の組に縮められる。
- 空の列や最後の組は、ループの前後で別に扱うと分かりやすい。
- 「同じ」の判定を外から渡せると、使い道が広がる。
