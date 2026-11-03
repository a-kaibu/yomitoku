---
title: "配列の要素を、添字の小さい順に畳み込む"
description: "array:foldl/3 は、配列の要素を添字の 0 から順に関数へ渡し、途中の結果を持ち回る。大きさが正しい配列でなければ badarg を投げる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2006-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/array.erl
lines: [1632, 1636]
function: "array:foldl/3"
difficulty: 2
format: 2
tags: ["データ構造", "関数型", "標準ライブラリ"]
---
## ひとことで

`array:foldl/3` は、配列の要素を、添字の小さい順に一つずつ関数へ渡します。
関数は、要素と途中の結果を受け取り、新しい途中の結果を返します。最後の途中の結果が、答えになります。

## コード

::: code-group

```erlang:line-numbers=1632 [日本語訳]
foldl(Function, Acc, #array{size = N}=Array) when is_integer(N) ->
    %% 型検査ツールに、この部分の警告を無視させる注釈
    foldl(0, N-1, Function, Acc, Array);
foldl(_, _, _) ->
    erlang:error(badarg).
```

```erlang:line-numbers=1632 [原文]
foldl(Function, Acc, #array{size = N}=Array) when is_integer(N) ->
    %% eqwalizer:ignore ambiguous_union
    foldl(0, N-1, Function, Acc, Array);
foldl(_, _, _) ->
    erlang:error(badarg).
```

:::

## 前提知識

- **配列（array）**: 添字で要素を取り出せる、大きさの決まったデータ構造です。添字は `0` から始まります。
- **`F(Index, Value, Acc)`**: 関数 `F` に渡されるのは、添字 `I`、要素、途中の結果です。この記事のソースでは、添字と要素の組み合わせを、関数の引数として扱っています。
- **`#array{size = N}`**: 配列の中の大きさを取り出すレコードの形です。
- **`foldl/5`**: 添字を指定して畳み込みを行う補助関数です。最初の添字 `0` と、最後の添字 `N-1` を渡します。

## 何をしているか

### 1. 大きさを確かめて、補助関数に渡す

```erlang:line-numbers=1632
foldl(Function, Acc, #array{size = N}=Array) when is_integer(N) ->
    %% eqwalizer:ignore ambiguous_union
    foldl(0, N-1, Function, Acc, Array);
```

配列の大きさ `N` が整数であれば、添字 `0` から `N-1` までを、補助関数 `foldl/5` で畳み込みます。
途中の行には、型検査ツールへの注釈があります。動作には関係しません。

### 2. 配列でなければ、badarg

```erlang:line-numbers=1635
foldl(_, _, _) ->
    erlang:error(badarg).
```

大きさを持たない値が渡されたら、`badarg` のエラーを投げます。

## ここがすごい

### 添字の範囲を、最初に決める

畳み込みの範囲は、`0` から `N-1` と、最初に決まっています。
補助関数は、その範囲を先頭から順に進むだけです。範囲の計算を、入口の一箇所に集めています。

### 大きさの確かめを、節の形で行う

`#array{size = N}` のパターンで、配列の形と大きさを同時に取り出しています。
形が違えば、二つ目の節に当たり、`badarg` で知らされます。読み手は、節の頭を読むだけで、受け付ける入力の形が分かります。

### 添字の順番を保つ

添字の小さい順に進むので、畳み込みの結果は、配列の並びに沿った順番で積まれます。
配列の並びを前提にした集計が、そのまま書けます。

### 途中の結果を、どの型にもできる

途中の結果は、数でも、リストでも、組でも構いません。関数の戻り値と、初期値の型さえそろえれば、どんな集計にも使えます。
この関数は、その自由さを、畳み込みの一般的な形で受け継いでいます。

## まとめ

`array:foldl(fun(_I, V, Acc) -> V + Acc end, 0, array:from_list([1, 2, 3]))` は、`6` を返します。
添字を使わず、要素の合計だけを求めています。
