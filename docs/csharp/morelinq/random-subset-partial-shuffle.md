---
title: "列からランダムに選んだ一部だけを、部分的なシャッフルで取り出す"
description: "MoreLINQ の RandomSubset。Fisher-Yates シャッフルを途中で止めて、必要な個数だけ配列の先頭へ集める。全体を並べ替えないので、短い部分集合を速く得られる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/RandomSubset.cs
lines: [85, 103]
function: "MoreEnumerable.RandomSubset<T>(IEnumerable<T>, int, Random)"
difficulty: 3
format: 2
tags: [乱数, アルゴリズム, 遅延評価]
---

## ひとことで

`RandomSubset(subsetSize)` は、列の中から **ランダムに選んだ `subsetSize` 個** を返す関数です。
たとえば 100 個の中から 3 個をランダムに選ぶなら、3 回分の選択だけを行い、残りは並べ替えません。

くじ引きや、テスト用に一部だけを抜き出す処理で役立ちます。

## コード

::: code-group

```csharp:line-numbers=85 [日本語訳]
            var m = 0; // m: これまでに選んで先頭へ移した個数
            var w = array.Length; // w: まだ選べる範囲の大きさ（残りの要素数）
            var g = w - 1; // g: 入れ替え先の位置を計算するための、固定の値

            // 部分的な Fisher-Yates シャッフルを行う。
            while (m < subsetSize)
            {
#pragma warning disable CA5394 // 安全でない乱数の警告を、ここだけ無効にする
                var k = g - rand.Next(w);
#pragma warning restore CA5394 // 警告を元に戻す
                (array[k], array[m]) = (array[m], array[k]);
                ++m;
                --w;
            }

            // 選んだ部分集合を、新しい列として 1 つずつ返す。
            for (var i = 0; i < subsetSize; i++)
                yield return array[i];
        }
```

```csharp:line-numbers=85 [原文]
            var m = 0;                // keeps track of count items shuffled
            var w = array.Length;     // upper bound of shrinking swap range
            var g = w - 1;            // used to compute the second swap index

            // perform in-place, partial Fisher-Yates shuffle
            while (m < subsetSize)
            {
#pragma warning disable CA5394 // Do not use insecure randomness
                var k = g - rand.Next(w);
#pragma warning restore CA5394 // Do not use insecure randomness
                (array[k], array[m]) = (array[m], array[k]);
                ++m;
                --w;
            }

            // yield the random subset as a new sequence
            for (var i = 0; i < subsetSize; i++)
                yield return array[i];
        }
```

:::

## 前提知識

- **Fisher-Yates シャッフル**: 列を一つずつ、まだ選ばれていない要素の中からランダムに選んで、前へ移していく並べ替えの方法です。どの並びも同じ確率で出ます。
- **部分集合**: 元の列の中から一部を選んだ組み合わせです。順番は問いません。
- **`Random.Next(n)`**: 0 から `n - 1` までの整数を、同じ確率で 1 つ返します。
- **タプルの入れ替え**: `(a, b) = (b, a)` で、2 つの要素を入れ替えます。
- **`yield return`**: 1 つずつ値を返す書き方です。

## 何をしているか

全体を並べ替えると、要素数が多いときに無駄になります。この関数は、**必要な回数だけ** 選んで前へ移します。

### 1. 変数を用意する

```csharp:line-numbers=85
            var m = 0; // m: これまでに選んで先頭へ移した個数
            var w = array.Length; // w: まだ選べる範囲の大きさ（残りの要素数）
            var g = w - 1; // g: 入れ替え先の位置を計算するための、固定の値
```

`m` は、前へ移し終えた個数です。`w` は、まだ選べる範囲の大きさです。`g` は、入れ替え先を計算する基準として、ループ中は変わりません。

### 2. ランダムに 1 つ選んで前へ移す

```csharp:line-numbers=90
            while (m < subsetSize)
            {
#pragma warning disable CA5394 // 安全でない乱数の警告を、ここだけ無効にする
                var k = g - rand.Next(w);
```

`rand.Next(w)` で、まだ選べる範囲の中から 1 つ選びます。`g - rand.Next(w)` で、その位置を配列の添字に直します。`g` は変わらないので、選べる範囲は毎回少しずつ後ろへ狭まっていきます。

```csharp:line-numbers=95
                (array[k], array[m]) = (array[m], array[k]);
                ++m;
                --w;
```

選んだ要素と、先頭から `m` 番目の要素を入れ替えます。そのあと `m` と `w` を 1 つずつ進めます。

### 3. 先頭から選んだ数だけ返す

```csharp:line-numbers=100
            // 選んだ部分集合を、新しい列として 1 つずつ返す。
            for (var i = 0; i < subsetSize; i++)
                yield return array[i];
```

`subsetSize` 回の選択が終わると、配列の先頭から `subsetSize` 個が、ランダムに選ばれた部分集合になっています。その要素を順に返します。

## ここがすごい

- **必要な分だけ動かす**: 全体の並べ替えは要りません。`subsetSize` 回の入れ替えで済みます。
- **偏りのない選び方**: 各回に残りの要素から一様に選ぶので、どの要素も同じ確率で選ばれます。
- **元の列を壊さない**: 最初に `ToArray()` で配列へコピーしてから作業するので、元の列は書き換わりません。
- **乱数の取り方を差し替えられる**: `Random` を引数で渡せるので、テストでは決まった乱数を使えます。

## まとめ

- `RandomSubset` は、Fisher-Yates シャッフルを途中で止めて、必要な個数だけ選ぶ。
- 選んだ要素は配列の先頭へ移し、残りは並べ替えない。
- 各回に残りから一様に選ぶので、どの要素も同じ確率で選ばれる。
