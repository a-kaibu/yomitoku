---
title: "集合から、条件に合う要素だけを残す"
description: "sets:filter/2 は、集合の要素を関数で確かめ、真になったものだけを残した集合を返す。マップの集合では、残すキーを内包表記で集めて from_keys で作り直す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [868, 873]
function: "sets:filter/2"
difficulty: 3
format: 2
tags: ["データ構造", "関数型", "イディオム"]
---
## ひとことで

`sets:filter/2` は、集合の要素のうち、関数 `F` が `true` を返すものだけを残した、新しい集合を返します。
集合がマップで作られているか、レコードで作られているかによって、絞り込みの方法を分けています。

## コード

::: code-group

```erlang:line-numbers=868 [日本語訳]
filter(F, #{}=D) when is_function(F, 1)->
    %% この用途では、次の方が効率的だ
    %% マップの内包表記より maps:from_keys を使う
    maps:from_keys([K || K := _ <- D, F(K)], ?VALUE);
filter(F, #set{}=D) when is_function(F, 1)->
    filter_set(F, D).
```

```erlang:line-numbers=868 [原文]
filter(F, #{}=D) when is_function(F, 1)->
    %% For this purpose, it is more efficient to use
    %% maps:from_keys than a map comprehension.
    maps:from_keys([K || K := _ <- D, F(K)], ?VALUE);
filter(F, #set{}=D) when is_function(F, 1)->
    filter_set(F, D).
```

:::

## 前提知識

- **集合の二つの形**: マップで作られた集合と、`#set{}` のレコードで作られた集合です。
- **内包表記 `[K || K := _ <- D, F(K)]`**: マップのキーを、条件を満たすものだけ集めたリストにします。
- **`maps:from_keys/2`**: キーのリストと値を受け取り、そのキーだけを持つマップを作ります。集合では、値は使わない定数です。
- **`?VALUE`**: 集合の中で、値として入れておく定数です。

## 何をしているか

### 1. マップの集合は、キーを集めて作り直す

```erlang:line-numbers=868
filter(F, #{}=D) when is_function(F, 1)->
    %% For this purpose, it is more efficient to use
    %% maps:from_keys than a map comprehension.
    maps:from_keys([K || K := _ <- D, F(K)], ?VALUE);
```

マップの集合では、各キー `K` について `F(K)` を確かめ、真になったキーのリストを作ります。
そのリストから、`maps:from_keys/2` で、新しい集合を作ります。
コメントにあるように、この用途では、マップの内包表記で作るより、`from_keys` のほうが効率的だからです。

### 2. レコードの集合は、専用の関数に任せる

```erlang:line-numbers=872
filter(F, #set{}=D) when is_function(F, 1)->
    filter_set(F, D).
```

レコードの集合は、`filter_set/2` に任せます。ハッシュ表の構造を知っている関数の仕事です。

## ここがすごい

### 作り方の選び方を、コメントで残す

同じ内容の関数でも、書き方によって効率が違うことがあります。
この関数は、なぜ `from_keys` を使うのかを、コメントで説明しています。読み手は、その理由を知ったうえで、同じ書き方を別の場面でも選べます。

### 集合の形ごとに、処理を分ける

マップとレコードは、中の仕組みが違います。
引数のパターンで、どちらの形かを見分けて、それぞれの仕組みに合った処理を呼びます。呼び出し側は、形の違いを意識せずに使えます。

### 絞り込みは、一度の走査で済む

マップの場合、キーを一度だけ走査し、条件に合うものを集めます。
集めたリストを、そのまま新しい集合の材料にできるので、途中で別の集合を作り直す必要はありません。

## まとめ

`sets:filter(fun(X) -> X > 1 end, sets:from_list([1, 2, 3]))` は、`2` と `3` だけを持つ集合を返します。
条件に合う要素だけが、新しい集合に残ります。
