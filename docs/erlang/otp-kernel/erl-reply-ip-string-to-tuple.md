---
title: "ドット付きの IPv4 の文字列を、四つの数の組に直す"
description: "erl_reply:ip_string_to_tuple/1 は、\"192.168.0.1\" のような文字列を、ドットで四つに分けて整数にし、{192,168,0,1} の組として返す。区切りが四つでなければ、一致しなくて失敗する。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1997-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/erl_reply.erl
lines: [47, 52]
function: "erl_reply:ip_string_to_tuple/1"
difficulty: 2
format: 2
tags: ["ネットワーク", "パース", "文字列処理"]
---
## ひとことで

`erl_reply:ip_string_to_tuple/1` は、IPv4 のアドレスを表す文字列を、四つの整数の組に変えます。
たとえば、`"192.168.0.1"` は、`{192, 168, 0, 1}` になります。文字列の形がドットで四つに分かれていなければ、一致しないので失敗します。

## コード

```erlang:line-numbers=47
ip_string_to_tuple(Ip) ->
    [Ip1,Ip2,Ip3,Ip4] = string:lexemes(Ip,"."),
    {list_to_integer(Ip1),
     list_to_integer(Ip2),
     list_to_integer(Ip3),
     list_to_integer(Ip4)}.
```

## 前提知識

- **`string:lexemes/2`**: 文字列を、指定の区切り文字で分け、空でない部分だけを並べたリストにします。`"."` を渡せば、ドットで区切ります。
- **`list_to_integer/1`**: 数字だけの文字列を、整数に直します。
- **パターン `[Ip1,Ip2,Ip3,Ip4]`**: 四つの要素を持つリストにだけマッチします。
- **タプル**: 四つの整数を、一つの値にまとめて返します。

## 何をしているか

### 1. ドットで区切り、四つの部分に分ける

```erlang:line-numbers=48
    [Ip1,Ip2,Ip3,Ip4] = string:lexemes(Ip,"."),
```

`string:lexemes/2` で、文字列をドットで区切ります。結果が、四つの部分を持つリストであることを、パターンで確かめます。
四つでなければ、一致しないので、関数は失敗します。

### 2. 各部分を整数に直し、組にする

```erlang:line-numbers=49
    {list_to_integer(Ip1),
     list_to_integer(Ip2),
     list_to_integer(Ip3),
     list_to_integer(Ip4)}.
```

四つの部分を、`list_to_integer/1` で一つずつ整数にします。その四つを、タプルにまとめて返します。

## ここがすごい

### 形が合わないことを、パターンマッチで弾く

「四つの部分がある」という条件を、変数の並びそのものに書いています。
三つや五つに分かれた文字列は、この式に一致しないので、わざわざ長さを数える必要がありません。

### 整数への変換を、そのまま並べる

四つの変換が、同じ形で横に並んでいます。
読み手は、一つを読めば、残りも同じだと分かります。区切りの数字が正しく整数になることを、この並びがそのまま表しています。

### 不正な数字は、例外で失敗する

`list_to_integer/1` は、数字でない文字が入ると、例外を投げます。
この関数は、その失敗を捕まえません。不正なアドレスは、呼び出し元に例外として伝わります。

### 文字列の形を、型の変換に一度で渡す

この関数は、区切り、整数への変換、組の作成を、一つの式の中で済ませています。
一つずつ途中の値を名前で持つ必要がないので、読み手は、入力から出力までを、上から下へ追えます。

## まとめ

`erl_reply:ip_string_to_tuple("192.168.0.1")` は、`{192, 168, 0, 1}` を返します。
区切りが三つしかない `"1.2.3"` は、パターンに一致しないので、失敗します。
