---
title: "ノードに接続できるかを、ping の結果で yes か no に直す"
description: "auth:is_auth/1 は、相手のノードに ping を送り、pong なら yes、pang なら no を返す。ping の二択の結果を、別の二択の語に読み替える小さな関数。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/auth.erl
lines: [91, 95]
function: "auth:is_auth/1"
difficulty: 1
format: 2
tags: ["ネットワーク", "エラー処理", "イディオム"]
---
## ひとことで

`auth:is_auth/1` は、分散 Erlang のノードに、認証を含めて接続できるかを調べます。
中身は、`net_adm:ping/1` の結果を、`yes` と `no` に言い換えるだけです。

## コード

```erlang:line-numbers=91
is_auth(Node) ->
    case net_adm:ping(Node) of
	pong -> yes;
	pang -> no
    end.
```

## 前提知識

- **`net_adm:ping/1`**: 相手のノードに接続を試み、応答があれば `pong`、無ければ `pang` を返します。
- **`pong` と `pang`**: 応答の有無を表すアトムです。
- **`yes` と `no`**: この関数が返す、旧来の形の二択の値です。
- **`case` 式**: 二つの枝で、値の形によって答えを変えます。

## 何をしているか

### 1. ping を送り、結果で分ける

```erlang:line-numbers=92
    case net_adm:ping(Node) of
	pong -> yes;
	pang -> no
    end.
```

`net_adm:ping(Node)` の結果が `pong` なら、接続できたので `yes` を返します。
`pang` なら、応答が無かったので `no` を返します。

## ここがすごい

### 判定を、既存の関数に任せる

接続を試す仕組みを、この関数は書いていません。すでにある `net_adm:ping/1` を使い、その結果の表し方だけを変えています。
仕組みを一箇所に保ったまま、呼び出し側に分かりやすい形で返す、という役割分担です。

### 戻り値を、読みやすい語に変える

`pong` と `pang` は、分散 Erlang の内部で使われる語です。
`yes` と `no` は、「接続できるか」を素直に表す語です。この関数は、その言い換えを担当しています。

### 二つの枝だけで、答えが決まる

`case` の枝は二つだけで、どちらかに必ず当たります。
ping の結果は、`pong` か `pang` の二つしか無いので、これで網羅できています。読み手は、二つの枝を読むだけで全体が分かります。

### 偽の答えを作らない

ping が `pang` を返したとき、この関数は `no` を返します。例外を投げたり、推測で `yes` を返したりはしません。
二つの結果を、そのまま対応させるので、呼び出し側は、結果を信じて分岐できます。

### 呼び出すたびに、接続を試す

この関数は、結果を覚えておくことはしません。呼ばれるたびに、実際に ping を送ります。
そのため、接続の状態が変わった後に呼べば、新しい答えが返ります。古い結果を使い回さないことが、この関数の性質です。

## まとめ

`auth:is_auth(Node)` は、相手のノードに応答があれば `yes`、無ければ `no` を返します。
中身は、`net_adm:ping/1` を一度呼び、その結果を言い換えるだけです。
