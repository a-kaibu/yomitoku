---
title: "リストを先頭から順に畳み込み、途中の結果を持ち回る"
description: "lists:foldl/3 は、先頭から順に要素と途中の結果を関数に渡し、新しい結果を次へ運ぶ。最後の累積値を返す。末尾再帰で、要素が多くても積み重ならない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2463, 2472]
function: "lists:foldl/3"
difficulty: 2
format: 2
tags: ["関数型", "標準ライブラリ", "イディオム"]
---
## ひとことで

`lists:foldl/3` は、リストを先頭から順に一つずつ処理し、途中の結果を次の要素に引き継ぎながら、最後の結果を返します。
合計、最大値、文字の数え上げなど、「一つずつ積み上げる」処理の多くを、この一つの関数で書けます。

## コード

```erlang:line-numbers=2463
foldl(F, Accu, List) when is_function(F, 2) ->
    case List of
        [Hd | Tail] -> foldl_1(F, F(Hd, Accu), Tail);
        [] -> Accu
    end.

foldl_1(F, Accu, [Hd | Tail]) ->
    foldl_1(F, F(Hd, Accu), Tail);
foldl_1(_F, Accu, []) ->
    Accu.
```

## 前提知識

- **畳み込み（fold）**: リストを一つの値にまとめる操作です。ここでは、途中の結果と次の要素から、新しい結果を作ります。
- **`F(Elem, Acc)`**: 関数 `F` は、要素 `Elem` と、ここまでの結果 `Acc` を受け取り、新しい結果を返します。引数の順番は、要素が先、結果が後です。
- **アキュムレータ（`Accu`）**: 途中の結果を持ち回る引数です。
- **末尾再帰**: 関数の最後で自分を呼ぶ再帰です。Erlang では、この形は呼び出しの積み重ねを作りません。

## 何をしているか

### 1. 入口で、最初の要素を処理する

```erlang:line-numbers=2464
    case List of
        [Hd | Tail] -> foldl_1(F, F(Hd, Accu), Tail);
        [] -> Accu
    end.
```

`foldl/3` は、関数 `F` が引数を二つ取ることを確かめます。リストが空でなければ、先頭の要素と初期値 `Accu` を `F` に渡して、最初の結果を作ります。残りのリストは `foldl_1/3` に任せます。
空のリストなら、初期値 `Accu` をそのまま返します。

### 2. 残りの要素を、結果を持ち回りながら処理する

```erlang:line-numbers=2469
foldl_1(F, Accu, [Hd | Tail]) ->
    foldl_1(F, F(Hd, Accu), Tail);
```

`foldl_1/3` は、先頭の要素 `Hd` を、今の結果 `Accu` と一緒に `F` に渡します。出来た新しい結果を、残りの処理に持ち回ります。
この呼び出しは、関数の最後にあるので、末尾再帰です。

### 3. 要素が尽きたら、結果を返す

```erlang:line-numbers=2471
foldl_1(_F, Accu, []) ->
    Accu.
```

残りが空になったら、持ち回ってきた `Accu` を答えとして返します。

## ここがすごい

### 関数を引数で受け取る

畳み込みの中身を、関数 `F` として外から渡します。
合計を求めたいなら加算、最大値を求めたいなら比較を渡せます。`foldl/3` 自身は、リストを進めることだけに責任を持っています。

### 結果を持ち回る引数

途中の結果は、関数の中の変数ではなく、引数 `Accu` として運ばれます。
そのため、結果を外に保存する仕組みが要りません。末尾再帰と組み合わせると、リストが長くても、呼び出しが積み上がりません。

### 初期値が、空のリストの答えになる

空のリストに対しては、初期値 `Accu` が、そのまま答えになります。
合計なら `0`、リストを作るなら `[]` を初期値に選びます。空の場合の答えを、呼び出し側が決められます。

## まとめ

`lists:foldl(fun(X, Acc) -> X + Acc end, 0, [1, 2, 3])` は、`6` を返します。
初期値 `0` が、最初の結果になり、要素を一つずつ加えていきます。
