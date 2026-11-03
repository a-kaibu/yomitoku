---
title: "全部が真かどうかを、1 回の走査で調べる"
description: "vector の and。ベクターの中の Bool がすべて True なら True を返す。内部ではストリームに変換して走査する。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov\""
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1874, 1874]
function: "and"
difficulty: 1
format: 2
tags: [アルゴリズム, イテレータ]
---

## ひとことで

`and` は、ベクターに入っている真偽値（`Bool`）がすべて `True` かを調べる関数です。ひとつでも `False` があれば `False` を返します。

## コード

```haskell:line-numbers=1874
and = Bundle.and . stream
```

## 前提知識

- **`Bool`**: `True` か `False` の値です。
- **ストリーム**: 要素を先頭から順に取り出していく、流れのような仕組みです。ベクターを読むときの中間の形になります。
- **`.`（関数合成）**: `f . g` は、先に `g` を適用し、その結果に `f` を適用する書き方です。

## 何をしているか

### 1. 型で制約する

```haskell:line-numbers=1872
and :: Vector v Bool => v Bool -> Bool
```

型は `Vector v Bool => v Bool -> Bool` です。要素の型が `Bool` に限られているので、すべてが真かどうかの意味がはっきりします。

### 2. ストリームに変えて、まとめて調べる

```haskell:line-numbers=1874
and = Bundle.and . stream
```

`stream` は、ベクターを要素の流れに変えます。`Bundle.and` がその流れを先頭から見て、`False` が出た時点で結果を決めます。

## ここがすごい

`and` は、ベクターを作り直さずに、要素の流れを読むだけで答えを出します。`False` が見つかった時点で止まるので、無駄な走査をしません。

本体が `Bundle.and . stream` の 1 行で、実際の処理は `Bundle` の側に任せています。ベクターの型と処理の層を分けている、という設計がよく表れています。

## まとめ

- 全部が真かを調べるには、`False` を見つけた時点で止まる走査が効率的。
- ベクターは `stream` で流れに変えてから処理すると、中間の配列を作らずに済む。
- 型の制約 `Vector v Bool` で、対象の要素を限定している。
