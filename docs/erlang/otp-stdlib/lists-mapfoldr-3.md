---
title: "リストを後ろから変換し、途中の結果も持ち回る"
description: "lists:mapfoldr/3 は、リストを後ろから順に処理し、変換した値の新しいリストと最終的な結果を組にして返す。mapfoldl と同じ形で、処理の向きだけが逆。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2707, 2714]
function: "lists:mapfoldr/3"
difficulty: 3
format: 2
tags: ["関数型", "標準ライブラリ", "イディオム"]
---
## ひとことで

`lists:mapfoldr/3` は、`map` と `foldr` を組み合わせた関数です。
リストを後ろから順に処理し、関数 `F` が返す変換値と、次の途中の結果を受け取ります。最後に、変換したリストと、最終的な結果の組を返します。

## コード

```erlang:line-numbers=2707
mapfoldr(F, Accu, List) when is_function(F, 2) ->
    mapfoldr_1(F, reverse(List), [], Accu).

mapfoldr_1(F, [Hd | Tail], MapAcc, FoldAcc0) ->
    {M, FoldAcc1} = F(Hd, FoldAcc0),
    mapfoldr_1(F, Tail, [M | MapAcc], FoldAcc1);
mapfoldr_1(_F, [], MapAcc, FoldAcc) ->
    {MapAcc, FoldAcc}.
```

## 前提知識

- **`mapfoldl/3`**: 同じ形を、前から順に行う関数です。この関数は、その後ろから版です。
- **`reverse/1`**: リストを逆順にします。ここでは、後ろから処理するために使います。
- **`{M, FoldAcc1} = F(Hd, FoldAcc0)`**: 関数 `F` は、変換値 `M` と、次の途中の結果の組を返します。
- **`MapAcc`**: 変換した値を積む引数です。

## 何をしているか

### 1. 入口で、リストを反転してから処理する

```erlang:line-numbers=2707
mapfoldr(F, Accu, List) when is_function(F, 2) ->
    mapfoldr_1(F, reverse(List), [], Accu).
```

`mapfoldr/3` は、`F` が二引数の関数であることを確かめ、`List` を `reverse/1` で逆順にします。
逆順にしたリストを先頭から処理すると、元のリストの後ろから処理したことになります。

### 2. 要素を変換し、途中の結果を次へ渡す

```erlang:line-numbers=2710
mapfoldr_1(F, [Hd | Tail], MapAcc, FoldAcc0) ->
    {M, FoldAcc1} = F(Hd, FoldAcc0),
    mapfoldr_1(F, Tail, [M | MapAcc], FoldAcc1);
```

先頭の要素 `Hd` を、途中の結果 `FoldAcc0` と一緒に `F` に渡します。
戻りの組から、変換値 `M` を `MapAcc` の先頭に積み、新しい途中の結果 `FoldAcc1` を次に渡します。

### 3. 空になったら、積んだ値と結果を組で返す

```erlang:line-numbers=2713
mapfoldr_1(_F, [], MapAcc, FoldAcc) ->
    {MapAcc, FoldAcc}.
```

逆順のリストが空になったら、`MapAcc` を返します。
`mapfoldl` と違い、ここでは逆にしません。後ろから積んだ順番が、元のリストの順番と一致しているからです。

## ここがすごい

### 反転で、後ろからの処理を前からの処理に変える

後ろから処理するには、関数をもう一つ書くのではなく、リストを反転してから、前からの処理と同じ形を使います。
これで、`mapfoldl` と同じ補助関数の形を、そのまま使い回せます。

### 積む順番が、そのまま元に戻る

逆順のリストを後ろから積むと、結果は元の順番に並びます。
そのため、最後の `reverse` は要りません。`mapfoldl` は、前から積んだ結果を戻す必要があったのと、対になる書き方です。

### 途中の結果は、後ろから前へ流れる

`FoldAcc` は、後ろの要素から前の要素へと、受け渡されます。
順番が逆になるだけで、「変換値と状態を組で返す」という約束は、`mapfoldl` と同じです。

## まとめ

`lists:mapfoldr(fun(X, Acc) -> {X * 2, Acc + X} end, 0, [1, 2, 3])` は、`{[2, 4, 6], 6}` を返します。
後ろから処理しても、変換した値のリストは元の順番のまま並びます。
