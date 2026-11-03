---
title: "条件で 2 つに分けるとき、リストを 1 回だけ読む"
description: "lists:partition/2 は、述語が真になる要素と偽になる要素を、1 回の走査で 2 つのリストに分ける。元の順番を保つために、積んだ後で反転している。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2552, 2561]
function: "lists:partition/2"
difficulty: 2
format: 2
tags: ["イテレータ", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`lists:partition/2` は、リストを条件（述語）で 2 つに分けます。条件を満たす要素の一覧と、満たさない要素の一覧の、組を返します。
元のリストを 1 回だけ先頭から読み、要素ごとに振り分けます。振り分けた後の順番も、元のリストと同じになるように整えています。

## コード

```erlang:line-numbers=2552
partition(Pred, L) when is_function(Pred, 1) ->
    partition_1(Pred, L, [], []).

partition_1(Pred, [H | T], As, Bs) ->
    case Pred(H) of
        true -> partition_1(Pred, T, [H | As], Bs);
        false -> partition_1(Pred, T, As, [H | Bs])
    end;
partition_1(_Pred, [], As, Bs) ->
    {reverse(As), reverse(Bs)}.
```

## 前提知識

- **述語（Pred）**: 要素を 1 つ受け取り、`true` か `false` を返す関数です。ここでは `is_function(Pred, 1)` で、引数が 1 つの関数かを確かめています。
- **アキュムレータ（As、Bs）**: 途中の結果を溜めておく引数です。この関数では、2 つのリストを溜めます。
- **`[H | As]`**: 先頭に `H` を付けたリストを作ります。溜めるときは、先頭に積むのが速い方法です。
- **`reverse/1`**: リストを反転します。溜めた結果は逆順になっているので、最後に戻します。
- **再帰の末尾呼び出し**: 関数の最後で自分自身を呼ぶ形です。Erlang では、この形ならスタックを増やさずに繰り返せます。

## 何をしているか

### 1. 要素を 1 つずつ振り分ける

```erlang:line-numbers=2555
partition_1(Pred, [H | T], As, Bs) ->
    case Pred(H) of
        true -> partition_1(Pred, T, [H | As], Bs);
        false -> partition_1(Pred, T, As, [H | Bs])
    end;
```

`partition_1/4` は、リストの先頭 `H` を `Pred(H)` で調べます。`true` なら `As` の先頭に、`false` なら `Bs` の先頭に積みます。そして残りの `T` に対して、同じ処理を繰り返します。

### 2. 空になったら、反転して返す

```erlang:line-numbers=2560
partition_1(_Pred, [], As, Bs) ->
    {reverse(As), reverse(Bs)}.
```

元のリストが空になったら、2 つのアキュムレータを反転して、組にして返します。
積む処理は先頭への追加なので、どちらのリストも元とは逆順になっています。そのため、最後に `reverse/1` で元の順番に戻しています。

## ここがすごい

### 1 回の走査で、2 つの結果を作る

素直に「条件を満たすものを `filter` で取り出し、満たさないものを別の `filter` で取り出す」と、リストを 2 回読むことになります。
この関数は、述語の呼び出しを要素ごとに 1 回にとどめています。述語の計算が重いときほど、この差が効きます。

### 反転を最後に 1 回だけ行う

先頭に積むと、結果は逆順です。そこで、積む途中では反転せず、最後にまとめて反転しています。
要素ごとに末尾へ追加すると、要素数の 2 乗に近い時間がかかります。反転を 1 回ずつにすることで、全体の時間を要素数に比例させています。

## まとめ

- 条件による 2 分割は、1 回の走査で振り分けられます。
- 先頭への積み重ねで溜め、最後に 1 回反転すると、元の順番を保てます。
- 末尾再帰で書くと、リストの長さに関係なく、スタックを増やさずに処理できます。
