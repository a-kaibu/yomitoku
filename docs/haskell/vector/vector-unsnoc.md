---
title: "末尾の 1 件と、その前の部分を取り出す"
description: "vector の unsnoc。最後の要素と、それより前のベクターを Maybe で返す。uncons の末尾版。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov\""
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [470, 470]
function: "unsnoc"
difficulty: 1
format: 2
tags: [データ構造, 型システム]
---

## ひとことで

`unsnoc` は、ベクターの「最後の要素」と「それより前の部分」を組にして取り出す関数です。空のベクターには `Nothing` を返します。

## コード

```haskell:line-numbers=470
unsnoc xs = (,) (unsafeInit xs) <$> xs !? (length xs - 1)
```

## 前提知識

- **`unsnoc`**: `snoc` の逆の操作です。`snoc` は末尾に 1 件足す操作なので、`unsnoc` は末尾を 1 件外します。
- **`length`**: ベクターの長さを返します。
- **`!?`**: 添字の要素を `Maybe` で返す演算子です。

## 何をしているか

### 1. 最後の添字を求める

```haskell:line-numbers=470
unsnoc xs = (,) (unsafeInit xs) <$> xs !? (length xs - 1)
```

`length xs - 1` は、最後の要素の添字です。空のベクターでは `-1` になります。

### 2. 最後の要素があれば、組にする

`xs !? (length xs - 1)` は、最後の要素が存在するときだけ `Just` を返します。`-1` は範囲外なので、空のときは `Nothing` です。

`(,) (unsafeInit xs)` は、最後の要素の前の部分 `unsafeInit xs` と、最後の要素を組にする関数です。`<$>` でこれを `Just` の中に適用しています。

## ここがすごい

範囲外の添字を明示的に書かずに、「`-1` は範囲外なので `Nothing`」という `!?` の性質に任せています。空かどうかの分岐を別に書く必要がありません。

`unsafeInit` も、直前の `!?` で空でないことが保証されているので安全に使えます。

## まとめ

- 末尾を取り出す操作は、`length - 1` を添字にして `!?` で調べると簡単。
- 範囲外の添字を `Maybe` で受けると、空の場合の処理が自然に書ける。
- `uncons` と並べて読むと、先頭と末尾の対になった設計が見えてくる。
