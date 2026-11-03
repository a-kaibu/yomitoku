---
title: "指定した文字が、列の中に何回出るかを数える"
description: "text の countCharI。文字を 1 つずつ流しながら、指定した文字と同じものの数を数える。結果の型を Integral で自由に選べる。"
language: haskell
project: "text"
repo: https://github.com/haskell/text
license: "BSD-2-Clause"
copyright: "(c) Bryan O'Sullivan 2009"
commit: "9b7ff8a4cd33c01a098a83c59ffd60853045215f"
file: src/Data/Text/Internal/Fusion/Common.hs
lines: [1193, 1200]
function: "countCharI"
difficulty: 2
format: 2
tags: [文字列処理, 再帰, 最適化]
---

## ひとことで

`countCharI c s` は、列 `s` の中に文字 `c` が何回出てくるかを数える関数です。数えた結果は、呼び出す側が決めた整数の型で返されます。

## コード

```haskell:line-numbers=1193
countCharI :: Integral a => Char -> Stream Char -> a
countCharI a (Stream next s0 _len) = loop 0 s0
  where
    loop !i !s = case next s of
      Done                   -> i
      Skip    s'             -> loop i s'
      Yield x s' | a == x    -> loop (i+1) s'
                 | otherwise -> loop i s'
```

## 前提知識

- **`Integral a`**: 整数として扱える型の制約です。`Int` や `Integer` などが当てはまります。
- **`next` と状態 `s`**: 列を 1 つ進めるための関数と、今の位置を表す値です。
- **`Yield` と `Skip`**: 要素がある状態と、要素のない状態です。
- **`!i` と `!s`**: 値を先に計算させる印です。数えるたびに溜まることを防ぎます。

## 何をしているか

### 1. 列を 1 つずつ進める

```haskell:line-numbers=1196
    loop !i !s = case next s of
```

今の状態 `s` から次の状態を取り出します。`i` は、ここまでに数えた個数です。

### 2. 要素がなければ、数を返す

```haskell:line-numbers=1197
      Done                   -> i
```

列が終わったら、数えた個数 `i` をそのまま返します。

### 3. 同じ文字なら、数を 1 増やす

```haskell:line-numbers=1199
      Yield x s' | a == x    -> loop (i+1) s'
```

取り出した文字 `x` が探している文字 `a` と同じなら、数を 1 増やして次へ進みます。違うときは、`otherwise` の行で数を変えずに進みます。

## ここがすごい

数えながら、前の数を捨てて新しい数だけを持っていきます。リストを作って長さを取る方法と違って、大きな列でもメモリをほとんど使いません。

また、`!i` を付けて数を毎回確定させるので、遅延評価で数の計算が溜まらず、速く終わります。

## まとめ

- 数えるだけの処理は、リストを作らず一度の走査で済ませられる。
- 返す型を `Integral a` にすると、用途に合わせて型を選べる。
- 感嘆符（`!`）で値を先に確定させると、メモリの溜まりを防げる。
