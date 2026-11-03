---
title: "失敗したら次の選択肢へ、エラーを合わせて渡す「<|>」"
description: "Parsec の parserPlus。最初のパーサーが消費せずに失敗したら次を試し、両方が失敗したときは、2 つのエラーをまとめて報告する。"
language: haskell
project: "parsec"
repo: https://github.com/haskell/parsec
license: "BSD-2-Clause"
copyright: "(c) Daan Leijen 1999-2001, (c) Paolo Martini 2007"
commit: "6845fdd1cad92717f6a03cf3975b16c3ec7727cd"
file: src/Text/Parsec/Prim.hs
lines: [385, 393]
function: "parserPlus"
difficulty: 3
format: 2
tags: [パース, エラー処理, 関数型]
---

## ひとことで

`parserPlus` は、Parsec の選択肢 `<|>` の中身です。左のパーサー `m` を試し、それが入力を消費せずに失敗したら、右のパーサー `n` を試します。

「入力を消費したか」が、選択の条件になる点が重要です。途中まで読んで失敗したときは、別の選択肢には進まず、エラーをそのまま返します。

## コード

```haskell:line-numbers=385
parserPlus m n
    = ParsecT $ \s cok cerr eok eerr ->
      let
          meerr err =
              let
                  neok y s' err' = eok y s' (mergeError err err')
                  neerr err' = eerr $ mergeError err err'
              in unParser n s cok cerr neok neerr
      in unParser m s cok cerr eok meerr
```

## 前提知識

- **パーサーコンビネータ**: 小さな解析器を組み合わせて、大きな文法を解析する方法です。`<|>` や `many` などの部品を使います。
- **4 つの継続**: `cok`（消費して成功）、`cerr`（消費して失敗）、`eok`（消費せず成功）、`eerr`（消費せず失敗）です。結果を、この 4 つのどれかに振り分けます。
- **`mergeError`**: 2 つのエラーメッセージを 1 つにまとめる関数です。
- **`unParser`**: パーサーの中身（関数）を取り出す関数です。

## 何をしているか

### 1. 左を試す

```haskell:line-numbers=393
      in unParser m s cok cerr eok meerr
```

左のパーサー `m` を実行します。その結果は、4 つの継続のどれかに届きます。成功（消費あり・なし）や、消費したあとの失敗は、そのまま上に返されます。

### 2. 消費せず失敗したときだけ右へ

```haskell:line-numbers=388
          meerr err =
              let
                  neok y s' err' = eok y s' (mergeError err err')
                  neerr err' = eerr $ mergeError err err'
              in unParser n s cok cerr neok neerr
```

左が消費せず失敗したとき（`meerr`）、右のパーサー `n` を試します。右が成功すれば、2 つのエラーをまとめたものを付けて成功を返します（`neok`）。右も失敗すれば、やはり 2 つのエラーをまとめて失敗を返します（`neerr`）。

こうすると、「どの選択肢も違った」という情報を、利用者は両方とも見られます。

## ここがすごい

消費の有無を 4 つの継続で分けることで、「途中まで読んだ失敗は選択肢を変えない」という規則を、実装の中で自然に表せています。これが、Parsec のエラーの分かりやすさの基礎です。

また、失敗のエラーを捨てずに `mergeError` でまとめるので、利用者は「何を期待していたか」を一覧で見られます。小さな仕組みに、丁寧さが込められています。

## まとめ

- 選択肢の挙動は、「入力を消費したか」で分けると分かりやすい。
- 継続を使うと、成功と失敗の振り分けを、1 つの関数の中で表せる。
- エラーは捨てずに合わせると、原因の特定がしやすくなる。
