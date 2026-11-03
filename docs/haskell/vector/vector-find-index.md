---
title: "ベクターの中で条件を満たす最初の位置を探す"
description: "vector の findIndex。条件に合う最初の要素の位置を Maybe で返す。途中で見つかれば、残りの要素は調べない。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1709, 1709]
function: "findIndex"
difficulty: 1
format: 2
tags: [アルゴリズム, 探索, 関数型]
---

## ひとことで

`findIndex` は、ベクターを先頭から順に調べて、条件を満たす最初の要素の位置（0 始まりの番号）を返す関数です。見つからなければ `Nothing` を返します。

## コード

```haskell:line-numbers=1709
findIndex f = Bundle.findIndex f . stream
```

## 前提知識

- **`Maybe`**: 値があるかもしれないことを表す型です。`Just 3` は値が 3 あること、`Nothing` は値がないことを表します。
- **述語（predicate）**: 要素を受け取り、`True` か `False` を返す関数のことです。`(a -> Bool)` と書かれている部分がこれにあたります。
- **位置（index）**: 先頭を 0 とする番号です。
- **`.`（関数合成）**: `f . g` は「先に `g` を適用し、その結果に `f` を適用する」という意味です。

## 何をしているか

### 1. 型で意味を表す

```haskell
findIndex :: Vector v a => (a -> Bool) -> v a -> Maybe Int
```

引数は「条件の関数」と「ベクター」の 2 つです。戻り値が `Maybe Int` なので、見つからない可能性があることが型に現れています。

### 2. 流れに変えてから探す

```haskell:line-numbers=1709
findIndex f = Bundle.findIndex f . stream
```

`stream` は、ベクターを要素が 1 つずつ流れてくる形に変えます。それを `Bundle.findIndex f` に渡すと、流れを先頭から読みながら条件を試し、最初に合った位置で止まります。ベクター全体を作り直さないので、見つかった時点で無駄な処理がなくなります。

例えば `[3, 8, 5, 8]` で「8 より大きい」を探すと、位置 1 の `8` は違い、位置 2 の `5` も違うので、まだ見つかりません。ここで条件を満たす値は一つもないので `Nothing` になります。`[3, 9, 5]` なら位置 1 の `9` で止まり、`Just 1` を返します。

## ここがすごい

素直に全要素を配列に変換してから条件に合う位置を探すと、途中で止められても、先に全部作ってしまいます。この実装は流れ（stream）を使い、必要な分だけ要素を読みます。

型の上では `Maybe Int` を返すので、呼び出す側は見つからない場合を必ず扱うことになります。位置を `-1` で表す他の言語の書き方より、失敗を忘れにくい作りです。

## まとめ

- 条件に合う最初の位置を探すときは、`Maybe` で「見つからない」を型に表せる。
- `stream` で流れにしてから探すと、途中で止まれる。
- 関数の型を読めば、戻り値が見つからない可能性を持つことがわかる。
