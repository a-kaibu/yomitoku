---
title: "リストを後ろから畳み込み、後ろの結果を先頭の要素と組み合わせる"
description: "lists:foldr/3 は、リストの要素を後ろから順に関数へ渡し、後ろの結果を前の要素と組み合わせる。途中の結果を積む形ではなく、再帰の戻りで組み立てる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2499, 2505]
function: "lists:foldr/3"
difficulty: 2
format: 2
tags: ["関数型", "標準ライブラリ", "再帰"]
---
## ひとことで

`lists:foldr/3` は、リストの要素を、後ろから前へ向かって一つの値にまとめます。
関数 `F` は、要素と、後ろ側をまとめた結果を受け取ります。空のリストに対しては、初期値を返します。

## コード

```erlang:line-numbers=2499
foldr(F, Accu, List) when is_function(F, 2) ->
    foldr_1(F, Accu, List).

foldr_1(F, Accu, [Hd | Tail]) ->
    F(Hd, foldr_1(F, Accu, Tail));
foldr_1(_F, Accu, []) ->
    Accu.
```

## 前提知識

- **`foldl` との違い**: `foldl` は先頭から進み、途中の結果を持ち回ります。`foldr` は、末尾側の結果を先に作ってから、先頭へ戻ります。
- **`F(Elem, Acc)`**: 関数 `F` は、先頭の要素 `Hd` と、後ろ側の結果を受け取ります。
- **非末尾の再帰**: `foldr_1/3` の再帰呼び出しは、`F` の引数の中にあります。結果が返るまで、関数の呼び出しが残ります。
- **空のリストの答え**: 初期値 `Accu` を、そのまま答えにします。

## 何をしているか

### 1. 入口で、関数を確かめて補助関数へ渡す

```erlang:line-numbers=2499
foldr(F, Accu, List) when is_function(F, 2) ->
    foldr_1(F, Accu, List).
```

`foldr/3` は、`F` が引数を二つ取ることを確かめてから、`foldr_1/3` に仕事を渡します。

### 2. 先頭の要素と、後ろの結果を組み合わせる

```erlang:line-numbers=2502
foldr_1(F, Accu, [Hd | Tail]) ->
    F(Hd, foldr_1(F, Accu, Tail));
```

先頭の要素 `Hd` と、残り `Tail` を後ろから畳み込んだ結果を、`F` に渡します。
残りの結果は、`foldr_1/3` の再帰で先に計算されます。その値を受けて、`Hd` と組み合わせます。

### 3. 空のリストは、初期値を返す

```erlang:line-numbers=2504
foldr_1(_F, Accu, []) ->
    Accu.
```

リストが空になったら、初期値 `Accu` を返します。ここから、再帰の戻りが始まります。

## ここがすごい

### 後ろの結果が、先頭の計算に使われる

`foldl` は、結果を次の要素へ運びます。`foldr` は逆で、後ろの結果を、前の要素の処理に渡します。
たとえば、要素を `Hd` と `Acc` から新しいリストにすると、元のリストと同じ順番で、結果が並びます。

### 再帰の戻りで組み立てる

`foldr_1/3` は、後ろの結果が出るまで待ち、戻ってきた値に `F` を適用します。
この形は末尾再帰ではないので、要素が多いと、呼び出しの数が増えます。逆に、後ろの結果を使う処理は、この形で自然に書けます。

### 結合の向きを決める

`F` の引数の順番は、`F(Elem, Acc)` です。
要素が先、後ろの結果が後です。`foldr` で、リストを右側から組むときの書き方を、この一行が決めています。

## まとめ

`lists:foldr(fun(X, Acc) -> [X * 2 | Acc] end, [], [1, 2, 3])` は、`[2, 4, 6]` を返します。
後ろから、要素を倍にして、結果のリストの先頭に積んでいきます。
