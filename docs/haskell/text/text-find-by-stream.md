---
title: "条件に合う最初の文字を、列から探す"
description: "text の Stream 版 findBy。条件に合う最初の文字を見つけたら、その文字を Just で返す。最後まで無ければ Nothing を返す。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [1083, 1090]
function: "findBy"
difficulty: 2
format: 2
tags: [文字列処理, 探索, 遅延評価]
---

## ひとことで

`findBy p s` は、文字列の列 `s` の中で条件 `p` に合う最初の文字を探す関数です。見つかれば `Just` で返し、見つからなければ `Nothing` を返します。

## コード

```haskell:line-numbers=1083
findBy :: (Char -> Bool) -> Stream Char -> Maybe Char
findBy p (Stream next s0 _len) = loop_find s0
    where
      loop_find !s = case next s of
                       Done -> Nothing
                       Skip s' -> loop_find s'
                       Yield x s' | p x -> Just x
                                  | otherwise -> loop_find s'
```

## 前提知識

- **`Maybe Char`**: 文字があれば `Just` で、なければ `Nothing` で返す型です。
- **`Stream Char`**: 文字を流しながら扱う列の型です。
- **`Yield` と `Skip`**: 要素がある状態と、要素がないが次へ進む状態です。
- **`|`（ガード）**: 条件に応じて処理を分ける書き方です。

## 何をしているか

### 1. 列の終わりなら Nothing

```haskell:line-numbers=1087
                       Done -> Nothing
```

列が終わるまで条件に合う文字が無かったら、`Nothing` を返して探すのをやめます。

### 2. 要素の無い状態は読み飛ばす

```haskell:line-numbers=1088
                       Skip s' -> loop_find s'
```

`Skip` の状態では文字がないので、そのまま次の状態へ進みます。

### 3. 条件に合えば見つかったとして止める

```haskell:line-numbers=1089
                       Yield x s' | p x -> Just x
```

取り出した文字 `x` が条件 `p` に合えば、その時点で `Just x` を返します。残りの列は調べません。

## ここがすごい

条件に合う文字を見つけた時点で、探すのを止めます。全体を最後まで読む必要がないので、早く答えが出ることがあります。

また、結果の `Maybe` によって、見つからなかった場合も型で表せます。

## まとめ

- 探す処理は、見つかった時点で返すと無駄が減る。
- 見つからない場合は `Nothing` で表すと、安全に扱える。
- 状態を `Skip` で表すと、要素のない段階を読み飛ばすのが簡単になる。
