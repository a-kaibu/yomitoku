---
title: "map のキーを、並べ替えてから読むイテレータにする"
description: "maps:iterator/2 は、map を順に読むイテレータを、順番の指定つきで作る。ordered を指定すると、キーを Erlang の項の順序で並べ替えてから読む。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [1060, 1061]
function: "maps:iterator/2"
difficulty: 3
format: 2
tags: ["データ構造", "標準ライブラリ", "ソート"]
---
## ひとことで

`maps:iterator/2` は、map から、順番を指定したイテレータを作ります。
`undefined` を指定すると、順番を決めずに作ります。`ordered` を指定すると、キーを並べ替えてから読めるようにします。

## コード

```erlang:line-numbers=1060
iterator(M, undefined) when is_map(M) ->
    [0 | M];
```

## 前提知識

- **イテレータ**: map を一つずつ読むための値です。`maps:next/1` で、次の要素を取り出します。
- **項の順序**: Erlang では、数、アトム、タプルなどを、一つの順序で比べられます。`<` や `lists:sort/1` が、その順序を使います。
- **`erts_internal:cmp_term/2`**: 二つの項を、Erlang の順序で比べる内部の関数です。
- **`lists:sort/2`**: 比較の関数を渡して並べ替える関数です。ここでは、`cmp_term` の結果を使います。

## 何をしているか

### 1. 順番を決めないときは、map の形をそのまま使う

```erlang:line-numbers=1060
iterator(M, undefined) when is_map(M) ->
    [0 | M];
```

`undefined` を指定すると、イテレータは `[0 | M]` の形になります。
順番を決めないので、map の中身をそのまま持って、読み進めます。

### 2. ordered のときは、キーを並べ替える

```erlang:line-numbers=1062
iterator(M, ordered) when is_map(M) ->
    CmpFun = fun(A, B) -> erts_internal:cmp_term(A, B) =< 0 end,
    Keys = lists:sort(CmpFun, maps:keys(M)),
```

`ordered` を指定すると、比較の関数 `CmpFun` を作り、キーを `lists:sort/2` で並べ替えます。
比較には、`erts_internal:cmp_term/2` を使い、Erlang の項の順序に従います。

## ここがすごい

### 順番を、引数で選べる

イテレータの速さと、順番の確かさは、どちらかを選ぶ関係にあります。
この関数は、順番が要らないときは何もせず、要るときだけ並べ替えるので、二つの要求を一つの関数で両立させています。

### 比較を、Erlang の順序に任せる

キーの比較に、独自の規則は使いません。
`cmp_term` は、Erlang のすべての値に共通の順序を使います。数もアトムもタプルも、同じ規則で並ぶので、順番の説明が一つで済みます。

### 並べ替えの結果を、そのまま読む

並べ替えたキーの列を使って、イテレータを作ります。
`maps:next/1` は、昇順に一つずつ要素を返します。呼び出し側は、順番の仕組みを知らなくても、そのまま読めます。

## まとめ

`maps:iterator(#{b => 2, a => 1}, ordered)` は、キーの順に読むイテレータを返します。
`maps:next/1` で読むと、`a` が先に、`b` が後に出てきます。
