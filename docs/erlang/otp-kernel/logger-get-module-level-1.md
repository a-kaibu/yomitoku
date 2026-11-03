---
title: "モジュールごとのログの水準を、指定したモジュールだけに絞って返す"
description: "logger:get_module_level/1 は、モジュールとログの水準の組の一覧から、指定したモジュールの組だけを取り出す。一つのモジュール名でも、名前の一覧でも受け付ける。"
language: erlang
project: "Erlang/OTP kernel"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2017-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/kernel/src/logger.erl
lines: [1268, 1272]
function: "logger:get_module_level/1"
difficulty: 2
format: 2
tags: ["並行処理", "データ構造", "イディオム"]
---
## ひとことで

`logger:get_module_level/1` は、モジュールごとに設定されたログの水準から、指定したモジュールの分だけを返します。
引数は、一つのモジュール名（アトム）でも、モジュール名のリストでも構いません。

## コード

```erlang:line-numbers=1268
get_module_level(Module) when is_atom(Module) ->
    get_module_level([Module]);
get_module_level(Modules) when is_list(Modules) ->
    [{M,L} || {M,L} <- get_module_level(),
              lists:member(M,Modules)].
```

## 前提知識

- **ログの水準（level）**: ログをどこまで出すかを決める値です。モジュールごとに、別々に設定できます。
- **内包表記**: `[式 || 要素 <- 一覧, 条件]` の形で、一覧から条件に合うものを集めます。
- **`get_module_level/0`**: すべてのモジュールの組の一覧を返す関数です。この関数は、その一覧を絞り込みます。
- **`lists:member/2`**: 名前がリストに含まれるかを調べます。

## 何をしているか

### 1. 一つのモジュール名なら、一覧に包んで渡す

```erlang:line-numbers=1268
get_module_level(Module) when is_atom(Module) ->
    get_module_level([Module]);
```

引数が一つのアトム `Module` なら、それを要素一つのリストに包んで、リストの場合の関数に渡します。

### 2. 名前の一覧を使って、組を絞り込む

```erlang:line-numbers=1270
get_module_level(Modules) when is_list(Modules) ->
    [{M,L} || {M,L} <- get_module_level(),
              lists:member(M,Modules)].
```

すべてのモジュールの組 `{M, L}` を一つずつ見て、モジュール名 `M` が `Modules` に含まれるものだけを残します。
内包表記が、その絞り込みを一行で表しています。

## ここがすごい

### 一つの名前も、一覧も同じ道で扱う

一つのモジュールの場合は、一覧に包んで、同じ処理を使います。
二通りの呼び方を、一つの道にまとめているので、処理の本体は一箇所だけです。

### 組を、そのまま絞る

内包表記の生成部分で `{M,L}` と書くと、組の形に合うものだけが取り出されます。
名前と水準をばらさず、組のまま残せるので、結果も同じ形の一覧になります。

### 既にある一覧を、再利用する

モジュールごとの水準を、新しく調べ直してはいません。
すでにある `get_module_level/0` の結果を、絞り込むだけです。作業の重さは、一覧の長さにほぼ比例します。

### 一覧の中の、順番と重複

絞り込みは、もとの一覧の順番を保ちます。モジュール名が一覧に二度書かれていても、組は一度ずつ残ります。
結果の並びは、ログ設定の一覧が持っている順番と同じです。並べ替えは、この関数では行いません。

## まとめ

`logger:get_module_level(my_mod)` は、`my_mod` の水準の組を一つの一覧で返します。
設定が無いモジュールなら、空の一覧になります。
