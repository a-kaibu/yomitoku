---
title: "途中まで読んだ失敗を、なかったことにする「try」"
description: "Parsec の try。入力を消費したあとの失敗を、消費しなかった失敗に書き換え、別の選択肢へ戻れるようにする。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Prim.hs
lines: [597, 600]
function: "try"
difficulty: 2
format: 2
tags: [パース, エラー処理, 関数型]
---

## ひとことで

`try` は、パーサーを包んで、入力を消費したあとの失敗を「消費しなかった失敗」として扱わせる関数です。こうすると、`<|>` で次の選択肢に戻れます。

たとえば `let` と `letter` のように、先頭が同じ文字列の選択肢では、途中まで読んでから失敗します。`try` を付けると、そこから読み直せます。

## コード

```haskell:line-numbers=597
try :: ParsecT s u m a -> ParsecT s u m a
try p =
    ParsecT $ \s cok _ eok eerr ->
    unParser p s cok eerr eok eerr
```

## 前提知識

- **消費と失敗の区別**: Parsec では、入力を 1 文字でも読んだ失敗（消費した失敗）は、`<|>` で別の選択肢に進まないのが規則です。
- **継続**: `ParsecT` の中で、成功や失敗の結果を受け取る関数です。`cok`、`cerr`、`eok`、`eerr` の 4 つがあります。
- **`unParser`**: パーサーの中身を取り出す関数です。
- **`ParsecT $ \s ... -> ...`**: 入力 `s` を受け取り、4 つの継続を使って結果を返す関数で、パーサーの本体です。

## 何をしているか

### 1. 継続を組み替える

```haskell:line-numbers=598
try p =
    ParsecT $ \s cok _ eok eerr ->
    unParser p s cok eerr eok eerr
```

`unParser p s cok eerr eok eerr` は、パーサー `p` を入力 `s` で実行します。ここで、消費したあとの失敗 `cerr` の位置に、消費しない失敗 `eerr` を渡しています。成功と、消費しない結果はそのまま渡します。

つまり、`try` は失敗の種類だけを書き換えて、成功の結果には手を加えません。

## ここがすごい

`try` は、入力を巻き戻す処理を書いていません。代わりに、どの継続に結果を渡すかを変えるだけです。入力の位置は最初から保持されているので、戻る処理そのものが不要です。

この設計によって、`try` は小さな関数で書けています。そして、「どこまで読んだか」を管理する仕組みは、パーサーの核の部分に任せています。

## まとめ

- 失敗の種類を書き換えると、選択肢を戻れるようになる。
- 入力を巻き戻すのではなく、結果の届け先を変える。
- 規則を 1 か所の仕組みにまとめると、読み手が理解しやすい。
