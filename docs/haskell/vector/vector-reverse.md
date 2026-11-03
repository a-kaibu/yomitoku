---
title: "ベクターの要素の順番を、後ろから並べ直す"
description: "vector の reverse。要素を後ろから先頭へと流しながら、新しいベクターを作る。元のベクターは変えない。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [994, 994]
function: "reverse"
difficulty: 1
format: 2
tags: [データ構造, 関数型, イテレータ]
---

## ひとことで

`reverse v` は、ベクター `v` の要素の順番を逆にした、新しいベクターを作る関数です。元のベクターは書き換えられません。

## コード

```haskell:line-numbers=994
reverse = unstream . streamR
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つデータ構造です。
- **`unstream`**: 流れを、ベクターにまとめる関数です。
- **`streamR`**: ベクターの要素を、後ろから順に流す関数です。`R` は「右から（Reverse）」の意味です。
- **関数合成（`.`）**: 右の処理の結果を、左の処理に渡す書き方です。

## 何をしているか

### 1. 後ろから流す

```haskell:line-numbers=994
reverse = unstream . streamR
```

`streamR` は、ベクターの最後の要素から先頭へ向かって、要素を流します。

### 2. まとめて新しいベクターにする

同じ行で、`unstream` がその流れを受け取り、新しいベクターにまとめます。流れを逆向きに作るので、途中で一度並べ替える必要がありません。

## ここがすごい

逆順にするために、要素を入れ替える処理を書いていません。「後ろから流す」という読み方を変えるだけで、逆順のベクターを作れます。

また、`INLINE` の指定とあわせて、他の処理と組み合わせても効率よく動くように工夫されています。

## まとめ

- 逆順は、要素の入れ替えではなく、読む向きを変えると簡単にできる。
- 流れの向きを変えると、一時的な並べ替えの配列が不要になる。
- 関数合成で「流す」と「まとめる」を分けると、役割が明確になる。
