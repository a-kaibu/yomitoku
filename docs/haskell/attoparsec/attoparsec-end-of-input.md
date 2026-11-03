---
title: "入力がすべて読み終わったことを確かめる"
description: "attoparsec の endOfInput。入力がもう残っていなければ成功し、まだ残っていれば失敗する。続きがあるかもしれない場合は、続きを要求してから確かめる。"
language: haskell
project: "attoparsec"
repo: https://github.com/haskell/attoparsec
license: "BSD-3-Clause"
copyright: "Bryan O'Sullivan 2007-2015"
commit: "7244e6b85b953cdff50172ce78398c5d20f0230c"
file: Data/Attoparsec/Internal.hs
lines: [109, 117]
function: "endOfInput"
difficulty: 2
format: 2
tags: [パース, 防御的プログラミング, 入出力]
---

## ひとことで

`endOfInput` は、入力がすべて読まれたことを確かめるパーサです。もう入力が無ければ成功し、まだ読み残しがあれば失敗します。

## コード

```haskell:line-numbers=109
endOfInput :: forall t . Chunk t => Parser t ()
endOfInput = Parser $ \t pos more lose succ ->
  case () of
    _| pos < atBufferEnd (undefined :: t) t -> lose t pos more [] "endOfInput"
     | more == Complete -> succ t pos more ()
     | otherwise ->
       let lose' t' pos' more' _ctx _msg = succ t' pos' more' ()
           succ' t' pos' more' _a = lose t' pos' more' [] "endOfInput"
       in  runParser demandInput t pos more lose' succ'
```

## 前提知識

- **`Parser t ()`**: 結果を持たず、成功か失敗かだけを返すパーサです。
- **`more`**: 続きの入力があるかを表す印です。
- **`demandInput`**: 続きの入力を要求する処理です。失敗すると、そのまま成功側へ進みます。
- **`lose` と `succ`**: 失敗と成功のときに呼ばれる継続です。

## 何をしているか

### 1. まだ読み残しがあれば失敗

```haskell:line-numbers=112
    _| pos < atBufferEnd (undefined :: t) t -> lose t pos more [] "endOfInput"
```

今のかたまりに読み残しがあるなら、`"endOfInput"` という理由で失敗します。

### 2. もう続きが来ないなら成功

```haskell:line-numbers=113
     | more == Complete -> succ t pos more ()
```

かたまりが終わっていて、続きも来ないと分かっていれば、成功して `()` を返します。

### 3. 続きを要求して、結果を逆にする

```haskell:line-numbers=114
     | otherwise ->
```

続きが来るかもしれないときは、`demandInput` で続きを要求します。続きが来れば、そこに読み残しがあるので失敗します。続きが来なければ成功します。`lose'` と `succ'` を入れ替えて、結果の意味を反転させています。

## ここがすごい

「続きが来たら失敗、来なければ成功」という反対の意味を、継続の入れ替えだけで表しています。判定のために、新しい分岐の仕組みを追加していません。

## まとめ

- 終わりの判定は、続きの要求と継続の入れ替えで書ける。
- 反対の意味は、成功と失敗の行き先を入れ替えると表せる。
- 入力の終わりを確かめる処理は、パースの最後に必ず使うと安心。
