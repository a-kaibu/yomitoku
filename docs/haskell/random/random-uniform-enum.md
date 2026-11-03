---
title: "列挙できる型から、一様にランダムな値を 1 つ選ぶ"
description: "random の uniformEnumM。Enum と Bounded を持つ型の最小値と最大値の間で、整数の一様乱数を取り、型に戻す。"
language: haskell
project: "random"
repo: https://github.com/haskell/random
license: "BSD-3-Clause"
copyright: "(c) The University of Glasgow 2001"
commit: "b0ae8e4df9fd1a49217a044ec16e64b10c70dd78"
file: src/System/Random/Internal.hs
lines: [1550, 1550]
function: "uniformEnumM"
difficulty: 2
format: 2
tags: [乱数, 型システム, イディオム]
---

## ひとことで

`uniformEnumM g` は、`Enum` と `Bounded` を持つ型 `a` から、一様に選んだ値を 1 つ返します。型の最小値から最大値までを、整数の乱数で選んで戻します。

## コード

```haskell:line-numbers=1550
uniformEnumM g = toEnum <$> uniformRM (fromEnum (minBound :: a), fromEnum (maxBound :: a)) g
```

## 前提知識

- **`Enum`**: 値と整数を相互に変換できる型の制約です。`fromEnum` で整数にし、`toEnum` で戻します。
- **`Bounded`**: 最小値 `minBound` と最大値 `maxBound` を持つ型の制約です。
- **一様（uniform）**: どの値も同じ確率で選ばれることです。
- **`StatefulGen g m`**: 乱数の状態 `g` を、モナド `m` の中で更新しながら使う制約です。

## 何をしているか

### 1. 型で、列挙できる型だと示す

```haskell
uniformEnumM :: forall a g m. (Enum a, Bounded a, StatefulGen g m) => g -> m a
```

`Enum a` と `Bounded a` が、この関数の使える型の条件です。`forall a` は、中で `:: a` の型注釈を使うために書かれています。

### 2. 整数の範囲で乱数を取り、型に戻す

```haskell:line-numbers=1550
uniformEnumM g = toEnum <$> uniformRM (fromEnum (minBound :: a), fromEnum (maxBound :: a)) g
```

`fromEnum minBound` と `fromEnum maxBound` で、型の端を整数にします。`uniformRM` がその範囲から一様な整数を選び、`toEnum` が結果を型 `a` の値に戻します。

例えば `Bool` は `False` が 0、`True` が 1 なので、`uniformEnumM` は 2 つのどちらかを同じ確率で返します。

## ここがすごい

範囲を手で書かずに、型が持つ `minBound` と `maxBound` から自動で決めています。列挙型を増やしても、この関数を書き直す必要はありません。

整数に変換して一様な乱数を取るので、個々の値を並べて選ぶ方法より単純です。

## まとめ

- 列挙できる型なら、`Enum` と `Bounded` だけで一様に選べる。
- 範囲は `minBound` と `maxBound` から自動で決まる。
- 整数に変換して選び、型へ戻すのが基本の考え方。
