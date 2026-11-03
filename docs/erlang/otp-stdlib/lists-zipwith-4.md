---
title: "長さの違う二つのリストを、足りない側の扱いを選んで組み合わせる"
description: "lists:zipwith/4 は、二つのリストの要素を組にして関数に渡す。長さが違うときの扱いを How で選ぶ。fail は失敗、trim は短い方に合わせ、pad は足りない側を既定値で埋める。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [965, 980]
function: "lists:zipwith/4"
difficulty: 2
format: 2
tags: ["関数型", "標準ライブラリ", "イディオム"]
---
## ひとことで

`lists:zipwith/4` は、二つのリストの要素を一つずつ組にして、関数 `F` に渡し、その結果を並べたリストを返します。
二つのリストの長さが違うときの扱いを、四つ目の引数 `How` で選べます。

## コード

```erlang:line-numbers=965
zipwith(F, [X | Xs], [Y | Ys], How) ->
    [F(X, Y) | zipwith(F, Xs, Ys, How)];
zipwith(F, [], [], fail) when is_function(F, 2) ->
    [];
zipwith(F, [], [], trim) when is_function(F, 2) ->
    [];
zipwith(F, [], [], {pad, {_, _}}) when is_function(F, 2) ->
    [];
zipwith(F, [_ | _], [], trim) when is_function(F, 2) ->
    [];
zipwith(F, [], [_ | _], trim) when is_function(F, 2) ->
    [];
zipwith(F, [], [_ | _]=Ys, {pad, {X, _}}) ->
    [F(X, Y) || Y <- Ys];
zipwith(F, [_ | _]=Xs, [], {pad, {_, Y}}) ->
    [F(X, Y) || X <- Xs].
```

## 前提知識

- **`zipwith`**: 「zip（組にする）」と「with（関数を適用する）」を合わせた名前です。組にしながら、同時に関数を適用します。
- **`How`**: 長さが違うときの扱いを表す値です。`fail`、`trim`、`{pad, {X, Y}}` の三通りがあります。
- **`fail`**: 長さが違えば、どの節にも当たらず、関数呼び出しが失敗します。
- **`trim`**: 長い方の余りを捨て、短い方に合わせます。
- **`{pad, {X, Y}}`**: 足りない側を、`X` や `Y` で埋めてから関数を適用します。

## 何をしているか

### 1. 両方に要素があるとき

```erlang:line-numbers=965
zipwith(F, [X | Xs], [Y | Ys], How) ->
    [F(X, Y) | zipwith(F, Xs, Ys, How)];
```

両方のリストに先頭の要素があれば、`F(X, Y)` を作り、残りについて再帰します。`How` は、そのまま次の呼び出しに渡します。

### 2. 両方が空になったとき

```erlang:line-numbers=967
zipwith(F, [], [], fail) when is_function(F, 2) ->
    [];
zipwith(F, [], [], trim) when is_function(F, 2) ->
    [];
```

両方が空で、`fail` か `trim` のときは、空のリストを返します。ここが、正常に終わる場所です。

### 3. 片方だけ足りないとき

```erlang:line-numbers=971
zipwith(F, [], [], {pad, {_, _}}) when is_function(F, 2) ->
    [];
zipwith(F, [_ | _], [], trim) when is_function(F, 2) ->
    [];
zipwith(F, [], [_ | _], trim) when is_function(F, 2) ->
    [];
zipwith(F, [], [_ | _]=Ys, {pad, {X, _}}) ->
    [F(X, Y) || Y <- Ys];
zipwith(F, [_ | _]=Xs, [], {pad, {_, Y}}) ->
    [F(X, Y) || X <- Xs].
```

`{pad, {X, Y}}` のときは、足りない側を既定値で埋めます。
- 左のリストが空なら、既定値 `X` を左の値にして、右の残りの各 `Y` について `F(X, Y)` を作ります。
- 右のリストが空なら、既定値 `Y` を右の値にして、左の残りの各 `X` について `F(X, Y)` を作ります。

`trim` のときは、片方が空になった時点で、残りを捨てて空のリストを返します。`fail` のときは、どの節にも当たらず、呼び出しが失敗します。

## ここがすごい

### 長さの扱いを、引数の値で表す

長さが違うときに、どうするかは、呼び出し側の目的によって違います。
この関数は、その違いを `How` という一つの値にまとめています。関数の中では、パターンマッチで `fail`、`trim`、`pad` を見分けるだけで済みます。

### 失敗を、わざと関数の節で起こす

`fail` の場合、長さの違う組み合わせに、どの節も当たりません。
エラーを明示的に投げるのではなく、「該当する節がない」という Erlang の仕組みで、失敗させています。そのため、この関数の中には、エラーを作る文がありません。

### 埋めるときは、内包表記で一度に作る

`pad` の節は、残りのリストを内包表記（`[F(X, Y) || Y <- Ys]`）で一度に作ります。
再帰を重ねず、残りの要素を一気に処理するので、節の形が短くなります。

## まとめ

`lists:zipwith(fun(X, Y) -> X + Y end, [1, 2, 3], [10, 20, 30], fail)` は、`[11, 22, 33]` を返します。
長さが違えば、`fail` の場合は失敗し、`{pad, {0, 0}}` の場合は、足りない側を `0` で埋めて計算します。
