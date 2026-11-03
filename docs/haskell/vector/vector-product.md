---
title: "全部の要素を順にかけ合わせる"
description: "vector の product。全要素を左から順にかけて 1 つの値にする。空のベクターでは 1 を返す、掛け算の単位元の性質を使っている。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1913, 1913]
function: "product"
difficulty: 1
format: 2
tags: [数値計算, 遅延評価, イディオム]
---

## ひとことで

`product` は、ベクターのすべての要素をかけ合わせて、1 つの値として返します。`sum` と同じ作りで、足し算の代わりに掛け算を使います。

## コード

```haskell:line-numbers=1913
product = Bundle.foldl' (*) 1 . stream
```

## 前提知識

- **`Num a`**: 掛け算などの数の演算ができる型の制約です。
- **単位元（identity）**: 演算しても値が変わらない数です。足し算は 0、掛け算は 1 です。
- **`foldl'`**: 左から畳み込みながら、途中の値を毎回確定させる版です。
- **`(*)`**: 掛け算の関数を、演算子を括弧で囲んで渡したものです。

## 何をしているか

### 1. 型で数の制約をつける

```haskell
product :: (Vector v a, Num a) => v a -> a
```

要素は `Num a` を満たす数である必要があります。戻り値は同じ型 `a` の 1 つの値です。

### 2. 初期値 1 から掛けていく

```haskell:line-numbers=1913
product = Bundle.foldl' (*) 1 . stream
```

初期値は `1` です。流れの要素を先頭から順に `(*)` で掛けていきます。空のベクターでは何も掛けないので、初期値の `1` がそのまま返ります。

例えば `[2, 3, 4]` なら、`1 * 2 * 3 * 4 = 24` です。

## ここがすごい

初期値を `0` ではなく `1` にするのが要点です。掛け算の初期値を `0` にすると、どの要素をかけても結果が 0 になってしまいます。

`sum` と同じ関数の形を、演算子だけ変えて使えるので、畳み込みの型を覚えれば両方が読めます。

## まとめ

- 掛け算の初期値は単位元の `1` にする。
- 空のベクターでも `1` が返るので、例外にならない。
- `sum` と同じ形なので、畳み込みの定番パターンとして覚えられる。
