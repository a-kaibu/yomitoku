---
title: "ベクターの先頭に、要素を 1 つ足す"
description: "vector の cons。ベクターの先頭に新しい要素を付け加えて、新しいベクターを作る。元のベクターは変えない。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [726, 729]
function: "cons"
difficulty: 2
format: 2
tags: [データ構造, 関数型, 遅延評価]
---

## ひとことで

`cons x v` は、ベクター `v` の先頭に要素 `x` を付け加えた、新しいベクターを作る関数です。元のベクター `v` は変わりません。

## コード

```haskell:line-numbers=726
cons x v = elemseq (undefined :: v a) x
         $ unstream
         $ Bundle.cons x
         $ stream v
```

## 前提知識

- **ベクター**: 同じ型の要素を並べて持つ、効率のよいデータ構造です。
- **不変（イミュータブル）**: 一度作った値を書き換えず、新しい値を作る考え方です。
- **ストリーム（`stream`）**: ベクターを、要素を順に流す形に変えたものです。
- **`elemseq`**: 値を先に評価させるための補助関数です。

## 何をしているか

### 1. ベクターを流れに変える

```haskell:line-numbers=729
         $ stream v
```

まず、元のベクター `v` を要素の流れに変えます。元のベクターは、この段階では読むだけです。

### 2. 先頭に要素を付ける

```haskell:line-numbers=728
         $ Bundle.cons x
```

`Bundle.cons x` は、流れの先頭に `x` を付けます。

### 3. 新しいベクターにまとめる

```haskell:line-numbers=727
         $ unstream
```

`unstream` が、付け加えられた流れを新しいベクターにまとめます。`elemseq` で `x` を先に評価してから作るので、値が溜まりません。

## ここがすごい

元のベクターを書き換えずに、新しいベクターを作ります。書き換えないので、同じベクターを他の場所でも安全に使えます。

流れの段階で要素を付けるので、いったんリストに変換する方法より効率がよくなります。

## まとめ

- 先頭への追加は、流れの上で行うと効率がよい。
- 元の値を変えずに新しい値を作ると、安全に使い回せる。
- 値を先に評価すると、遅延評価による無駄を防げる。
