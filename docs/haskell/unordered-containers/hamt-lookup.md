---
title: "未使用の値を返さずに探す、HAMT の lookup'"
description: "unordered-containers の HAMT で、ハッシュ値とキーから値を探す lookup'。GHC の unboxed sum（箱なしの和型）で、結果を箱に入れずに返す。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "Copyright (c) 2010, Johan Tibell"
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal.hs
lines: [692, 694]
function: "lookup'"
difficulty: 3
format: 2
tags: [ハッシュ, 最適化, 型システム]
---

## ひとことで

`lookup'` は、ハッシュ値 `h` とキー `k` を使って、マップの中から値を探す関数です。見つかったら `Just` で値を返し、見つからなければ `Nothing` を返します。

この関数の特徴は、探索の内部で `(# ... | ... #)` という **unboxed sum**（箱に入れない和型）を使っている点です。結果を `Maybe` の箱に入れる前の段階で、速く受け渡しています。

## コード

```haskell:line-numbers=692
lookup' h k m = case lookupRecordCollision# h k m of
  (# (# #) | #) -> Nothing
  (# | (# a, _i #) #) -> Just a
```

## 前提知識

- **`Maybe`**: 値があるかないかを表す型です。`Just x` は値あり、`Nothing` は値なしです。
- **和型（sum type）**: 「どちらか」を表す型です。`Maybe` も和型の一種です。
- **unboxed sum**: `(# a | b #)` のように書く、箱を作らない和型です。普通の和型は、値を箱に入れてから返しますが、unboxed sum は箱を作らずに値を返せます。
- **`#` の付いた名前**: `lookupRecordCollision#` のように、`#` で終わる関数は、unboxed の値を扱う低レベルの関数です。

## 何をしているか

### 1. 内部の探索を呼ぶ

```haskell:line-numbers=692
lookup' h k m = case lookupRecordCollision# h k m of
```

`lookupRecordCollision#` は、ハッシュ値とキーを使って、木をたどります。結果は unboxed sum として返されます。

### 2. 結果を Maybe に変換する

```haskell:line-numbers=693
  (# (# #) | #) -> Nothing
  (# | (# a, _i #) #) -> Just a
```

`(# (# #) | #)` は「見つからなかった」場合です。空のタプル `(# #)` は、値を持たないことを表します。`(# | (# a, _i #) #)` は「見つかった」場合で、値 `a` を取り出して `Just a` を返します。`_i` は、衝突の位置で、ここでは使いません。

## ここがすごい

内部の関数が返すのは、箱に入れていない値です。そのため、途中で `Maybe` を作って、すぐに中身を取り出すという無駄な処理が省かれます。木の探索は非常に頻繁に行われるので、この差は効きます。

しかし、コメントにあるように、GHC はまだ unboxed sum の変換を自動では行わないので、作者が手で書き分けています。これは、速さのために低レベルの書き方を選んだ例です。読む人が書き方の意図を分かるように、コメントで理由を残しています。

## まとめ

- 結果を箱に入れずに返すと、探索の途中の無駄を省ける。
- unboxed sum は、「見つかった」「見つからない」を箱なしで表せる。
- 速さのための低レベルの書き方は、理由をコメントに残すと保守しやすい。
