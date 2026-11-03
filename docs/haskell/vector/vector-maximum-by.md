---
title: "比べ方を自分で決めて、いちばん大きい要素を取る"
description: "vector の maximumBy。比較の関数を渡して、いちばん大きい要素を返す。同じ値が並ぶときの扱いは、比較の関数の作り方で決まる。"
language: haskell
project: "vector"
repo: https://github.com/haskell/vector
license: "BSD-3-Clause"
copyright: "Copyright (c) 2008-2012, Roman Leshchinskiy; 2020-2022, Alexey Kuleshevich; 2020-2022, Aleksey Khudyakov"
commit: "313568c7ac1f078a385c6efadd7e1f85b2bbbfa9"
file: vector/src/Data/Vector/Generic.hs
lines: [1947, 1947]
function: "maximumBy"
difficulty: 2
format: 2
tags: [アルゴリズム, 関数型, ソート]
---

## ひとことで

`maximumBy cmp v` は、比較の関数 `cmp` を使って、ベクターの中でいちばん大きい要素を 1 つ返します。`cmp` は 2 つの要素を比べて `LT`、`EQ`、`GT` のどれかを返す関数です。

## コード

```haskell:line-numbers=1947
maximumBy cmpr = Bundle.foldl1' maxBy . stream
```

## 前提知識

- **`Ordering`**: 比較の結果を表す型です。`LT`（小さい）、`EQ`（等しい）、`GT`（大きい）の 3 つがあります。
- **比較関数**: 2 つの値を受け取り、`Ordering` を返す関数です。`comparing fst` のように、組み立てて作ることもできます。
- **`foldl1'`**: 最初の要素を初期値にして、残りを左から厳密に畳み込む関数です。空のベクターでは使えません。
- **`where`**: 関数の中で使う補助の定義を書く場所です。

## 何をしているか

### 1. 比較の関数で型を決める

```haskell
maximumBy :: Vector v a => (a -> a -> Ordering) -> v a -> a
```

比較の関数 `(a -> a -> Ordering)` を受け取ります。戻り値は、ベクターの要素と同じ型 `a` です。比べ方を呼び出し側が選べるので、数値以外の値でも同じ関数で扱えます。

### 2. 流れを先頭から畳み込む

```haskell:line-numbers=1947
maximumBy cmpr = Bundle.foldl1' maxBy . stream
```

`stream` で流れにし、`Bundle.foldl1'` が最初の要素を初期値にして、残りを左から順に `maxBy` で比べます。`maxBy` は、途中の最大と次の要素のうち、大きい方を残す補助の関数です。

例えば `[(1,'a'), (1,'b')]` を `comparing fst` で比べると、`fst` が同じなので、先に出てきた `(1,'a')` が残ります。

## ここがすごい

比べ方を引数にしているので、`maximum` のように要素の型で決まる比べ方に縛られません。同じ関数で、名前の長さで比べることも、日付で比べることもできます。

また、`foldl1'` を使うので、比べながら途中の結果を溜めずに 1 回の走査で最大値を決めます。

## まとめ

- 比べ方を引数で渡すと、型に縛られない最大値の取り方ができる。
- 最初の要素を初期値にする `foldl1'` で、1 回の走査で済む。
- 空のベクターでは使えないので、呼び出し側で空かどうか注意する。
