---
title: "一方が失敗したら、もう一方を試す"
description: "attoparsec の plus。左のパーサが失敗したとき、同じ位置から右のパーサを試す。読んだ分は元に戻してから右を始める。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Internal/Types.hs
lines: [161, 164]
function: "plus"
difficulty: 2
format: 2
tags: [パース, 関数型, 防御的プログラミング]
---

## ひとことで

`plus f g` は、まず `f` を試し、`f` が失敗したら同じ入力の同じ位置から `g` を試すパーサです。`<|>` や `mplus` の中身にあたる処理です。

## コード

```haskell:line-numbers=161
plus :: Parser i a -> Parser i a -> Parser i a
plus f g = Parser $ \t pos more lose succ ->
  let lose' t' _pos' more' _ctx _msg = runParser g t' pos more' lose succ
  in runParser f t pos more lose' succ
```

## 前提知識

- **`Parser i a`**: 入力 `i` を読んで、型 `a` の値を返すパーサです。
- **`MonadPlus`**: 失敗と選択を扱える型の仲間です。`mplus` で候補を並べられます。
- **継続 `lose` と `succ`**: 失敗と成功のときに呼ばれる処理です。
- **`_ctx` と `_msg`**: 失敗の詳しい情報ですが、ここでは使わないので `_` を付けています。

## 何をしているか

### 1. 失敗したときの行き先を差し替える

```haskell:line-numbers=163
  let lose' t' _pos' more' _ctx _msg = runParser g t' pos more' lose succ
```

`lose'` は、`f` が失敗したときに呼ばれる新しい処理です。その場で失敗を伝えず、代わりに `g` を実行します。

### 2. 元の位置から f を試す

```haskell:line-numbers=164
  in runParser f t pos more lose' succ
```

最初は、元の位置 `pos` から `f` を実行します。`f` が成功すれば `succ` が呼ばれ、結果がそのまま使われます。失敗すれば `lose'` が呼ばれ、同じ位置の `g` に移ります。

## ここがすごい

`g` は、`f` が読んだ分を気にせず、元の `pos` から始められます。つまり、`f` が途中まで読んでも、入力の位置は自動的に巻き戻されたのと同じ結果になります。

この仕組みのおかげで、候補を並べるだけで「やり直し」を正しく表せます。

## まとめ

- 候補の選択は、失敗時の行き先を差し替えると表せる。
- 失敗のあとは、同じ元の位置から別の候補を試せる。
- 小さな継続の組み合わせで、やり直しの仕組みが作れる。
