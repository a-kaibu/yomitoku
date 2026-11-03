---
title: "キーがマップに入っているかを、値の有無で調べる"
description: "unordered-containers の HashMap の member。lookup の結果が Just かどうかで、キーがあるかを判定する。"
language: haskell
project: "unordered-containers"
repo: https://github.com/haskell-unordered-containers/unordered-containers
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2010, Johan Tibell\""
commit: "594a3055dda25b2015beac146b60490cdb06b378"
file: Data/HashMap/Internal.hs
lines: [662, 665]
function: "member"
difficulty: 1
format: 2
tags: [データ構造, ハッシュ, 型システム]
---

## ひとことで

`member` は、指定したキーがハッシュマップに入っているかを `True` か `False` で返す関数です。

## コード

```haskell:line-numbers=662
member :: Hashable k => k -> HashMap k a -> Bool
member k m = case lookup k m of
    Nothing -> False
    Just _  -> True
```

## 前提知識

- **`Hashable k`**: キーをハッシュ値に変えられる、という型の制約です。
- **`lookup`**: キーに対応する値を `Maybe` で返す関数です。
- **`Maybe`**: 値があるなら `Just`、ないなら `Nothing` を返す型です。

## 何をしているか

### 1. 値を探す

```haskell:line-numbers=663
member k m = case lookup k m of
```

`lookup k m` で、キーに対応する値を探します。結果は `Maybe` で返ります。

### 2. 有無で答える

```haskell:line-numbers=664
    Nothing -> False
    Just _  -> True
```

`Nothing` なら、キーがないので `False` です。`Just _` なら、値があるので `True` です。`_` は中身を捨てる書き方です。

## ここがすごい

キーの有無だけが分かればよいのに、値そのものも探しています。それでも、`lookup` の結果を使い回すことで、木を探す処理を 1 か所に保っています。

関数を小さく分けておくと、探し方を変えたとき、`member` の中身を書き直す必要がありません。

`member` の結果は、真偽値だけなので、呼ぶ側は `if` と組み合わせて書けます。値そのものが不要な場面では、この関数を使うと意図がはっきりします。キーが存在するかだけを確かめて、その後で値を使わないような処理に向いています。

## まとめ

- 有無だけを知りたいときは、`lookup` の結果を `Maybe` で判定すると分かりやすい。
- 型の制約 `Hashable k` で、キーをハッシュできることを保証している。
- 中身を捨てるときは `_` を使うと、意図が読みやすい。
