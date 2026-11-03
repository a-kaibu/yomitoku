---
title: "列を同じ長さのかたまりに切り分ける"
description: "containers の Seq で、列を n 個ずつのかたまりに分ける chunksOf。最後の端数も、そのまま残りの 1 かたまりとして扱う。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Sequence/Internal.hs
lines: [4053, 4060]
function: "chunksOf"
difficulty: 3
format: 2
tags: [データ構造, アルゴリズム, 関数型]
---

## ひとことで

`chunksOf` は、`Seq` を先頭から `n` 個ずつのかたまりに分けて、その列を `Seq` の中に並べ直す関数です。最後に残ったものが `n` 個に足りなければ、短いかたまりとして最後に入ります。

## コード

```haskell:line-numbers=4053
chunksOf :: Int -> Seq a -> Seq (Seq a)
chunksOf n xs | n <= 0 =
  if null xs
    then empty
    else error "chunksOf: A non-empty sequence can only be broken up into positively-sized chunks."
chunksOf 1 s = fmap singleton s
chunksOf n s = splitMap (uncheckedSplitAt . (*n)) const most (replicate numReps ())
                 >< if null end then empty else singleton end
```

## 前提知識

- **`Seq (Seq a)`**: 「列の中に、さらに列が並んでいる」型です。外側の列の 1 要素が、内側のかたまり 1 つに対応します。
- **`singleton`**: 1 つの要素だけを持つ列を作る関数です。
- **`fmap`**: 中の要素それぞれに関数を当てる関数です。ここでは各要素を 1 個だけの列にしています。
- **`><`**: 2 つの列をつなげる演算子です。

## 何をしているか

### 1. 特別な場合を先に処理する

```haskell:line-numbers=4054
chunksOf n xs | n <= 0 =
  if null xs
    then empty
    else error "chunksOf: A non-empty sequence can only be broken up into positively-sized chunks."
chunksOf 1 s = fmap singleton s
```

`n` が 0 以下のときは、空の列だけ許します。`n` が 1 のときは、各要素をそれぞれ 1 個のかたまりにするだけなので、`fmap singleton` で済みます。

### 2. 残りを分けて、端数を最後に足す

```haskell:line-numbers=4059
chunksOf n s = splitMap (uncheckedSplitAt . (*n)) const most (replicate numReps ())
                 >< if null end then empty else singleton end
```

`splitMap` は、列を `n` ごとに切り分けていきます。`most` は、端数を除いた前半の部分です。`end` は最後に残った端数で、空でなければ 1 つのかたまりとして `><` で後ろにつなげます。

## ここがすごい

`Seq` は木の形をしているので、切り分けの位置を探すのが速いです。`uncheckedSplitAt` は、位置がすでに正しいと分かっているので、余計な確認を省いて分けます。

端数を別に扱うことで、「ちょうど割り切れるかどうか」を気にせず書けるのも、この関数の読みやすさの理由です。

## まとめ

- 列を分けるときは、「かたまりの数」と「端数」を別々に考えると分かりやすい。
- 特別な場合（0 以下、1）を先に処理すると、本体がすっきりする。
- 木の形をした列は、途中で分けるのが得意である。
