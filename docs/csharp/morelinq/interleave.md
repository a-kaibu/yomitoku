---
title: "複数の列を 1 個ずつ交互に取り出して混ぜ合わせる"
description: "複数の列の先頭から 1 つずつ、次に 2 つ目から 1 つずつ、と順に取り出す MoreLINQ の Interleave。空になった列を途中で外す仕組みも含む。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Interleave.cs
lines: [53, 107]
function: "MoreEnumerable.Interleave"
difficulty: 3
format: 2
tags: [イテレータ, 並行処理, 防御的プログラミング]
---

## ひとことで

`Interleave` は、複数の列から **順番に 1 個ずつ** 要素を取り出して、1 本の列にまとめる関数です。
たとえば `[1, 2, 3]` と `[10, 20]` を混ぜると、`1, 10, 2, 20, 3` になります。

長さが違う列でも使えるように、途中で空になった列を自動的に外しています。

## コード

::: code-group

```csharp:line-numbers=53 [日本語訳]
        public static IEnumerable<T> Interleave<T>(this IEnumerable<T> sequence, params IEnumerable<T>[] otherSequences)
        {
            if (sequence == null) throw new ArgumentNullException(nameof(sequence));
            if (otherSequences == null) throw new ArgumentNullException(nameof(otherSequences));

            return Impl(otherSequences.Prepend(sequence));

            static IEnumerable<T> Impl(IEnumerable<IEnumerable<T>> sequences)
            {
                var enumerators = new LinkedList<IEnumerator<T>>();

                try
                {
                    // まず、各列の先頭の要素を 1 つずつ返す。

                    foreach (var sequence in sequences)
                    {
                        var enumerator = sequence.GetEnumerator();

                        _ = enumerators.AddLast(enumerator);
                        if (enumerator.MoveNext())
                        {
                            yield return enumerator.Current;
                        }
                        else // 空の列は Dispose して取り除く
                        {
                            enumerator.Dispose();
                            _ = enumerators.Remove(enumerator);
                        }
                    }

                    // 次に、各列の残りの要素を順に返す。

                    var node = enumerators.First;
                    while (node is { Value: var enumerator, Next: var nextNode })
                    {
                        if (enumerator.MoveNext())
                        {
                            yield return enumerator.Current;
                        }
                        else
                        {
                            enumerator.Dispose();
                            enumerators.Remove(node);
                        }

                        // 次のノードへ進む。最後まで行ったら先頭に戻る。
                        node = nextNode ?? enumerators.First;
                    }
                }
                finally
                {
                    foreach (var enumerator in enumerators)
                        enumerator.Dispose();
                }
```

```csharp:line-numbers=53 [原文]
        public static IEnumerable<T> Interleave<T>(this IEnumerable<T> sequence, params IEnumerable<T>[] otherSequences)
        {
            if (sequence == null) throw new ArgumentNullException(nameof(sequence));
            if (otherSequences == null) throw new ArgumentNullException(nameof(otherSequences));

            return Impl(otherSequences.Prepend(sequence));

            static IEnumerable<T> Impl(IEnumerable<IEnumerable<T>> sequences)
            {
                var enumerators = new LinkedList<IEnumerator<T>>();

                try
                {
                    // First, yield first element of each sequence.

                    foreach (var sequence in sequences)
                    {
                        var enumerator = sequence.GetEnumerator();

                        _ = enumerators.AddLast(enumerator);
                        if (enumerator.MoveNext())
                        {
                            yield return enumerator.Current;
                        }
                        else // Dispose and remove empty sequence
                        {
                            enumerator.Dispose();
                            _ = enumerators.Remove(enumerator);
                        }
                    }

                    // Then, yield remaining elements from each sequence.

                    var node = enumerators.First;
                    while (node is { Value: var enumerator, Next: var nextNode })
                    {
                        if (enumerator.MoveNext())
                        {
                            yield return enumerator.Current;
                        }
                        else
                        {
                            enumerator.Dispose();
                            enumerators.Remove(node);
                        }

                        // Work on next node or restart from first one.
                        node = nextNode ?? enumerators.First;
                    }
                }
                finally
                {
                    foreach (var enumerator in enumerators)
                        enumerator.Dispose();
                }
```

:::

## 前提知識

- **`params IEnumerable<T>[]`**: 引数の数を自由に変えられる書き方です。`a.Interleave(b, c, d)` のように、後ろに列を好きなだけ並べられます。
- **`LinkedList<T>`**: 要素が鎖のようにつながったリストです。途中の要素を追加・削除しても、ほかの要素を動かす必要がありません。
- **列挙子（`IEnumerator<T>`）**: 列を 1 つずつ読むための道具です。`MoveNext()` で次へ進み、`Current` で今の要素を読みます。`Dispose()` で後片付けをします。
- **`try ... finally`**: 途中で例外が起きても、`finally` の中の後片付けは必ず実行されます。
- **`while (node is { Value: var enumerator, Next: var nextNode })`**: パターンマッチングという書き方で、`node` が `null` でないことを確かめつつ、`Value` と `Next` を変数に取り出しています。

## 何をしているか

### 1. 各列の先頭を 1 つずつ取り出す

```csharp:line-numbers=66
                    // まず、各列の先頭の要素を 1 つずつ返す。

                    foreach (var sequence in sequences)
                    {
                        var enumerator = sequence.GetEnumerator();

                        _ = enumerators.AddLast(enumerator);
                        if (enumerator.MoveNext())
                        {
                            yield return enumerator.Current;
                        }
                        else // 空の列は Dispose して取り除く
                        {
                            enumerator.Dispose();
                            _ = enumerators.Remove(enumerator);
                        }
                    }
```

列を 1 つずつ見て、`MoveNext()` が成功すれば先頭の要素を返します。空の列なら、すぐに `Dispose()` して `LinkedList` から外します。

`[1, 2, 3]` と `[10, 20]` では、ここで `1, 10` が返されます。

### 2. 残りを順番に取り出す

```csharp:line-numbers=86
                    var node = enumerators.First;
                    while (node is { Value: var enumerator, Next: var nextNode })
                    {
                        if (enumerator.MoveNext())
                        {
                            yield return enumerator.Current;
                        }
                        else
                        {
                            enumerator.Dispose();
                            enumerators.Remove(node);
                        }

                        // 次のノードへ進む。最後まで行ったら先頭に戻る。
                        node = nextNode ?? enumerators.First;
                    }
```

`LinkedList` を先頭から順にたどり、各列から 1 つずつ要素を返します。`MoveNext()` が失敗した列は `Dispose()` して `Remove(node)` で外します。

次のノードがあればそこへ進み、なければ先頭に戻ります。これで列が 1 つずつ交互に返されます。

### 3. 後片付け

```csharp:line-numbers=103
                finally
                {
                    foreach (var enumerator in enumerators)
                        enumerator.Dispose();
                }
```

`finally` で、まだ残っている列をすべて `Dispose()` します。途中で `foreach` が止まっても、読み取り用の道具を片付けられます。

## ここがすごい

- **空になった列を外す**: 短い列が空になったら `LinkedList` から取り除くので、以降は残りの列だけを回します。長さが違っても、無駄な回転が起きません。
- **`LinkedList` で途中を外す**: 配列だと途中の要素を消すと全体を詰め直す必要がありますが、リストなら印をつないで外すだけです。
- **`finally` で必ず片付ける**: 列の読み取り道具はファイルや通信を持つことがあります。途中で止まっても `finally` で `Dispose` されるので、資源が漏れません。
- **遅延評価**: `Interleave` を呼んだ時点では何も読まず、結果を読まれたときに少しずつ動きます。

## まとめ

- 複数の列を交互に混ぜるには、列ごとの読み取り道具を持って順に進めればよい。
- 空になった列は途中で外すと、長さの違う列を扱える。
- 読み取り道具は `try ... finally` で必ず片付ける。
