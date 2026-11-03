---
title: "入力の終わりに達したかを、真偽値で返す"
description: "attoparsec の atEnd。入力がもう残っていなければ True を返す。判定のために、読み位置は進めない。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Internal.hs
lines: [123, 124]
function: "atEnd"
difficulty: 1
format: 2
tags: [パース, 防御的プログラミング, 入出力]
---

## ひとことで

`atEnd` は、入力がすべて読み終わったかどうかを判定するパーサです。終わっていれば `True`、まだ続きがあれば `False` を返します。読み位置は進みません。

## コード

```haskell:line-numbers=123
atEnd :: Chunk t => Parser t Bool
atEnd = not <$> wantInput
```

## 前提知識

- **`wantInput`**: 入力がまだあるかを真偽値で返すパーサです。前の記事で扱いました。
- **`not`**: 真偽値を反対にする関数です。
- **`<$>`**: パーサの結果に関数を当てる演算子です。
- **`Chunk t`**: 入力のかたまりを扱う型の制約です。

## 何をしているか

### 1. 入力があるかを確かめる

`wantInput` は、入力が残っているなら `True` を返します。読み位置は動きません。

### 2. 結果を反対にする

```haskell:line-numbers=124
atEnd = not <$> wantInput
```

`atEnd` は、`wantInput` の結果を `not` で反対にします。入力が残っていれば `False`、終わっていれば `True` になります。`<$>` で結果だけを変換するので、入力の位置は変わりません。

## ここがすごい

終わりの判定を、新しい仕組みを作らずに、既存の `wantInput` の反対として定義しています。わずか 1 行で済むのは、部品をうまく組み合わせているからです。

判定のための処理なので、読み位置を進めません。そのため、「まだ読みたくないが終わりかどうかだけ知りたい」という場面に安心して使えます。

## まとめ

- 判定の関数は、既存の判定を反対にすると短く書ける。
- `<$>` で結果だけを変えると、読み位置は変わらない。
- 判定系のパーサは、先読みのための道具として役立つ。
