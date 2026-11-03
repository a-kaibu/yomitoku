---
title: "同期呼び出しの入り口で、よくある場合だけ近道を通す"
description: "gen:call/3 は、サーバーへの同期呼び出しの入り口。既定のタイムアウトを補い、プロセス ID への呼び出しなど、よくある場合は余分な分岐を通らずに do_call へ直接渡す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gen.erl
lines: [217, 227]
function: "gen:call/3"
difficulty: 2
format: 2
tags: ["並行処理", "最適化", "API設計"]
---
## ひとことで

`gen:call/3` は、`gen_server` などのサーバーへ要求を送って、答えを待つ同期呼び出しの入り口です。利用者は、相手、ラベル、要求の 3 つを渡します。
この関数は、タイムアウトの既定値を補って `call/4` へ渡します。さらに `call/4` では、相手がプロセス ID で、タイムアウトが妥当なときに近道を通します。

## コード

::: code-group

```erlang:line-numbers=217 [日本語訳]
call(Process, Label, Request) -> 
    call(Process, Label, Request, ?default_timeout).

%% よくある場合を速くする
call(Process, Label, Request, Timeout) when is_pid(Process),
  Timeout =:= infinity orelse is_integer(Timeout) andalso Timeout >= 0 ->
    do_call(Process, Label, Request, Timeout);
call(Process, Label, Request, Timeout)
  when Timeout =:= infinity; is_integer(Timeout), Timeout >= 0 ->
    Fun = fun(Pid) -> do_call(Pid, Label, Request, Timeout) end,
    do_for_proc(Process, Fun).
```

```erlang:line-numbers=217 [原文]
call(Process, Label, Request) -> 
    call(Process, Label, Request, ?default_timeout).

%% Optimize a common case.
call(Process, Label, Request, Timeout) when is_pid(Process),
  Timeout =:= infinity orelse is_integer(Timeout) andalso Timeout >= 0 ->
    do_call(Process, Label, Request, Timeout);
call(Process, Label, Request, Timeout)
  when Timeout =:= infinity; is_integer(Timeout), Timeout >= 0 ->
    Fun = fun(Pid) -> do_call(Pid, Label, Request, Timeout) end,
    do_for_proc(Process, Fun).
```

:::

## 前提知識

- **同期呼び出し**: 要求を送り、応答が来るまで待つ方式です。
- **`?default_timeout`**: 既定のタイムアウト時間を表すマクロです。指定がないときに使われます。
- **`do_call/4`**: 実際に要求を送って、応答か失敗を待つ関数です。前の記事で詳しく見ました。
- **`do_for_proc/2`**: 相手が名前やノード付きの場合に、相手のプロセス ID を求めてから処理を行う関数です。
- **ガードの `orelse` と `andalso`**: 条件を組み合わせる演算子です。`andalso` が `orelse` より強く結びつきます。
- **`is_pid/1`**: 値がプロセス ID かどうかを返します。

## 何をしているか

### 1. 既定のタイムアウトを補う

```erlang:line-numbers=217
call(Process, Label, Request) -> 
    call(Process, Label, Request, ?default_timeout).
```

タイムアウトを省略したときは、`?default_timeout` を入れて、4 引数版の `call/4` に任せます。利用者は、時間を指定しなくても使えます。

### 2. よくある場合の近道

```erlang:line-numbers=220
%% Optimize a common case.
call(Process, Label, Request, Timeout) when is_pid(Process),
  Timeout =:= infinity orelse is_integer(Timeout) andalso Timeout >= 0 ->
    do_call(Process, Label, Request, Timeout);
```

相手がプロセス ID で、タイムアウトが `infinity` または 0 以上の整数のときは、そのまま `do_call/4` を呼びます。コメントにあるとおり、これは最もよく使われる場合です。途中で余計な関数を挟まないのが目的です。

### 3. それ以外の場合

```erlang:line-numbers=224
call(Process, Label, Request, Timeout)
  when Timeout =:= infinity; is_integer(Timeout), Timeout >= 0 ->
    Fun = fun(Pid) -> do_call(Pid, Label, Request, Timeout) end,
    do_for_proc(Process, Fun).
```

名前や、ノード付きの相手などは、まず `do_for_proc/2` で相手のプロセス ID を求めます。そのうえで、`Fun` の中で `do_call/4` を呼びます。タイムアウトが正しくない値のときは、どの節にも合わないので失敗します。

## ここがすごい

### 一般の経路を残したまま、よくある経路を先に書く

相手を探す仕組みは、名前やノードの場合に必要です。しかし、プロセス ID で呼ぶ場合には、探す手順は要りません。
この関数は、よくある場合を先頭の節に置いて、速く進むようにしています。一般の経路は、後ろに残しています。

### 既定値は入り口だけで決める

タイムアウトの既定値は、`call/3` の 1 か所で補います。`call/4` 以降では、値が与えられている前提で書けます。
どこで既定値が入るかが分かると、読み手は迷いません。

## まとめ

- 同期呼び出しの入り口では、省略された値を補い、残りは専用の関数に渡すと、役割が分かれます。
- 最も多い場合を先頭の節にすると、一般の場合を遅くせずに速くできます。
- 既定値を入り口で決めると、後ろの関数は前提を気にせず書けます。
