---
title: "並べ替えの組み合わせを、次の順列へ少しずつ進めて全部返す"
description: "MoreLINQ の Permutations。元の並びから「次の辞書順」の並びを作る操作を繰り返し、すべての順列を一つずつ返す。ループの入れ子を書かずに全パターンを列挙できる定番の手法。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Permutations.cs
lines: [114, 141]
function: "MoreEnumerable.Permutations<T>(IEnumerable<T>)"
difficulty: 3
format: 2
tags: [アルゴリズム, 遅延評価, イテレータ]
---

## ひとことで

`Permutations` は、列の要素を **並べ替えたすべての組み合わせ** を、1 つずつ返す関数です。
たとえば `[A, B, C]` からは `[A,B,C]`, `[A,C,B]`, `[B,A,C]`, `[B,C,A]`, `[C,A,B]`, `[C,B,A]` の 6 通りが返ります。

要素が 3 個なら 3 重の `for` 文を書けば済みます。しかし要素数は実行時に決まるので、**「次の並び」を作る操作を繰り返す** という形で書かれています。

## コード

::: code-group

```csharp:line-numbers=114 [日本語訳]
                    // permutation[j] < permutation[j+1] を満たす最大の添字 j を探す:

                    var j = permutation.Length - 2;
                    while (permutation[j] > permutation[j + 1])
                        j--;

                    // permutation[j] より大きい値のうち、右側で最も小さい値の位置 k を探す:
                    // （右側は降順なので、右から探して最初に大きい値が見つかれば、それが答え）

                    var k = permutation.Length - 1;
                    while (permutation[j] > permutation[k])
                        k--;

                    (permutation[j], permutation[k]) = (permutation[k], permutation[j]);

                    // j より後ろの部分を昇順に並べ直す。

                    for (int x = permutation.Length - 1, y = j + 1; x > y; x--, y++)
                        (permutation[x], permutation[y]) = (permutation[y], permutation[x]);

                    // 並べ替えた順序で、元の値を並べた新しい配列を作る。
                    // その配列を、次の順列として返す。

                    var permutedSet = new T[permutation.Length];
                    for (var i = 0; i < permutation.Length; i++)
                        permutedSet[i] = valueSet[permutation[i]];

                    yield return permutedSet;
```

```csharp:line-numbers=114 [原文]
                    // Find the largest index j with permutation[j] < permutation[j+1]:

                    var j = permutation.Length - 2;
                    while (permutation[j] > permutation[j + 1])
                        j--;

                    // Find index k such that permutation[k] is the smallest integer greater than
                    // permutation[j] to the right of permutation[j]:

                    var k = permutation.Length - 1;
                    while (permutation[j] > permutation[k])
                        k--;

                    (permutation[j], permutation[k]) = (permutation[k], permutation[j]);

                    // Move the tail of the permutation after the j-th position in increasing order.

                    for (int x = permutation.Length - 1, y = j + 1; x > y; x--, y++)
                        (permutation[x], permutation[y]) = (permutation[y], permutation[x]);

                    // Yield a new array containing the values from the original set in their new
                    // permuted order.

                    var permutedSet = new T[permutation.Length];
                    for (var i = 0; i < permutation.Length; i++)
                        permutedSet[i] = valueSet[permutation[i]];

                    yield return permutedSet;
```

:::

## 前提知識

- **順列（じゅんれつ）**: 要素を一列に並べ替えたものです。3 個なら 3 × 2 × 1 = 6 通りあります。
- **辞書順（じしょじゅん）**: 単語を辞書のように比べる順番です。`ABC`, `ACB`, `BAC` の順に並びます。
- **添字（そえじ）**: 配列の何番目かを表す数です。`permutation[0]` は先頭の値の位置を表します。
- **`yield return`**: 1 つ作るたびに呼び出し元へ返す書き方です。6 通りすべてを一度に作らずに済みます。
- **タプルの入れ替え**: `(a, b) = (b, a)` で 2 つの値を一度に入れ替えます。

## 何をしているか

このコードは、添字の並び `permutation` を `0, 1, 2, …` から始めて、**次の辞書順の並び** に毎回書き換えます。その並びに従って元の値を取り出し、新しい配列として返します。

### 1. 次の並びのための「入れ替え位置」を見つける

```csharp:line-numbers=116
                    var j = permutation.Length - 2;
                    while (permutation[j] > permutation[j + 1])
                        j--;
```

右から見て、`permutation[j] < permutation[j+1]` を満たす最も右の `j` を探します。ここより右側は必ず降順になっています。`j` より左側は、この先の並びで変わりません。

### 2. 入れ替える相手を見つける

```csharp:line-numbers=123
                    var k = permutation.Length - 1;
                    while (permutation[j] > permutation[k])
                        k--;
```

右から見て、`permutation[j]` より大きい値を最初に見つけた位置が `k` です。右側は降順なので、その値は `permutation[j]` より大きい中で最も小さいものになります。

### 3. 入れ替えて、後ろを並べ直す

```csharp:line-numbers=127
                    (permutation[j], permutation[k]) = (permutation[k], permutation[j]);
```

`j` と `k` の値を入れ替えます。

```csharp:line-numbers=131
                    for (int x = permutation.Length - 1, y = j + 1; x > y; x--, y++)
                        (permutation[x], permutation[y]) = (permutation[y], permutation[x]);
```

そのあと、`j` より後ろを昇順に並べ直すと、次の辞書順の並びになります。後ろは降順だったので、反転させるだけで昇順に戻せます。

### 4. 並びに従って値を返す

```csharp:line-numbers=137
                    var permutedSet = new T[permutation.Length];
                    for (var i = 0; i < permutation.Length; i++)
                        permutedSet[i] = valueSet[permutation[i]];

                    yield return permutedSet;
```

添字の並びに従って元の値を取り出し、新しい配列として `yield return` します。元の配列を書き換えないので、呼び出し元は安心して結果を保存できます。

## ここがすごい

- **入れ子の `for` を書かない**: 要素数が変わっても同じコードで全パターンを作れます。
- **次の並びを作る操作が小さい**: 添字の入れ替えと反転だけで、前の並びから次の並びが一意に決まります。
- **遅延して返す**: `yield return` により、全部を先に作らず、1 つずつ作ります。
- **オーバーフローを防ぐ**: 要素数が 21 以上になると、通り数が `ulong` を超えるため、`OverflowException` を投げます。作る前に限界を知らせる設計です。
- **元の並びも最初に返す**: 最初の `yield return` で元の並びを返してから、残りを作ります。

## まとめ

- 順列は、添字の並びを「次の辞書順」に進めることで、1 つずつ作れる。
- 右から探して入れ替え、後ろを反転させる、の 3 手順で次の並びが決まる。
- `yield return` と組み合わせると、大きな組み合わせも遅延して列挙できる。
