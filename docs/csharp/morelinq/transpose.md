---
title: "行の並びを、列ごとの並びに入れ替える"
description: "MoreLINQ の Transpose。複数の列を「行」として、縦横を入れ替えて読む。行の長さがそろっていなくても、残っている要素だけを順に集める。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Transpose.cs
lines: [67, 94]
function: "MoreEnumerable.Transpose<T>(IEnumerable<IEnumerable<T>>)"
difficulty: 2
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Transpose` は、行の集まりを **縦と横を入れ替えて** 読めるようにする関数です。
たとえば `[[1, 2, 3], [4, 5, 6]]` は、`[[1, 4], [2, 5], [3, 6]]` になります。

表計算ソフトで行と列を入れ替える操作（転置）と同じ考え方です。

## コード

```csharp:line-numbers=67
                try
                {
                    while (true)
                    {
                        var column = new T[enumerators.Length];
                        var count = 0;
                        for (var i = 0; i < enumerators.Length; i++)
                        {
                            var enumerator = enumerators[i];
                            if (enumerator == null)
                                continue;

                            if (enumerator.MoveNext())
                            {
                                column[count++] = enumerator.Current;
                            }
                            else
                            {
                                enumerator.Dispose();
                                enumerators[i] = null;
                            }
                        }

                        if (count == 0)
                            yield break;

                        Array.Resize(ref column, count);
                        yield return column;
```

## 前提知識

- **転置（てんち）**: 行列の行と列を入れ替えることです。`(行, 列)` の位置にあった値が `(列, 行)` の位置へ移ります。
- **列挙子（`IEnumerator`）**: 列を先頭から 1 つずつ取り出す道具です。各行に 1 つずつ用意します。
- **`MoveNext` と `Current`**: `MoveNext` は次へ進み、進めたら true を返します。`Current` が今の値です。
- **`null` 許容の配列**: `IEnumerator<T>?[]` は、一部の要素が `null` になり得る配列です。ここでは、取り尽くした行を `null` で印にします。
- **`Array.Resize`**: 配列の長さを変えます。最後の列が短くなったとき、余分な枠を切り詰めるために使います。

## 何をしているか

### 1. 各行の列挙子を用意する

```csharp:line-numbers=64
                IEnumerator<T>?[] enumerators = source.Select(e => e.GetEnumerator()).Acquire();
```

各行に対して `GetEnumerator()` を呼び、列挙子を配列にまとめます。以降は、この配列を 1 つずつ進めていきます。

### 2. 各行から 1 つずつ取り出して 1 列を作る

```csharp:line-numbers=71
                        var column = new T[enumerators.Length];
                        var count = 0;
                        for (var i = 0; i < enumerators.Length; i++)
                        {
                            var enumerator = enumerators[i];
                            if (enumerator == null)
                                continue;

                            if (enumerator.MoveNext())
                            {
                                column[count++] = enumerator.Current;
                            }
```

`column` は、行の数と同じ長さの配列です。すべての行を順に見て、まだ要素が残っている行からだけ 1 つずつ取り出します。

### 3. 取り尽くした行を外す

```csharp:line-numbers=83
                            else
                            {
                                enumerator.Dispose();
                                enumerators[i] = null;
                            }
```

`MoveNext` が false になった行は、`Dispose` して `null` にします。次回からはその行を読み飛ばします。

### 4. 列を返す

```csharp:line-numbers=90
                        if (count == 0)
                            yield break;

                        Array.Resize(ref column, count);
                        yield return column;
```

1 つも取れなかったら終わりです。取れた数だけ `column` を切り詰めて返します。

## ここがすごい

- **行の長さがそろっていなくてもよい**: 長い行の残りは、短い行が終わった後も順に取り出されます。
- **取り尽くした行を明示的に外す**: `null` にして読み飛ばすことで、同じ行を何度も調べません。
- **1 回ずつ進める**: 各行を 1 要素ずつ進めるだけなので、行の数が多くても、必要な分だけ読みます。
- **遅延して返す**: 1 列ずつ `yield return` するので、結果を全部作ってから返す必要がありません。

## まとめ

- `Transpose` は、行の集まりを縦横入れ替えて、列の集まりとして読めるようにする。
- 各行の列挙子を、1 列ずつ同時に進めて値を集める。
- 取り尽くした行は `null` にして外し、長さがそろわない行にも対応する。
