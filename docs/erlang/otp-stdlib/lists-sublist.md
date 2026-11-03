---
title: "先頭を読み捨ててから、続く指定の個数を取り出す"
description: "lists:sublist/3 は、リストの開始位置から指定の個数だけ要素を取り出す。開始位置の手前は 1 つずつ読み捨て、位置が 1 になったら残りを取り出す 2 引数版に任せる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [668, 673]
function: "lists:sublist/3"
difficulty: 1
format: 2
tags: ["イディオム", "標準ライブラリ"]
---
## ひとことで

`lists:sublist/3` は、リストの途中から、指定した個数の要素を取り出します。`lists:sublist([1,2,3,4], 2, 2)` は `[2, 3]` です。
開始位置 `S` が 1 のときは、先頭から `L` 個を取る 2 引数版（`sublist/2`）を呼びます。2 以上のときは、先頭を 1 つ捨てて、開始位置と個数を読み替えながら再帰します。

## コード

```erlang:line-numbers=668
sublist(List, 1, L) when is_list(List), is_integer(L), L >= 0 ->
    sublist(List, L);
sublist([], S, _L) when is_integer(S), S >= 2 ->
    [];
sublist([_H|T], S, L) when is_integer(S), S >= 2 ->
    sublist(T, S-1, L).
```

## 前提知識

- **開始位置 `S`**: 1 から数えます。`S = 1` は先頭です。
- **個数 `L`**: 取り出す要素の数です。0 以上の整数を指定します。
- **ガード `is_integer(S), S >= 2`**: 開始位置が 2 以上の整数であることを確かめます。
- **`[_H|T]`**: 先頭の要素を捨てて、残りを `T` で受け取るパターンです。`_H` は使わない値を表します。
- **2 引数版の `sublist/2`**: 先頭から `L` 個だけを取り出す関数です。

## 何をしているか

### 1. 開始位置が 1 のとき

```erlang:line-numbers=668
sublist(List, 1, L) when is_list(List), is_integer(L), L >= 0 ->
    sublist(List, L);
```

開始位置が 1 なら、先頭から `L` 個を取ればよいので、2 引数版 `sublist(List, L)` に任せます。

### 2. 空のリストに届いたとき

```erlang:line-numbers=670
sublist([], S, _L) when is_integer(S), S >= 2 ->
    [];
```

開始位置が 2 以上のまま、リストが空になったら、取り出すものはありません。空のリストを返します。

### 3. 先頭を 1 つ読み捨てる

```erlang:line-numbers=672
sublist([_H|T], S, L) when is_integer(S), S >= 2 ->
    sublist(T, S-1, L).
```

開始位置が 2 以上なら、先頭 `H` を捨てます。残りの `T` に対して、開始位置を 1 減らして、同じ関数を呼び出します。
こうして、開始位置が 1 になるまで、先頭から 1 つずつ読み捨てていきます。

## ここがすごい

### 読み捨てと取り出しを、同じ再帰で書く

「開始位置まで進む」と「そこから取り出す」は、別々の処理に見えます。しかし、開始位置を 1 ずつ減らして、先頭を捨てる再帰にすると、1 つの関数で両方を表せます。
開始位置が 1 になった時点で、取り出しの処理（2 引数版）に切り替わります。

### 空に届いた場合の節を、先に書いておく

開始位置がリストの長さより大きいとき、リストは途中で空になります。その場合の節（空のリストに対して `[]` を返す）を用意しているので、範囲外の指定にも安全に答えられます。
入力の範囲外を、例外ではなく空の結果で扱う選択です。

## まとめ

- リストの途中から取り出すには、開始位置まで読み捨てる再帰が、素直な書き方です。
- 2 つの役割（読み捨てと取り出し）を、開始位置の値の変化で切り替えられます。
- 範囲外の指定は、空のリストを返すことで、例外を避けられます。
