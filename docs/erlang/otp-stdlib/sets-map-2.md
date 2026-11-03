---
title: "集合の各要素を変換して、新しい集合を作る"
description: "sets:map/2 は、集合の要素のそれぞれに関数を当て、その結果から新しい集合を作る。変換後に同じ値になった要素は、一つにまとまる。map 版と record 版で作り方が違う。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [893, 900]
function: "sets:map/2"
difficulty: 2
format: 2
tags: ["データ構造", "関数型", "標準ライブラリ"]
---
## ひとことで

`sets:map/2` は、集合の各要素に関数を当てて、変換後の要素から成る新しい集合を作ります。
元の集合は変わりません。

## コード

::: code-group

```erlang:line-numbers=893 [日本語訳]
map(F, #{}=D) when is_function(F, 1) ->
    %% この用途では、内包表記より効率のよい方法を使います
    %% 内包表記より maps:from_keys/2 の方が効率的です
    maps:from_keys([F(K) || K := _ <- D], ?VALUE);
map(F, #set{}=D) when is_function(F, 1) ->
    fold(fun(E, Acc) -> add_element(F(E), Acc) end,
         new([{version, 1}]),
         D).
```

```erlang:line-numbers=893 [原文]
map(F, #{}=D) when is_function(F, 1) ->
    %% For this purpose, it is more efficient to use
    %% maps:from_keys/2 than a map comprehension.
    maps:from_keys([F(K) || K := _ <- D], ?VALUE);
map(F, #set{}=D) when is_function(F, 1) ->
    fold(fun(E, Acc) -> add_element(F(E), Acc) end,
         new([{version, 1}]),
         D).
```

:::

## 前提知識

- **変換（map）**: 要素を一つずつ、別の値に変える操作です。リストの `lists:map/2` と同じ考え方です。
- **集合の重複**: 変換の結果、二つの要素が同じ値になると、集合では一つにまとまります。
- **`maps:from_keys/2`**: キーのリストから、すべて同じ値を持つ map を作る関数です。map 版の集合を作るのに使われます。
- **`add_element/2`**: 集合に要素を一つ加える関数です。record 版で、一つずつ入れるのに使われます。

## 何をしているか

### 1. map 版は、変換した要素をキーにした map を作る

```erlang:line-numbers=896
    maps:from_keys([F(K) || K := _ <- D], ?VALUE);
```

map の形の集合では、`F(K)` で変換した値を、キーとして並べた map を作ります。
内包表記で要素を一つずつ変換し、`maps:from_keys/2` で集合の形に組み立てます。変換後に同じ値が並ぶと、キーが一つにまとまります。

### 2. record 版は、要素を一つずつ入れ直す

```erlang:line-numbers=897
map(F, #set{}=D) when is_function(F, 1) ->
    fold(fun(E, Acc) -> add_element(F(E), Acc) end,
         new([{version, 1}]),
         D).
```

`#set{}` の形の集合では、空の集合を作り、変換後の要素を一つずつ加えていきます。
`fold/3` で、元の集合の要素を順に処理します。初期値は `new([{version, 1}])` で、空の集合です。

## ここがすごい

### 重複は、自然に消える

変換の結果が同じ値になった要素は、集合の性質によって、一つだけ残ります。
呼び出し側が、重複を取り除く処理を書く必要はありません。集合を作ること自体が、その処理になっています。

### 表し方に応じて、組み立てを変える

map 版は、内包表記で一度に作ります。record 版は、要素を一つずつ入れていきます。
どちらも、結果は同じ集合です。表し方の違いは、この関数の中だけで扱われています。

### 元の集合を、変えない

`map/2` は、元の集合を書き換えません。新しい集合を返すので、元の集合は、そのまま他の場所でも使えます。
Erlang の値が変わらないという性質に、この関数は沿っています。

## まとめ

`sets:map(fun(X) -> X div 2 end, sets:from_list([2, 3, 4]))` は、`1` と `2` を含む集合を返します。
`2` と `3` は、どちらも `1` に変換されるので、結果の集合では一つだけになります。
