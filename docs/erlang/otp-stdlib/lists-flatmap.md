---
title: "リストの各要素を、リストに変えて一つにつなぐ"
description: "lists:flatmap/2 は、各要素を関数でリストに変え、結果を一本のリストにつなぐ。空と一要素の結果には特別な近道を用意し、リストの ++ を避けている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2424, 2435]
function: "lists:flatmap/2"
difficulty: 2
format: 2
tags: ["関数型", "標準ライブラリ", "最適化"]
---
## ひとことで

`lists:flatmap/2` は、リストの各要素に関数を適用し、返ってきたリストを順番につなげて一本にします。
たとえば、各数を「その数の繰り返し」に変えてつなげる、という使い方ができます。

## コード

::: code-group

```erlang:line-numbers=2424 [日本語訳]
flatmap(F, List) when is_function(F, 1) ->
    flatmap_1(F, List).

flatmap_1(F, [Hd | Tail]) ->
    case F(Hd) of
        %% 空の結果と一要素の結果には、速い近道を使う
        [] -> flatmap_1(F, Tail);
        [Elem] -> [Elem | flatmap_1(F, Tail)];
        List -> List ++ flatmap_1(F, Tail)
    end;
flatmap_1(_F, []) ->
    [].
```

```erlang:line-numbers=2424 [原文]
flatmap(F, List) when is_function(F, 1) ->
    flatmap_1(F, List).

flatmap_1(F, [Hd | Tail]) ->
    case F(Hd) of
        %% The two first clauses are an optimization.
        [] -> flatmap_1(F, Tail);
        [Elem] -> [Elem | flatmap_1(F, Tail)];
        List -> List ++ flatmap_1(F, Tail)
    end;
flatmap_1(_F, []) ->
    [].
```

:::

## 前提知識

- **`flatmap`**: 「map（一つずつ変換する）」と「flatten（平らにする）」を合わせた名前です。
- **`++`**: 二つのリストをつなげる演算子です。左のリストは、先頭から全部コピーされます。
- **`[Elem]`**: 要素が一つだけのリストにマッチします。
- **再帰**: 残りのリストに対して、同じ関数をもう一度呼びます。

## 何をしているか

### 1. 入口で関数を確かめて、補助関数に渡す

```erlang:line-numbers=2424
flatmap(F, List) when is_function(F, 1) ->
    flatmap_1(F, List).
```

`flatmap/2` は、`F` が引数を一つ取る関数であることを確かめてから、補助関数に仕事を渡します。

### 2. 結果の形で、三通りに分ける

```erlang:line-numbers=2427
flatmap_1(F, [Hd | Tail]) ->
    case F(Hd) of
        %% The two first clauses are an optimization.
        [] -> flatmap_1(F, Tail);
        [Elem] -> [Elem | flatmap_1(F, Tail)];
        List -> List ++ flatmap_1(F, Tail)
    end;
```

先頭の要素 `Hd` に `F` を当てはめ、結果の形で分岐します。
- 結果が空のリスト `[]` なら、この要素は何も出さず、残りに進みます。
- 結果が一要素のリスト `[Elem]` なら、`Elem` を先頭に付けて、残りの結果をつなげます。
- それ以外のリストなら、`++` で、結果と残りの結果をつなげます。

### 3. 空のリストで終わる

```erlang:line-numbers=2434
flatmap_1(_F, []) ->
    [].
```

元のリストが空になったら、空のリストを返して終わります。

## ここがすごい

### 一要素の結果は、`++` を使わない

結果が一要素のときは、`Elem` を前に付けるだけで済みます。`++` は左のリストを全部コピーするので、要素が一つなら、その手間を省けます。
空の結果も、`++` を使わずに、次の要素へ進みます。この二つの近道は、よく起きる小さな場合を速くするために、わざわざ書かれています。

### 一般の場合だけ、`++` を使う

結果が二要素以上のときは、`++` で正しくつなげます。
近道と一般の場合を、節の並びで分けているので、読み手は、どの場合に何が起きるかを、上から順に読めます。

### 結果を一本のリストにする

`map` を使って、リストのリストを作ってから `append` で平らにする方法もあります。
この関数は、変換と平らにする作業を、一度の走査で行います。途中の中間リストを作らずに済みます。

## まとめ

`lists:flatmap(fun(X) -> lists:duplicate(X, X) end, [1, 2, 3])` は、`[1, 2, 2, 3, 3, 3]` を返します。
各数を、その数だけ繰り返したリストに変え、それを一本につなげた結果です。
