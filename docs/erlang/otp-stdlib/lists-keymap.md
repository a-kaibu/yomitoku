---
title: "リストの各要素の、指定した位置の値だけを変える"
description: "lists:keymap/3 は、タプルのリストの各要素について、指定した位置の値だけを関数で変換する。タプルの他の部分はそのまま残す。setelement/3 を使い、再帰で 1 要素ずつ処理する。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [1793, 1796]
function: "lists:keymap/3"
difficulty: 1
format: 2
tags: ["データ構造", "イディオム", "標準ライブラリ"]
---
## ひとことで

`lists:keymap/3` は、タプルのリストに対して、タプルの指定した位置（`Index`）の値だけを関数 `Fun` で変換します。
たとえば `[{a, 1}, {b, 2}]` の 2 番目の要素（`Index = 2`）を、2 倍にすると、`[{a, 2}, {b, 4}]` になります。

## コード

```erlang:line-numbers=1793
keymap(Fun, Index, [Tup|Tail]) ->
   [setelement(Index, Tup, Fun(element(Index, Tup)))|keymap(Fun, Index, Tail)];
keymap(Fun, Index, []) when is_integer(Index), Index >= 1, 
                            is_function(Fun, 1) -> [].
```

## 前提知識

- **タプル**: 固定長の値の並びです。`{a, 1}` のように書きます。
- **`element/2`**: タプルの指定した位置の値を取り出します。位置は 1 から数えます。
- **`setelement/3`**: タプルの指定した位置の値を変えた、新しいタプルを作ります。元のタプルは変わりません。
- **ガード `is_integer(Index), Index >= 1`**: 位置が 1 以上の整数であることを確かめます。
- **`[]` の節**: 空のリストに対しては、空のリストを返します。

## 何をしているか

### 1. 先頭のタプルを変換する

```erlang:line-numbers=1793
keymap(Fun, Index, [Tup|Tail]) ->
   [setelement(Index, Tup, Fun(element(Index, Tup)))|keymap(Fun, Index, Tail)];
```

リストの先頭のタプル `Tup` について、`element(Index, Tup)` で値を取り出し、`Fun` で変換します。その値を `setelement/3` で `Tup` に入れ直し、新しいタプルを作ります。そして、残りのリストを同じ方法で処理し、先頭に付けます。

### 2. 空のリストのとき

```erlang:line-numbers=1795
keymap(Fun, Index, []) when is_integer(Index), Index >= 1, 
                            is_function(Fun, 1) -> [].
```

リストが空になったら、空のリストを返します。ガードで、`Index` が 1 以上の整数で、`Fun` が 1 引数の関数であることも確かめます。

## ここがすごい

### タプルの一部だけを書き換える

タプルは変えられないので、一部だけを変えるには、新しいタプルを作る必要があります。`setelement/3` は、その作業を 1 行で行います。
他の要素は、そのまま新しいタプルにコピーされます。読み手は「この位置だけが変わる」と、すぐに分かります。

### 一覧の形を保ったまま、中身だけを変える

結果のリストの長さと順番は、元のリストと同じです。変わるのは、指定した位置の値だけです。
この「形を変えずに、一部だけを直す」という性質が、`keymap` という名前に表れています。

## まとめ

- タプルの一部だけを変えるときは、`setelement/3` で新しいタプルを作ります。
- 一覧の各要素に同じ変換をかけるときは、再帰で 1 要素ずつ処理すると、書き方が素直になります。
- 変換の対象の位置は引数で指定すると、同じ関数を色々な場面で使えます。
