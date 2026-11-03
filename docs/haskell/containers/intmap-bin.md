---
title: "空の枝を作らない、分岐の組み立て「bin」"
description: "Data.IntMap の内部で、分岐を作るとき片方が空なら、もう片方をそのまま返す bin。空の枝を木に残さない。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/IntMap/Internal.hs
lines: [4255, 4258]
function: "bin"
difficulty: 2
format: 2
tags: [データ構造, 防御的プログラミング, 最適化]
---

## ひとことで

`bin` は、分岐を作る関数です。左か右のどちらかが空（`Nil`）なら、分岐を作らずに、残りの木をそのまま返します。両方とも空でなければ、普通の分岐を作ります。

空の枝を木の中に残すと、無駄な節が増えて、探索が遅くなります。この関数は、その状況を作らないための見張り役です。

## コード

```haskell:line-numbers=4255
bin :: Prefix -> IntMap a -> IntMap a -> IntMap a
bin _ l Nil = l
bin _ Nil r = r
bin p l r   = Bin p l r
```

## 前提知識

- **`Nil`**: `IntMap` の空の木です。
- **`Bin p l r`**: 接頭辞 `p` を持つ分岐で、左 `l` と右 `r` を持ちます。
- **パターンマッチの順番**: 関数の定義は上から順に当てはめられます。`bin _ l Nil = l` は、右が空のときの規則です。
- **`_`**: 使わない引数を捨てる書き方です。ここでは接頭辞が要らないので捨てています。

## 何をしているか

### 1. 右が空なら左を返す

```haskell:line-numbers=4256
bin _ l Nil = l
```

右が `Nil` なら、分岐は要りません。左の木 `l` をそのまま返します。接頭辞も捨てられます。

### 2. 左が空なら右を返す

```haskell:line-numbers=4257
bin _ Nil r = r
```

左が `Nil` なら、同じように右の木 `r` をそのまま返します。

### 3. 両方あるときだけ分岐を作る

```haskell:line-numbers=4258
bin p l r   = Bin p l r
```

両方の木が空でないときに限り、`Bin p l r` で分岐を作ります。

## ここがすごい

「空の枝を作らない」という不変条件（木の中の約束）を、分岐を作る 1 か所で守っています。どこで分岐を作っても、この関数を通せば約束が保たれます。

また、規則は 3 行だけで、パターンマッチの順番がそのまま読みやすさになっています。コメントにある `binCheckL` のような、より軽い版も用意されていて、状況に応じて使い分けています。

## まとめ

- 木の中の約束（空の枝を置かない）は、作る関数を 1 つにまとめて守る。
- パターンマッチの順番で、特別な場合を先に書くと読みやすい。
- 不要な節を作らないことは、探索の速さと省メモリの両方に効く。
