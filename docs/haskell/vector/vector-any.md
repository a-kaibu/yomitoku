---
title: "どれか 1 つでも条件を満たすかを調べる"
description: "vector の any。ベクターの要素のうち、1 つでも条件を満たすものがあれば True を返す。Bundle.or で真偽値をまとめている。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1861, 1861]
function: "any"
difficulty: 1
format: 2
tags: [探索, 関数型, イテレータ]
---

## ひとことで

`any f v` は、ベクター `v` の要素のうち、1 つでも条件 `f` を満たすものがあるかを調べる関数です。あれば `True`、なければ `False` を返します。

## コード

```haskell:line-numbers=1861
any f = Bundle.or . Bundle.map f . stream
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つ、配列に近いデータ構造です。
- **流れ（ストリーム、`stream`）**: ベクターの要素を 1 つずつ取り出せる形に変えたものです。
- **`Bundle`**: 流れに関する処理をまとめた内部のモジュールです。
- **関数合成（`.`）**: 右の処理の結果を左の処理に渡す書き方です。

## 何をしているか

### 1. 処理の中身

```haskell:line-numbers=1861
any f = Bundle.or . Bundle.map f . stream
```

この関数は、`Bundle.map f` で各要素を真偽値に変え、`Bundle.or` で、その中に 1 つでも `True` があるかを調べます。`True` が見つかった時点で、結果が決まります。

## ここがすごい

`all` と同じ形で、`and` を `or` に置き換えただけの関数です。対になる関数を同じ形で書いておくと、読む側がすぐ理解できます。

実際に使うときは、`any (> 10) xs` のように条件を渡すと、10 より大きい値が 1 つでもあるかを調べられます。空のベクターに対しては、条件を満たす要素がないので `False` になります。

## まとめ

「どれか 1 つでも」は、各要素の真偽を集めて、1 つでも真があるかを見る形で書けます。

- `any` と `all` は、真偽の向きを変えると互いに変換できる。
- 1 つ見つかれば決まる判定は、早く終わる。
- 同じ形の関数を対で持つと、覚えやすい。
