---
title: "リストを変換しながら、途中の結果も同時に持ち回る"
description: "lists:mapfoldl/3 は、各要素を変換した新しいリストと、畳み込みの最終結果を、一度の走査で同時に返す。変換の結果を、後ろで組み直す一手間を省く。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2669, 2676]
function: "lists:mapfoldl/3"
difficulty: 3
format: 2
tags: ["関数型", "標準ライブラリ", "イディオム"]
---
## ひとことで

`lists:mapfoldl/3` は、`map` と `foldl` を一度に行う関数です。
関数 `F` は、要素と途中の結果を受け取り、変換した値と、次の途中の結果を返します。最後に、変換したリストと、最終的な結果の組を返します。

## コード

```erlang:line-numbers=2669
mapfoldl(F, Accu, List) when is_function(F, 2) ->
    mapfoldl_1(F, List, [], Accu).

mapfoldl_1(F, [Hd | Tail], MapAcc, FoldAcc0) ->
    {M, FoldAcc1} = F(Hd, FoldAcc0),
    mapfoldl_1(F, Tail, [M | MapAcc], FoldAcc1);
mapfoldl_1(_F, [], MapAcc, FoldAcc) ->
    {reverse(MapAcc), FoldAcc}.
```

## 前提知識

- **`map`**: リストの各要素を変換して、同じ長さのリストを作ります。
- **`foldl`**: リストを先頭から進め、途中の結果を持ち回ります。
- **`{M, FoldAcc1} = F(Hd, FoldAcc0)`**: 関数 `F` は、変換した値 `M` と、次の途中の結果 `FoldAcc1` の組を返します。
- **`MapAcc`**: 変換した値を、逆の順番で積んでいく引数です。

## 何をしているか

### 1. 入口で、途中の結果の初期値を渡す

```erlang:line-numbers=2669
mapfoldl(F, Accu, List) when is_function(F, 2) ->
    mapfoldl_1(F, List, [], Accu).
```

`mapfoldl/3` は、関数 `F` が引数を二つ取ることを確かめます。空の変換リスト `[]` と、初期の結果 `Accu` を用意して、補助関数に渡します。

### 2. 要素を変換し、途中の結果を次へ渡す

```erlang:line-numbers=2672
mapfoldl_1(F, [Hd | Tail], MapAcc, FoldAcc0) ->
    {M, FoldAcc1} = F(Hd, FoldAcc0),
    mapfoldl_1(F, Tail, [M | MapAcc], FoldAcc1);
```

先頭の要素 `Hd` を、途中の結果 `FoldAcc0` と一緒に `F` に渡します。
`F` の戻り値の組から、変換した値 `M` と、次の途中の結果 `FoldAcc1` を取り出します。`M` は `MapAcc` の先頭に積み、`FoldAcc1` は次の段階に渡します。

### 3. 要素が尽きたら、二つの結果を組で返す

```erlang:line-numbers=2675
mapfoldl_1(_F, [], MapAcc, FoldAcc) ->
    {reverse(MapAcc), FoldAcc}.
```

残りが空になったら、積んだ変換の結果を `reverse` で元の順番に戻します。それと、最後の途中の結果 `FoldAcc` を組にして返します。

## ここがすごい

### 一度の走査で、二つの仕事を同時に行う

変換したリストを作る作業と、畳み込みで値をまとめる作業を、同じ走査で行います。
別々に `map` と `foldl` を呼ぶと、リストを二回辿ります。この関数は、一回で済みます。

### 途中の結果の受け渡しを、組に任せる

`F` は、変換の値と次の状態を、組で返します。
この組の形が、「変換」と「状態の更新」を、一つの戻り値で表す約束になっています。関数の中では、組を分解して、それぞれを振り分けるだけです。

### 逆順に積んで、最後に戻す

変換した値は、先頭に積んでいくので、そのままでは逆順になります。
最後に一度だけ `reverse` で戻しています。途中で末尾に付け足す手間を省き、一回の反転で正しい順番になります。

## まとめ

`lists:mapfoldl(fun(X, Acc) -> {X * 2, Acc + X} end, 0, [1, 2, 3])` は、`{[2, 4, 6], 6}` を返します。
各要素を二倍にしながら、同時に合計を求めています。
