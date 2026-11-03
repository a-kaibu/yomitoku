---
title: "部品のリストを逆順にして、1 つにまとめる"
description: "attoparsec の concatReverse。部品が 1 つだけならそのまま返し、複数あるときは逆順にしてから連結する。結果の順番を正しく保つための工夫。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Internal.hs
lines: [168, 170]
function: "concatReverse"
difficulty: 1
format: 2
tags: [パース, 関数型, 最適化]
---

## ひとことで

`concatReverse` は、断片のリストを受け取って、それを 1 つにまとめる関数です。ただし、断片が逆の順に積まれているので、まとめる前に順番を戻します。

## コード

```haskell:line-numbers=168
concatReverse :: Monoid m => [m] -> m
concatReverse [x] = x
concatReverse xs  = mconcat (reverse xs)
```

## 前提知識

- **`Monoid m`**: 「2 つを 1 つにまとめられ、空の値がある」型の制約です。リストや文字列が当てはまります。
- **`mconcat`**: リストの要素を、順番に 1 つにまとめる関数です。
- **`reverse`**: リストの順番を逆にする関数です。
- **断片を逆に積む**: 入力を読むとき、新しい断片を先頭に足していくと、リストは逆の順番になります。

## 何をしているか

### 1. 断片が 1 つだけなら、そのまま返す

```haskell:line-numbers=169
concatReverse [x] = x
```

1 つしかないなら、並べ替えも連結も必要ありません。その値をそのまま返します。

### 2. 逆順を戻してからまとめる

```haskell:line-numbers=170
concatReverse xs  = mconcat (reverse xs)
```

それ以外のときは、`reverse` で順番を正しい向きに戻し、`mconcat` で 1 つにまとめます。

## ここがすごい

断片を先頭に足す方法は、リストの先頭への追加が速いので、読み込みの途中で素早く積めます。最後に 1 回だけ逆にすれば、順番の問題が解決します。

また、1 つだけの場合を特別扱いしているので、よくある短い入力での無駄な処理を避けられます。

## まとめ

- 先頭に足していく方法は速いが、結果の順番が逆になる。
- 最後に一度だけ逆にすると、正しい順番に戻せる。
- よくある特別な場合を先に扱うと、全体が速くなる。
