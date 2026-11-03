---
title: "ベクターの真偽値のうち、1 つでも真があるかを調べる"
description: "vector の or。真偽値のベクターに、True が 1 つでもあれば True を返す。条件を渡さずに、そのまま真偽値を判定する。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1887, 1887]
function: "or"
difficulty: 1
format: 2
tags: [探索, 関数型, イテレータ]
---

## ひとことで

`or v` は、真偽値が並んだベクター `v` の中に、1 つでも `True` があるかを調べる関数です。

## コード

```haskell:line-numbers=1887
or = Bundle.or . stream
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つ、配列に近いデータ構造です。
- **流れ（ストリーム、`stream`）**: ベクターの要素を 1 つずつ取り出せる形に変えたものです。
- **`Bundle`**: 流れに関する処理をまとめた内部のモジュールです。
- **関数合成（`.`）**: 右の処理の結果を左の処理に渡す書き方です。

## 何をしているか

### 1. 処理の中身

```haskell:line-numbers=1887
or = Bundle.or . stream
```

この関数は、ベクターを流れに変えてから、`Bundle.or` で判定しています。真偽値をそのまま扱うので、条件の関数を渡す必要はありません。

## ここがすごい

条件を渡す `any` と違い、`or` は値そのものを見ます。使い分けを名前で示すことで、読む側が迷いにくくなっています。

実際に使うときは、条件を組み合わせた真偽値のベクターを作ってから `or` で判定すると、途中で結果を確かめる手間が省けます。空のベクターに対しては、真が 1 つもないので `False` になります。

実際の使い方としては、`or` を使う前に、真偽値の並びをどう作るかを決めておくと安心です。結果は、真が 1 つでも見つかれば `True` になり、そのあとの要素は調べる必要がありません。

## まとめ

真偽値の並びに対しては、条件なしの `or` で判定できます。

- 値をそのまま判定するなら、条件の関数を省ける。
- `any` と `or` の関係を理解すると、畳み込みの考え方が見えてくる。
- 短い関数でも、役割を名前で分けると読みやすい。
