---
title: "要素が最初に現れる位置を探す"
description: "vector の elemIndex。ある値と等しい最初の要素の添字を Maybe で返す。findIndex に等しさの判定を渡しただけの短い関数。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "\"Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov\""
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1734, 1734]
function: "elemIndex"
difficulty: 1
format: 2
tags: [探索, 型システム]
---

## ひとことで

`elemIndex` は、ベクターの中で指定した値が最初に現れる位置（添字）を探す関数です。見つからなければ `Nothing` を返します。

## コード

```haskell:line-numbers=1734
elemIndex x = findIndex (x ==)
```

## 前提知識

- **`Eq a`**: 値どうしが等しいかを判定できる、という型クラスの制約です。
- **`findIndex`**: 条件を満たす最初の要素の添字を返す関数です。
- **`(x ==)`**: `x ==` は、引数 `y` を受け取って `x == y` を返す関数です。演算子の「部分適用」と呼ばれる書き方です。

## 何をしているか

### 1. 等しさの判定を作る

```haskell:line-numbers=1734
elemIndex x = findIndex (x ==)
```

`(x ==)` は「与えられた値が `x` と等しいか」を判定する関数になります。これを `findIndex` に渡しています。

### 2. 条件で探す

`findIndex` は、条件を満たす最初の位置を探します。ここでは条件が「`x` と等しいか」なので、`elemIndex` は「`x` が最初に出てくる位置」を返すことになります。

## ここがすごい

探す仕事を作り直さず、既にある `findIndex` に、判定だけを差し替えて渡しています。同じ探索の処理を、ひとつにまとめています。

`elemIndex` 自体は 1 行なので、読むときは `findIndex` の仕組みを理解するのが近道です。

## まとめ

- 値の位置を探すなら、条件を渡す `findIndex` の特別な場合として考えられる。
- `(x ==)` のように演算子を部分適用すると、判定の関数を短く書ける。
- 見つからないことを `Nothing` で表すと、呼ぶ側が確実に扱える。
