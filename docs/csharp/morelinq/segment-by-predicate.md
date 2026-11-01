---
title: "条件に当たる要素の手前で、列を区切って複数の列にする"
description: "MoreLINQ の Segment。新しい区切りかどうかを判定する関数で列を走査し、区切りの要素から新しいセグメントを始める。最初の要素は必ず最初のセグメントに入る。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Segment.cs
lines: [79, 111]
function: "MoreEnumerable.Segment<T>(IEnumerable<T>, Func<T, T, int, bool>)"
difficulty: 3
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Segment` は、列を **区切りの場所で分けて、複数の小さな列にする** 関数です。
区切りかどうかは、判定の関数が決めます。たとえば `1, 2, 3, 4, 5, 6` を「3 の倍数の要素の手前で区切る」と決めると、`[1, 2]`, `[3, 4, 5]`, `[6]` の 3 つになります。

ログを時間ごとにまとめたり、連続した同じ値のかたまりを作ったりするときに役立ちます。

## コード

::: code-group

```csharp:line-numbers=79 [日本語訳]
            static IEnumerable<IEnumerable<T>> _(IEnumerable<T> source, Func<T, T, int, bool> newSegmentPredicate)
            {
                using var e = source.GetEnumerator();

                if (!e.MoveNext()) // 空の列なら、ここで終わる。
                    yield break;

                // 最初の要素は、必ず最初のセグメントに入れる。
                // これは意図した動作である。
                // 分割の判定は、列の 2 番目の要素から始まる。

                var previous = e.Current;
                var segment = new List<T> { previous };

                for (var index = 1; e.MoveNext(); index++)
                {
                    var current = e.Current;

                    if (newSegmentPredicate(current, previous, index))
                    {
                        yield return segment; // 完成したセグメントを返す。
                        segment = [current]; // 新しいセグメントを、今の要素から始める。
                    }
                    else // 新しいセグメントではないので、要素を追加して続ける。
                    {
                        segment.Add(current);
                    }

                    previous = current;
                }

                yield return segment;
            }
```

```csharp:line-numbers=79 [原文]
            static IEnumerable<IEnumerable<T>> _(IEnumerable<T> source, Func<T, T, int, bool> newSegmentPredicate)
            {
                using var e = source.GetEnumerator();

                if (!e.MoveNext()) // break early (it's empty)
                    yield break;

                // Ensure that the first item is always part of the first
                // segment. This is an intentional behavior. Segmentation always
                // begins with the second element in the sequence.

                var previous = e.Current;
                var segment = new List<T> { previous };

                for (var index = 1; e.MoveNext(); index++)
                {
                    var current = e.Current;

                    if (newSegmentPredicate(current, previous, index))
                    {
                        yield return segment;              // yield the completed segment
                        segment = [current]; // start a new segment
                    }
                    else // not a new segment, append and continue
                    {
                        segment.Add(current);
                    }

                    previous = current;
                }

                yield return segment;
            }
```

:::

## 前提知識

- **セグメント**: 元の列の一部分で、連続した要素のかたまりです。
- **判定の関数（predicate）**: 要素（ここでは今の要素・前の要素・位置）を受け取り、新しいセグメントを始めるかを `true` か `false` で返す関数です。
- **`List<T>`**: 伸び縮みする配列です。今のセグメントの要素を、溜めておくために使います。
- **`yield return`**: 完成したセグメントを、1 つずつ呼び出し元へ返す書き方です。
- **コレクション式 `[current]`**: 要素 1 つを持つ新しい `List` を、短く書く書き方です。

## 何をしているか

### 1. 最初の要素を最初のセグメントに入れる

```csharp:line-numbers=83
                if (!e.MoveNext()) // 空の列なら、ここで終わる。
                    yield break;

                // 最初の要素は、必ず最初のセグメントに入れる。
                // これは意図した動作である。
                // 分割の判定は、列の 2 番目の要素から始まる。

                var previous = e.Current;
                var segment = new List<T> { previous };
```

列が空なら終わります。そうでなければ、最初の要素を入れた最初のセグメントを作ります。最初の要素は、区切りの判定の対象にはなりません。

### 2. 要素ごとに区切りを判定する

```csharp:line-numbers=93
                for (var index = 1; e.MoveNext(); index++)
                {
                    var current = e.Current;

                    if (newSegmentPredicate(current, previous, index))
```

2 番目以降の要素を、順に判定関数へ渡します。判定が `true` なら、今のセグメントを返し、新しいセグメントを今の要素から始めます。

### 3. そうでなければ追加する

```csharp:line-numbers=102
                    else // 新しいセグメントではないので、要素を追加して続ける。
                    {
                        segment.Add(current);
                    }

                    previous = current;
```

判定が `false` なら、今の要素を今のセグメントに追加します。そのあと、今の要素を `previous` にして次へ進みます。

### 4. 最後のセグメントを返す

```csharp:line-numbers=110
                yield return segment;
```

列の終わりに達したら、溜まっているセグメントを返して終わります。

### 具体例で確かめる

`1, 2, 3, 4, 5, 6` を「その要素が 3 の倍数なら区切る」で分けます。

```
1 → 最初のセグメント [1]
2 → 区切らない [1, 2]
3 → 区切る: [1, 2] を返し、新しいセグメント [3]
4, 5 → 追加 [3, 4, 5]
6 → 区切る: [3, 4, 5] を返し、新しいセグメント [6]
終わり: [6] を返す
```

## ここがすごい

- **1 回の走査で分ける**: 列を先頭から 1 回だけ読み、区切りに当たったら、そこまでのセグメントを返します。
- **判定の材料が豊富**: 今の要素だけでなく、前の要素や位置も判定に使えるので、「値が変わったところで区切る」なども書けます。
- **最初の要素の扱いが明確**: 最初の要素は必ず最初のセグメントに入るので、空のセグメントが生まれません。
- **遅延して返す**: 完成したセグメントから順に返すので、大きな列でも、全体を先に分けて持つ必要がありません。

## まとめ

- `Segment` は、区切りを判定する関数で列を読み、区切りごとに複数のセグメントとして返す。
- 最初の要素は必ず最初のセグメントに入り、判定は 2 番目から始まる。
- 1 回の走査で分けられ、完成したセグメントから順に返せる。
