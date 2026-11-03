---
title: "認証サーバーに、自分のクッキーを問い合わせる"
description: "auth:get_cookie/0 は、認証プロセスが動いているかを確かめ、動いていれば自分のクッキーを問い合わせる。動いていなければ nocookie を返す。ノード間の接続で使う秘密の値の取り出し方。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/auth.erl
lines: [147, 153]
function: "auth:get_cookie/0"
difficulty: 2
format: 2
tags: ["ネットワーク", "API設計", "標準ライブラリ"]
---
## ひとことで

`auth:get_cookie/0` は、このノードが使っているクッキーを返します。
クッキーは、Erlang のノード同士が接続するときに、互いを認証するための秘密の値です。認証プロセスが動いていないときは、`nocookie` を返します。

## コード

```erlang:line-numbers=147
get_cookie() ->
    case whereis(auth) of
        undefined ->
            nocookie;
        AuthPid ->
            gen_server:call(AuthPid, get_our_cookie, infinity)
    end.
```

## 前提知識

- **ノード**: Erlang の実行単位です。`node@host` のような名前を持ち、ネットワーク越しに他のノードと通信できます。
- **クッキー（cookie）**: ノード間の接続を認める、共有の秘密の値です。同じ値を持つノードだけが、互いに接続できます。
- **`whereis/1`**: 登録された名前から、プロセスを探す関数です。見つからなければ `undefined` を返します。
- **`gen_server:call/3`**: 別のプロセスに問い合わせて、応答を待つ関数です。`infinity` は、待ち時間の上限がないことを表します。

## 何をしているか

### 1. 認証プロセスを探す

```erlang:line-numbers=148
    case whereis(auth) of
        undefined ->
            nocookie;
```

`whereis(auth)` で、名前 `auth` のプロセスを探します。見つからなければ、`nocookie` を返します。
認証プロセスが起動していない場合は、クッキーを問い合わせる相手がいないので、この値になります。

### 2. 見つかれば、そのプロセスに問い合わせる

```erlang:line-numbers=151
        AuthPid ->
            gen_server:call(AuthPid, get_our_cookie, infinity)
```

プロセスが見つかったら、`gen_server:call/3` で、`get_our_cookie` を送ります。
応答が、このノードのクッキーです。待ち時間は `infinity` なので、応答が来るまで待ちます。

## ここがすごい

### 動いていない場合を、値で返す

認証プロセスが無いことを、例外ではなく `nocookie` という値で表します。
呼び出し側は、クッキーが取れなかった場合を、通常の分岐として扱えます。

### 秘密の値を、プロセスの中に閉じ込める

クッキーの値は、認証プロセスの中で管理されています。
この関数は、問い合わせの窓口にすぎません。値を直接持たないことで、外からの読み取りを、問い合わせという一つの経路に限っています。

### 待ち時間の上限を付けない

`infinity` は、応答が来るまで待つという指定です。
認証プロセスが応答できないと、この呼び出しも止まります。待ち時間の扱いは、呼び出し側の設計として覚えておく必要があります。

## まとめ

`auth:get_cookie()` は、認証プロセスが動いていれば、そのノードのクッキーを返します。
動いていなければ、`nocookie` を返します。
