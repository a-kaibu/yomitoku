---
title: "列の途中の一部分を、位置を指定して取り除く"
description: "MoreLINQ の Exclude。開始位置と個数で決まる区間の要素だけを飛ばし、前後の要素は残す。3 つの区間に分けて、順に読み進める。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Exclude.cs
lines: [47, 71]
function: "MoreEnumerable.Exclude<T>(IEnumerable<T>, int, int)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, 防御的プログラミング]
---

## ひとことで

`Exclude(startIndex, count)` は、列から **指定の区間だけを取り除いた列** を返す関数です。
たとえば `{ 1, 2, 3, 4, 5 }` に `Exclude(1, 2)` を使うと、位置 1 と 2（値 `2` と `3`）を除いて、`1, 4, 5` が返ります。

`Slice` が区間を取り出すのに対して、`Exclude` は区間を捨てて残りを返す、という逆の働きです。

## コード

::: code-group

```csharp:line-numbers=47 [日本語訳]
            static IEnumerable<T> _(IEnumerable<T> sequence, int startIndex, int count)
            {
                var index = 0;
                var endIndex = startIndex + count;
                using var iter = sequence.GetEnumerator();

                // 列の先頭の部分は、そのまま返す。
                for (; index < startIndex; index++)
                {
                    if (!iter.MoveNext())
                        yield break;
                    yield return iter.Current;
                }

                // 次の部分（count 個まで）は読み飛ばす。
                for (; index < endIndex; index++)
                {
                    if (!iter.MoveNext())
                        yield break;
                }

                // 残りの部分は、そのまま返す。
                while (iter.MoveNext())
                    yield return iter.Current;
            }
```

```csharp:line-numbers=47 [原文]
            static IEnumerable<T> _(IEnumerable<T> sequence, int startIndex, int count)
            {
                var index = 0;
                var endIndex = startIndex + count;
                using var iter = sequence.GetEnumerator();

                // yield the first part of the sequence
                for (; index < startIndex; index++)
                {
                    if (!iter.MoveNext())
                        yield break;
                    yield return iter.Current;
                }

                // skip the next part (up to count items)
                for (; index < endIndex; index++)
                {
                    if (!iter.MoveNext())
                        yield break;
                }

                // yield the remainder of the sequence
                while (iter.MoveNext())
                    yield return iter.Current;
            }
```

:::

## 前提知識

- **区間（くかん）**: 開始位置から、指定の個数ぶんの範囲です。`startIndex` を含み、`startIndex + count` の手前までを指します。
- **`using var`**: 列挙子を、関数を抜けるときに後片付けします。
- **列挙子（`IEnumerator`）**: 列を 1 つずつ読むための道具です。`MoveNext` で進め、`Current` で値を読みます。
- **`yield break`**: 列の終わりに達したことを示して、関数を抜けます。
- **`switch` 式**: 個数の値によって、処理を振り分ける書き方です。

## 何をしているか

この関数は、列を 3 つの部分に分けて順に読みます。

### 1. 区間より前の部分を返す

```csharp:line-numbers=49
                var index = 0;
                var endIndex = startIndex + count;
                using var iter = sequence.GetEnumerator();

                // 列の先頭の部分は、そのまま返す。
                for (; index < startIndex; index++)
                {
                    if (!iter.MoveNext())
                        yield break;
                    yield return iter.Current;
```

`index` が `startIndex` に届くまで、要素を読んでそのまま返します。列の途中で終わったら、`yield break` で抜けます。

### 2. 区間の要素を読み飛ばす

```csharp:line-numbers=61
                // 次の部分（count 個まで）は読み飛ばす。
                for (; index < endIndex; index++)
                {
                    if (!iter.MoveNext())
                        yield break;
                }
```

次の `count` 個の要素は、返さずに読み進めるだけです。`MoveNext` だけを呼び、`Current` は読みません。

### 3. 区間より後ろの部分を返す

```csharp:line-numbers=68
                // 残りの部分は、そのまま返す。
                while (iter.MoveNext())
                    yield return iter.Current;
```

残りの要素は、列の終わりまで順に返します。

### 具体例で確かめる

`{ 1, 2, 3, 4, 5 }` に `Exclude(1, 2)` を使うと、次のように進みます。

```
前の部分:  1 を返す（index 0）
飛ばす:    2, 3 を読み飛ばす（index 1, 2）
後ろの部分: 4, 5 を返す
結果: 1, 4, 5
```

## ここがすごい

- **1 回の走査で済む**: 列を先頭から 1 回だけ読むので、大きな列でも余計な読み直しがありません。
- **読み飛ばす部分は値を作らない**: 捨てる要素は `Current` を読まないので、計算の無駄がありません。
- **短い列でも安全**: 途中で列が終わったら、`yield break` で止まるので、範囲外を読みません。
- **個数 0 なら元の列を返す**: 取り除く個数が 0 のときは、列をそのまま返して無駄な処理を省きます。

## まとめ

- `Exclude` は、指定の区間の要素だけを取り除いた列を返す。
- 列を「前」「飛ばす部分」「後ろ」の 3 つに分けて、順に読む。
- 1 回の走査で済み、短い列でも範囲外を読まない。
