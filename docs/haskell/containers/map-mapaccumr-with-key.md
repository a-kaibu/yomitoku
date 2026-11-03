---
title: "右から順に値を畳みながら、同時に変換する"
description: "containers の Map で、キーの大きい順に状態を運びながら値を変換する mapAccumRWithKey。右の部分木から先に処理する。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow."
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/Map/Internal.hs
lines: [3171, 3177]
function: "mapAccumRWithKey"
difficulty: 3
format: 2
tags: [データ構造, 関数型, 遅延評価]
---

## ひとことで

`mapAccumRWithKey f a m` は、`Map` の要素を大きいキーから順に処理します。その途中で、状態 `a` を次の要素へ運びながら、各値を新しい値に変えます。

## コード

```haskell:line-numbers=3171
mapAccumRWithKey :: (a -> k -> b -> (a,c)) -> a -> Map k b -> (a,Map k c)
mapAccumRWithKey _ a Tip = (a,Tip)
mapAccumRWithKey f a (Bin sx kx x l r) =
  let (a1,r') = mapAccumRWithKey f a r
      (a2,x') = f a1 kx x
      (a3,l') = mapAccumRWithKey f a2 l
  in (a3,Bin sx kx x' l' r')
```

## 前提知識

- **状態（アキュムレータ）**: 処理の途中で受け渡していく値です。たとえば合計や、最後に使う記録などが入ります。
- **タプル `(a, c)`**: 「新しい状態」と「変換後の値」を一緒に返すための組です。
- **`let` の複数束縛**: 途中の結果に名前を付けて、後で使う書き方です。
- **右から左へ（R）**: `Map` の要素を、大きいキーから順に処理することを表す名前です。

## 何をしているか

### 1. 右の部分木を先に処理する

```haskell:line-numbers=3174
  let (a1,r') = mapAccumRWithKey f a r
```

キーが大きい方の右の部分木から処理します。結果の状態は `a1` になります。

### 2. 真ん中の値を処理する

```haskell:line-numbers=3175
      (a2,x') = f a1 kx x
```

右を処理した後の状態 `a1` を使って、今の節点の値 `x` を変換します。新しい値は `x'` になります。

### 3. 左の部分木を最後に処理する

```haskell:line-numbers=3176
      (a3,l') = mapAccumRWithKey f a2 l
```

最後に、左の部分木を、更新された状態 `a2` から処理します。これで、状態は大きいキーから小さいキーへ順に流れます。

## ここがすごい

`Map` の木の形を保ったまま、状態を 1 本の流れとして運べます。配列を作って後で集めるような、余分な一時データが要りません。

また、`let` の中で順番を決めているので、読む人は処理の順序がすぐに分かります。

## まとめ

- 状態を運びながら変換すると、一度の走査で済む。
- 処理の順序は、状態の流れで決まる。
- 木を再帰で処理するときは、どの部分木から先に処理するかが結果を左右する。
