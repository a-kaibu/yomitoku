---
title: "列を左から、途中の値を溜めずに畳み込む"
description: "text の Stream 版 foldl'。左から 1 文字ずつ関数で結果を更新する。途中の値は毎回確定させるので、大きな列でもメモリが増えにくい。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [647, 653]
function: "foldl'"
difficulty: 2
format: 2
tags: [文字列処理, 関数型, 最適化]
---

## ひとことで

`foldl' f z s` は、文字列の列 `s` を左から 1 文字ずつ見て、途中の結果を関数 `f` で更新しながら、最後の値を返す関数です。文字を数えたり、まとめたりする処理の土台になります。

## コード

```haskell:line-numbers=647
foldl' :: (b -> Char -> b) -> b -> Stream Char -> b
foldl' f z0 (Stream next s0 _len) = loop_foldl' z0 s0
    where
      loop_foldl' !z !s = case next s of
                            Done -> z
                            Skip s' -> loop_foldl' z s'
                            Yield x s' -> loop_foldl' (f z x) s'
```

## 前提知識

- **畳み込み（fold）**: 結果を 1 つずつ更新しながら、列を端から端まで処理する操作です。
- **`z`**: 最初の値（初期値）です。結果の型と同じ型を持ちます。
- **`!z`**: 途中の結果を、毎回すぐ計算させる印です。
- **`Skip`**: 要素がないが、次へ進むことを表す状態です。

## 何をしているか

### 1. 列を 1 つ進める

```haskell:line-numbers=650
      loop_foldl' !z !s = case next s of
```

今の状態 `s` から、次の状態を取り出します。`z` は今までの結果です。

### 2. 列が終わったら、結果を返す

```haskell:line-numbers=651
                            Done -> z
```

列が終わったら、溜めてきた結果 `z` をそのまま返します。

### 3. 文字を取り出して、結果を更新する

```haskell:line-numbers=653
                            Yield x s' -> loop_foldl' (f z x) s'
```

文字 `x` が取れたら、`f z x` で結果を更新し、その値を次の繰り返しに渡します。

## ここがすごい

結果を更新するたびに、`!z` によって値を確定させます。そのため、結果が大きな計算の塊になって溜まることがありません。

また、`Skip` の状態を読み飛ばすだけで、中間のリストを作りません。列を流しながら、1 つの値にまとめていきます。

## まとめ

- 畳み込みでは、途中の値を毎回確定させると、メモリの溜まりを防げる。
- 列の状態を `Skip` で表すと、要素のない段階を簡単に扱える。
- 初期値と更新の関数を分けると、同じ仕組みで色々な集計ができる。
