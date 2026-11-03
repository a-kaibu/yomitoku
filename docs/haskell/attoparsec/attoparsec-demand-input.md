---
title: "入力が足りないとき、続きを要求してから読む"
description: "attoparsec の demandInput。入力が終わっていれば失敗させ、まだ続きが来る可能性があれば、続きを待つように要求する。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Internal.hs
lines: [72, 78]
function: "demandInput"
difficulty: 2
format: 2
tags: [パース, 入出力, 防御的プログラミング]
---

## ひとことで

`demandInput` は、読みたい入力が足りないときに、続きを要求する処理です。入力がもう来ないと分かっているときは、「入力が足りない」という失敗にします。

## コード

```haskell:line-numbers=72
demandInput :: Chunk t => Parser t ()
demandInput = Parser $ \t pos more lose succ ->
  case more of
    Complete -> lose t pos more [] "not enough input"
    _ -> let lose' _ pos' more' = lose t pos' more' [] "not enough input"
             succ' t' pos' more' = succ t' pos' more' ()
         in prompt t pos more lose' succ'
```

## 前提知識

- **`more`**: まだ入力が続くかを表す印です。`Complete` は、もう続きがないことを表します。
- **`prompt`**: 入力の続きを求める処理です。受け取れたら、成功の処理へ進みます。
- **`lose` と `succ`**: 失敗したときと成功したときに呼ばれる継続です。
- **`Chunk t`**: 入力のかたまりを扱う型の制約です。`ByteString` や `Text` が当てはまります。

## 何をしているか

### 1. 続きが来ないなら、失敗させる

```haskell:line-numbers=75
    Complete -> lose t pos more [] "not enough input"
```

`more` が `Complete` なら、これ以上の入力は来ません。そこで `"not enough input"` という理由で失敗させます。

### 2. 続きが来るかもしれないなら、要求する

```haskell:line-numbers=76
    _ -> let lose' _ pos' more' = lose t pos' more' [] "not enough input"
```

続きが来る可能性があるとき、まず失敗したときの処理 `lose'` を用意します。続きが届かなかったら、やはり同じ理由で失敗します。

```haskell:line-numbers=78
         in prompt t pos more lose' succ'
```

`prompt` で続きを要求します。続きが届けば `succ'` が呼ばれ、読みが再開されます。

## ここがすごい

入力が来るのを待つ処理と、もう来ないと判断して失敗する処理を、同じ関数の中で分けています。読む側は、「足りないなら待つ」「終わりなら失敗」という規則を、そのまま読み取れます。

また、継続を使うことで、入力が分割されて届いても、同じ書き方で正しく動きます。

## まとめ

- 入力の終わりかどうかで、待つか失敗するかを分けると安全になる。
- 継続を使うと、入力が分かれて届く場合にも同じ書き方で対応できる。
- 失敗の理由を文字列で残すと、エラーの原因が分かりやすい。
