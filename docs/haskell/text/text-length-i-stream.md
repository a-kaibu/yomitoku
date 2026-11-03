---
title: "列の中の文字の数を、数えて返す"
description: "text の Stream 版 lengthI。文字を 1 つずつ数えて、総数を返す。結果の型は呼び出す側が決める Integral 型。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [379, 385]
function: "lengthI"
difficulty: 2
format: 2
tags: [文字列処理, 再帰, 最適化]
---

## ひとことで

`lengthI s` は、文字列の列 `s` に含まれる文字の数を数えて返す関数です。結果の型は、呼び出す側が `Int` や `Integer` などから選べます。

## コード

```haskell:line-numbers=379
lengthI :: Integral a => Stream Char -> a
lengthI (Stream next s0 _len) = loop_length 0 s0
    where
      loop_length !z s  = case next s of
                           Done       -> z
                           Skip    s' -> loop_length z s'
                           Yield _ s' -> loop_length (z + 1) s'
```

## 前提知識

- **`Integral a`**: 整数として扱える型の制約です。
- **`z`**: ここまでに数えた文字の数です。
- **`!z`**: 数を毎回確定させる印です。数が溜まって大きな計算になるのを防ぎます。
- **`_`（ワイルドカード）**: 中身を使わない値に付ける印です。

## 何をしているか

### 1. 列の終わりで、数を返す

```haskell:line-numbers=383
                           Done       -> z
```

列が終わったら、数えた結果 `z` をそのまま返します。

### 2. 空の部分は数えない

```haskell:line-numbers=384
                           Skip    s' -> loop_length z s'
```

`Skip` の状態では文字がないので、数を変えずに次へ進みます。

### 3. 文字を見つけたら数を 1 増やす

```haskell:line-numbers=385
                           Yield _ s' -> loop_length (z + 1) s'
```

文字が取れたら、中身は使わず、数だけを 1 増やして次へ進みます。

結果は最後に `z` として返されるので、途中の数は外へ出ていきません。文字の中身を一度も比べないため、「何文字か」だけを知りたい場面で、無駄のない書き方になっています。

## ここがすごい

数えるためにリストを作る必要がありません。列を流しながら、数だけを持ち歩きます。

結果の型を `Integral a` にしているので、`Int` と `Integer` のどちらでも、同じ関数を使えます。

## まとめ

- 数えるだけなら、中身を作らず数だけを持ち歩けばよい。
- 結果の型を制約で決めると、用途に合わせて使い回せる。
- 数を確定させる印を付けると、大きな計算が溜まらない。
