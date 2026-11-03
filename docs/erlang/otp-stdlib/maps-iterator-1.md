---
title: "map を、一つずつ順に読むイテレータにする"
description: "maps:iterator/1 は、map を順に取り出すためのイテレータを作る。キーの順番は決まらず、速く読めるように作られる。順番が必要なら、後で maps:iterator/2 の ordered を使う。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [981, 982]
function: "maps:iterator/1"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`maps:iterator/1` は、map からイテレータを作ります。
イテレータは、`maps:next/1` で一つずつ要素を読むための値です。大きな map を、途中で止めながら読めます。

## コード

```erlang:line-numbers=981
iterator(M) when is_map(M) -> iterator(M, undefined);
iterator(M) -> error_with_info({badmap, M}, [M]).
```

## 前提知識

- **イテレータ**: 集合の中身を、一つずつ読み進めるための値です。読んだ位置を、値の中に持っています。
- **`maps:next/1`**: イテレータから、次のキーと値、残りのイテレータを取り出す関数です。
- **`iterator/2`**: 二つ目の引数で、順番の指定ができる版です。`undefined` と `ordered` の二つがあります。
- **`error_with_info/2`**: map でない値が渡されたときに、例外を投げる補助関数です。

## 何をしているか

### 1. map のときは、既定の順番で作る

```erlang:line-numbers=981
iterator(M) when is_map(M) -> iterator(M, undefined);
```

引数が map なら、二つ目の引数を `undefined` にした `iterator/2` を呼びます。
この指定は、順番を特に決めないという意味です。

### 2. map でなければ、例外にする

```erlang:line-numbers=982
iterator(M) -> error_with_info({badmap, M}, [M]).
```

map でない値が渡されたときは、`badmap` の例外を投げます。
引数の値を、例外の情報として残します。

## ここがすごい

### 順番を決めないことで、速く作る

既定の順番は、キーの並びを整える必要がありません。
イテレータを作るときの手間が少なくなります。順番が要らない集計や探索には、この形で十分です。

### 順番が必要なら、別の指定を使う

キーの昇順で読みたいときは、`iterator/2` に `ordered` を渡します。
その場合は、キーを並べ替えてから読み進めます。並べ替えの手間が増える分、結果の順番は決まります。

### イテレータは、途中で止められる

イテレータは、読んだ位置を値として持つので、途中で処理を止められます。
大きな map を、必要な分だけ読むときに、全体を一度に作る必要がありません。

### 作ったイテレータは、読む側が決める

`iterator/1` は、イテレータを作るだけで、要素を読みません。
読み方は、`maps:next/1` を呼ぶ側が決めます。全部読むか、途中で止めるかは、後の処理に任せられます。

### 読み終わりは、`none` で判断する

イテレータを読み進めると、やがて要素が無くなります。その時点の `maps:next/1` の戻り値で、読み終わりを判断します。
この関数は、読み終わりの判断を呼び出し側に任せています。

## まとめ

`maps:iterator(#{a => 1})` は、キー `a` を読めるイテレータを返します。
`maps:next/1` で読むと、`a` と `1` が取り出せます。
