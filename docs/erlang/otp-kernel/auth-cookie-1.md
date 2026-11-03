---
title: "認証クッキーを、引数の形の違いを受け入れて設定する"
description: "auth:cookie/1 は、クッキーを [Cookie] の形でも、Cookie そのままの形でも受け取り、どちらも set_cookie に渡す。同じ処理を、引数の形ごとに二つの節に書いている。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/auth.erl
lines: [112, 115]
function: "auth:cookie/1"
difficulty: 2
format: 2
tags: ["ネットワーク", "イディオム", "API設計"]
---
## ひとことで

`auth:cookie/1` は、分散 Erlang の認証クッキーを設定する関数です。
引数は、一つのリストに包まれた形でも、包まれていない形でも受け取れます。どちらの形でも、最後の処理は `set_cookie/1` に任せます。

## コード

```erlang:line-numbers=112
cookie([Cookie]) ->
    set_cookie(Cookie);
cookie(Cookie) ->
    set_cookie(Cookie).
```

## 前提知識

- **認証クッキー（cookie）**: 分散 Erlang のノードどうしが、互いを信頼するための合言葉です。同じクッキーのノードだけが接続できます。
- **`set_cookie/1`**: 現在のノードのクッキーを、実際に設定する関数です。この関数は、その入り口です。
- **`[Cookie]`**: 一つの要素を持つリストです。引数の形の一つです。
- **二つの節**: 引数の形が違えば、別の節が選ばれます。

## 何をしているか

### 1. 一要素のリストで渡された場合

```erlang:line-numbers=112
cookie([Cookie]) ->
    set_cookie(Cookie);
```

引数が `[Cookie]` の形なら、その中の `Cookie` を取り出して、`set_cookie/1` に渡します。

### 2. そのまま渡された場合

```erlang:line-numbers=114
cookie(Cookie) ->
    set_cookie(Cookie).
```

引数が、リストに包まれていない形なら、その値をそのまま `set_cookie/1` に渡します。

## ここがすごい

### 呼び出し方の揺れを、入口で吸収する

同じ目的を、二通りの書き方で呼べるようにしています。
利用者は、どちらの形で書いても、同じ結果を得られます。引数の形の違いを、この関数の中で一度だけ扱っています。

### 同じ処理を、二つの節で書く

二つの節の本体は、同じ `set_cookie/1` の呼び出しです。
節を分けているのは、引数の形を読み取るためだけです。本体の処理は、どちらの節でも変えていません。

### 中身は、一つの関数に任せる

実際の設定は、`set_cookie/1` が行います。
この関数は、受け取る形を整えるだけです。役割を分けたことで、設定の仕組みを変えても、この入口は変わりません。

### 旧い形と新しい形を、同時に受け付ける

同じ関数が、二つの形を受け付けると、古い呼び出し方を壊さずに、新しい書き方も使えます。
この関数の二つの節は、その役割を果たしています。どちらの形で書かれていても、クッキーは確実に設定されます。

### 形の違いを、一箇所で吸収する

引数の形を気にするのは、この関数の入口だけです。設定の本体が、どの形の引数を前提にしているかは、ここで確定しています。
呼び出し元が、どちらの形を使ってもよいという約束は、この二つの節が支えています。

## まとめ

`auth:cookie([secret])` と `auth:cookie(secret)` は、どちらも同じクッキー `secret` を設定します。
引数の書き方が違っても、結果は同じです。
