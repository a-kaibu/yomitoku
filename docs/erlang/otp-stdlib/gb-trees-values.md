---
title: "平衡木の値を、キーの小さい順に一つのリストにまとめる"
description: "gb_trees:values/1 は、木の値をキーの昇順で並べたリストを返す。右の枝から先に積んで、結果を左から並べる、累積引数による中順の走査。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_trees.erl
lines: [927, 932]
function: "gb_trees:values/1"
difficulty: 3
format: 2
tags: ["データ構造", "アルゴリズム", "再帰"]
---
## ひとことで

`gb_trees:values/1` は、木に入っている値を、キーの小さい順に並べたリストにして返します。
二分探索木の中順（左、節、右）の順で訪れるので、結果のリストは、キーの昇順になります。

## コード

```erlang:line-numbers=927
values({_, T}) ->
    values(T, []).

values({_Key, Value, Small, Big}, L) ->
    values(Small, [Value | values(Big, L)]);
values(nil, L) -> L.
```

## 前提知識

- **中順の走査**: 左の枝、自分の節、右の枝の順で訪れる走査です。二分探索木では、この順で訪れると、キーの昇順になります。
- **累積引数 `L`**: 結果を作るリストを、引数で持ち回ります。ここでは、後ろから先に積んでいきます。
- **`values/1` と `values/2`**: 入口は木全体を受け取り、作業用の `values/2` は、積み上げ中のリストを引数に持ちます。
- **`nil`**: 枝が空であることを表します。

## 何をしているか

### 1. 入口で、根の節から始める

```erlang:line-numbers=927
values({_, T}) ->
    values(T, []).
```

`values/1` は、木全体から根の節を取り出し、空のリスト `[]` を積み上げの出発点にして、`values/2` を呼びます。

### 2. 節の値を、右の結果の前に付けてから、左を進める

```erlang:line-numbers=930
values({_Key, Value, Small, Big}, L) ->
    values(Small, [Value | values(Big, L)]);
```

`values/2` は、節に来たら、まず右の枝 `Big` を、積み上げ中のリスト `L` に対して処理します。
その結果の先頭に、この節の値 `Value` を付けます。さらに、左の枝 `Small` を、その結果の前に付けて処理します。
この順番で、右の値、自分の値、左の値が、リストの先頭から見て左から並びます。

### 3. 空の枝に当たったら、積んだリストを返す

```erlang:line-numbers=932
values(nil, L) -> L.
```

`nil` の枝に当たったら、何も足さず、積んだ `L` を返します。

## ここがすごい

### 右から積むと、左から並ぶ

リストは、先頭に付けるのが速い作りです。
この関数は、右の値を先に、左の値を後に付けていくので、結果は小さいキーから順に並びます。木の中順と、リストの先頭への積み方が、ちょうど逆向きに噛み合っています。

### 結果を作りながら、木を進む

木の全部の値を、途中の一覧にしてから、リストを組み直す必要はありません。
積み上げ中の `L` を持ち回ることで、一度の走査で、正しい順番のリストが出来上がります。

### 空の枝を、一つの節で扱う

`values(nil, L) -> L.` の一行が、木の末端を表します。
すべての枝は、最後にはこの節に当たるので、再帰の終わりが明確です。

## まとめ

`gb_trees:values(gb_trees:from_orddict([{1, a}, {2, b}, {3, c}]))` は、`[a, b, c]` を返します。
キーの順に、値が並ぶことに注目してください。
