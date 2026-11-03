---
title: "番号から、並び順の要素を取り出す「elemAt」"
description: "Data.Map の elemAt。並び順の番号を受け取り、その位置のキーと値の組を返す。左右の大きさを比べて、どちらへ進むかを決める。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [1410, 1416]
function: "elemAt"
difficulty: 3
format: 2
tags: [データ構造, 再帰, アルゴリズム]
---

## ひとことで

`elemAt` は、`lookupIndex` の逆の操作です。並び順の番号 `i` を受け取り、その位置にある `(キー, 値)` の組を返します。

木の中で、番号が左の部分木の大きさより小さければ左へ、大きければ右へ進みます。番号を、右へ進むたびに調整します。

## コード

```haskell:line-numbers=1410
elemAt :: Int -> Map k a -> (k,a)
elemAt !_ Tip = error "Map.elemAt: index out of range"
elemAt i (Bin _ kx x l r)
  = case compare i sizeL of
      LT -> elemAt i l
      GT -> elemAt (i-sizeL-1) r
      EQ -> (kx,x)
```

## 前提知識

- **`(k, a)`**: キーと値の組です。`elemAt` は、この組をそのまま返します。
- **`!_`**: 引数を厳密にする書き方で、`_` は使わない値です。`Tip` のときに、番号の確認を先に行います。
- **`compare i sizeL`**: 番号と、左の部分木の大きさを比べます。
- **`where sizeL = size l`**: 左の大きさに名前を付けています。

## 何をしているか

### 1. 空の木なら範囲外

```haskell:line-numbers=1411
elemAt !_ Tip = error "Map.elemAt: index out of range"
```

`Tip` は、そこに要素が無いということです。番号が範囲外なので、`error` で止めます。

### 2. 左右のどちらへ進むか決める

```haskell:line-numbers=1413
  = case compare i sizeL of
      LT -> elemAt i l
      GT -> elemAt (i-sizeL-1) r
```

番号 `i` が左の大きさ `sizeL` より小さければ、左の部分木の中で同じ番号を探します。大きければ、右の部分木の中で、番号から `sizeL + 1` を引いて探します。左の要素と根の分を、番号から取り除いたのです。

### 3. 番号が一致したら、その節の組を返す

```haskell:line-numbers=1416
      EQ -> (kx,x)
```

番号が左の大きさとちょうど同じなら、この節こそが目的の要素です。キーと値を返します。

## ここがすごい

並び順の番号は、木の形と関係が深い値です。各節の左の大きさを比べるだけで、目的の要素が左右どちらにあるかを 1 回の比較で決められます。

また、右へ進むときに番号を調整するので、部分木の中では、常に「その部分木の中の番号」として探せます。この考え方が、`lookupIndex` の逆向きの計算と一致しています。

## まとめ

- 番号から要素を取り出すには、左の大きさを使って進む方向を決める。
- 右へ進むときは、番号から左の部分と根の分を引く。
- 逆向きの操作（番号から探す、と番号で取る）を対で持つと、理解が深まる。
