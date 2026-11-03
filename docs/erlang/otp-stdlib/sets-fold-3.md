---
title: "集合の要素を、一つずつ畳み込んで一つの値にする"
description: "sets:fold/3 は、集合の要素を、関数で一つずつ受け取りながら、途中の値に足していく。map 版と record 版で、要素の取り出し方を分けて扱う。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [838, 841]
function: "sets:fold/3"
difficulty: 2
format: 2
tags: ["データ構造", "関数型", "標準ライブラリ"]
---
## ひとことで

`sets:fold/3` は、集合の要素を一つずつ関数に渡し、途中の結果を積み上げていきます。
最後の結果を一つの値として返します。

## コード

```erlang:line-numbers=838
fold(F, Acc, #{}=D) when is_function(F, 2)->
    fold_1(F, Acc, maps:iterator(D));
fold(F, Acc, #set{}=D) when is_function(F, 2)->
    fold_set(F, Acc, D).
```

## 前提知識

- **畳み込み（fold）**: リストや集合の要素を順に処理し、途中の結果を次に渡していく操作です。合計や、リストの変換によく使われます。
- **アキュムレータ**: 途中の結果を持ち回る値です。`fold/3` の二つ目の引数 `Acc` が、初期値になります。
- **関数の型 `fun/2`**: 要素と途中の値を受け取る関数です。`is_function(F, 2)` で、その形を確かめます。
- **`fold_set/3`**: record 版の集合を畳み込む補助関数です。

## 何をしているか

### 1. map 版は、イテレータで畳み込む

```erlang:line-numbers=838
fold(F, Acc, #{}=D) when is_function(F, 2)->
    fold_1(F, Acc, maps:iterator(D));
```

集合が map の形なら、`maps:iterator/1` で、キーを順に取り出せる形にしてから、`fold_1/3` に渡します。
関数 `F` は、二引数の関数でなければなりません。

### 2. record 版は、専用の補助関数に任せる

```erlang:line-numbers=840
fold(F, Acc, #set{}=D) when is_function(F, 2)->
    fold_set(F, Acc, D).
```

集合が `#set{}` の形なら、`fold_set/3` に処理を任せます。
この形では、map のイテレータを使わず、自分の形に合わせて要素を取り出します。

## ここがすごい

### 関数の型を、入り口で確かめる

`is_function(F, 2)` のガードで、渡された関数の引数の数を確かめます。
誤った関数を渡したときは、中の処理に入る前に、節が当たらずに止まります。

### 表し方の違いを、節で分ける

map と record の違いは、二つの節に分けられています。
読み手は、どの形を扱うかを、節の見出しで判断できます。畳み込みそのものの考え方は、どちらの節でも同じです。

### 途中の値を、呼び出し側が決める

初期値 `Acc` を、呼び出し側が渡します。
合計なら `0`、リストに積むなら `[]` と、用途に合わせて決められます。この関数は、結果の形に口を出しません。

### 集合の要素の順番に、頼らない

`fold/3` が要素を渡す順番は、集合の表し方によって決まります。
合計や個数のように、順番に依存しない計算なら、結果は同じになります。リストの先頭を求めるような、順番に依存する計算では、要素の順番を前提にしてはいけません。

## まとめ

`sets:fold(fun(X, Acc) -> X + Acc end, 0, sets:from_list([1, 2, 3]))` は、`6` を返します。
初期値の `0` と、関数の組み合わせで、集合の要素の合計が求まります。
