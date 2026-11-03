---
title: "並べるのと同時に重複を消す、usort の内部の分岐"
description: "lists:usort/2 の内部 usort_1/3 は、比べた結果が等しい要素を 1 つにまとめながら並べる。Fun(X, Y) と Fun(Y, X) の両方を確かめて、順序がどちらか一方に決まるかを見分ける。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [1979, 1995]
function: "lists:usort_1/3"
difficulty: 3
format: 2
tags: ["ソート", "アルゴリズム"]
---
## ひとことで

`lists:usort_1/3` は、`lists:usort/2` の内部で使われる関数です。与えられた比較関数 `Fun` に従って、リストを並べます。同時に、比べて等しい要素は 1 つだけ残します。
先頭の要素 `X` と次の要素 `Y` を、`Fun` で比べたあとに、逆向きにも比べて、等しいかどうかを判断します。

## コード

::: code-group

```erlang:line-numbers=1979 [日本語訳]
usort_1(Fun, X, [Y | L]) ->
    case Fun(X, Y) of
        true ->
            case Fun(Y, X) of
                true -> % X と Y が等しいとき
                    case L of
                        [] ->
                            [X];
                        _ ->
                            usort_1(Fun, X, L)
                    end;
                false ->
                    ufsplit_1(Y, X, Fun, L, [], [])
            end;
        false  ->
	    ufsplit_2(Y, L, Fun, [X])
    end.
```

```erlang:line-numbers=1979 [原文]
usort_1(Fun, X, [Y | L]) ->
    case Fun(X, Y) of
        true ->
            case Fun(Y, X) of
                true -> % X equal to Y
                    case L of
                        [] ->
                            [X];
                        _ ->
                            usort_1(Fun, X, L)
                    end;
                false ->
                    ufsplit_1(Y, X, Fun, L, [], [])
            end;
        false  ->
	    ufsplit_2(Y, L, Fun, [X])
    end.
```

:::

## 前提知識

- **`usort/2`**: 比較関数を指定して、リストを並べ、重複を取り除く関数です。比較関数 `Fun(A, B)` が `true` なら、`A` を `B` より前に置けることを表します。
- **比較関数の性質**: `Fun(X, Y)` が真で `Fun(Y, X)` も真なら、`X` と `Y` は等しい順序です。`Fun(X, Y)` が真で `Fun(Y, X)` が偽なら、`X` が前です。
- **ネストした `case`**: 結果を、さらに別の `case` で調べる書き方です。
- **`[X]` と `usort_1/3` の再帰**: 残りのリストを、同じ関数で処理します。
- **`ufsplit_1`、`ufsplit_2`**: 小さい方と大きい方に振り分ける補助関数です。ここでは、詳しい中身には立ち入りません。

## 何をしているか

### 1. X が Y より前のとき

```erlang:line-numbers=1980
    case Fun(X, Y) of
        true ->
```

`Fun(X, Y)` が真なら、`X` を前に置いてよいことになります。そこで、逆向きの `Fun(Y, X)` も確かめます。

### 2. X と Y が等しいとき

```erlang:line-numbers=1982
            case Fun(Y, X) of
                true -> % X equal to Y
                    case L of
                        [] ->
                            [X];
                        _ ->
                            usort_1(Fun, X, L)
                    end;
```

`Fun(Y, X)` も真なら、順序の上で `X` と `Y` は等しいことになります。このとき、`X` だけを残し、`Y` は捨てます。残りが空なら `[X]` を返します。まだ残りがあれば、`X` を先頭に保ったまま、残りを再帰で処理します。

### 3. X より Y が前のとき

```erlang:line-numbers=1990
                false ->
                    ufsplit_1(Y, X, Fun, L, [], [])
```

`Fun(Y, X)` が偽なら、`Y` が前にあるべきです。`ufsplit_1/6` で、残りを振り分けながら並べ直します。

### 4. Y を先頭にするとき

```erlang:line-numbers=1993
        false  ->
	    ufsplit_2(Y, L, Fun, [X])
```

`Fun(X, Y)` が偽のときは、`Y` の方を前に置きます。`ufsplit_2/4` で、`X` を結果の後ろに回します。

## ここがすごい

### 比較を 2 回行うことで、等しさを見分ける

比較関数は、「前か、後ろか」しか教えてくれません。等しい場合を見分けるには、逆向きにも比べる必要があります。
この関数は、2 回の比較の結果を組み合わせて、等しい要素を 1 つにまとめます。

### 重複の処理が、並べる処理の中に入っている

重複を消すために、並べた後で別の走査をしなくてよいように書かれています。並べるときに見つけた等しい要素を、その場で捨てます。
1 回の再帰で、順番と重複の両方を処理しているのが特徴です。

## まとめ

- 比較関数を使うときは、逆向きも確かめると、等しい順序を見分けられます。
- 並べる処理の中で重複を捨てると、後の走査が要らなくなります。
- 結果の形が違うときは、ネストした `case` で、順番に確かめると読みやすくなります。
