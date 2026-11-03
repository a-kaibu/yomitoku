---
title: "整数集合のいちばん小さい要素を取り除く"
description: "containers の IntSet の deleteMin。minView で最小の要素を外した残りの集合を返す。空なら空の集合のまま。"
language: haskell
project: "containers"
repo: https://github.com/haskell/containers
license: "BSD-2-Clause"
copyright: "\"(c) Daan Leijen 2002 / Copyright 2004, The University Court of the University of Glasgow.\""
commit: "c9c0c887ca9ff6934e46ca1415ef9a41d31e2eca"
file: containers/src/Data/IntSet/Internal.hs
lines: [1256, 1257]
function: "deleteMin"
difficulty: 1
format: 2
tags: [データ構造, 再帰]
---

## ひとことで

`deleteMin` は、`IntSet` から最も小さい整数を取り除いた集合を返す関数です。集合が空のときは、空のまま返します。

## コード

```haskell:line-numbers=1256
deleteMin :: IntSet -> IntSet
deleteMin = maybe Nil snd . minView
```

## 前提知識

- **`minView`**: 最小の要素と、残りの集合の組を `Maybe` で返す関数です。空なら `Nothing` になります。
- **`maybe`**: `Maybe` の値を扱う関数です。`maybe 既定値 関数 m` の形で、`Nothing` なら既定値、`Just` なら関数を適用します。
- **`snd`**: 組の 2 番目の値を取り出す関数です。

## 何をしているか

### 1. 最小の要素を取り外して、残りを得る

```haskell:line-numbers=1257
deleteMin = maybe Nil snd . minView
```

`minView` は、「最小の要素と残りの集合」の組を作ります。この式は、その組から残りの集合（2 番目の値）だけを取り出します。

### 2. 空の場合の扱い

`maybe Nil snd` は、`minView` が `Nothing`（空）のときには `Nil`（空の集合）を返します。`Nil` は、`IntSet` の空の値を表す部品です。

## ここがすごい

削除の処理を、「最小を見つける処理」と組み合わせて作っています。最小値を探して木の形を直す仕事は、`minView` に任せています。

空のときに例外を投げず、空の集合を返すのが特徴です。`Set` の `deleteMin` と同じ振る舞いに合わせた、と読めます。

## まとめ

- 最小の要素を消すときは、`minView` の残りを使うと書きやすい。
- 空のときに例外ではなく空の集合を返すと、呼ぶ側の分岐が減る。
- `maybe` と `snd` の組み合わせで、`Maybe` の中の値を安全に取り出せる。
