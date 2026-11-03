---
title: "ベクターの最後の要素から、畳み込みながら 1 つにまとめる"
description: "vector の foldr1。最後の要素から先頭へ向かって、2 つずつ関数で組み合わせて 1 つの値にする。空のベクターには使えない。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1773, 1773]
function: "foldr1"
difficulty: 1
format: 2
tags: [データ構造, 関数型, 遅延評価]
---

## ひとことで

`foldr1 f v` は、ベクター `v` の要素を右から順に `f` で組み合わせて、1 つの値にする関数です。初期値を渡さないので、ベクターは空であってはいけません。

## コード

```haskell:line-numbers=1773
foldr1 f = Bundle.foldr1 f . stream
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つ、配列に近いデータ構造です。
- **流れ（ストリーム、`stream`）**: ベクターの要素を 1 つずつ取り出せる形に変えたものです。
- **`Bundle`**: 流れに関する処理をまとめた内部のモジュールです。
- **関数合成（`.`）**: 右の処理の結果を左の処理に渡す書き方です。

## 何をしているか

### 1. 処理の中身

```haskell:line-numbers=1773
foldr1 f = Bundle.foldr1 f . stream
```

この関数は、ベクターを流れに変えてから、`Bundle.foldr1` で右から畳み込みます。`f` には、「今の要素」と「それより右の結果」が渡されます。結果として、1 つの値が返ります。

## ここがすごい

初期値を持たない畳み込みは、最初の要素をそのまま結果の出発点に使います。そのため、余計な単位元を用意する必要がありません。また、流れの上で処理するので、途中の配列はできません。

実際に使うときは、`foldr1 (+) xs` のように書くと、すべての要素の合計を求められます。空のベクターを渡すと、結果が決まらないためエラーになるので、事前に空でないことを確かめておく必要があります。

## まとめ

右からの畳み込みは、最後の要素から順に値を組み立てる書き方です。初期値が要らない場合は、`foldr1` が簡潔に書けます。

- 初期値の無い畳み込みは、空のベクターに注意する。
- 右から左へ組み立てると、結合の順番が分かりやすい。
- 流れの上で畳み込むと、途中のベクターを作らずに済む。
