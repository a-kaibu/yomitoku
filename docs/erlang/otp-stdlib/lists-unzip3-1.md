---
title: "三つ組のリストを、三本の列に分ける"
description: "lists:unzip3/1 は、{X, Y, Z} の三つ組のリストを、X だけ、Y だけ、Z だけの三つのリストに分ける。unzip/1 を三要素に広げた形で、逆順に積んで最後に戻す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [915, 920]
function: "lists:unzip3/1"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`lists:unzip3/1` は、三つ組 `{X, Y, Z}` が並んだリストを、三つの列に分けて、`{Xs, Ys, Zs}` の組として返します。
`lists:unzip/1` の、三要素版です。`lists:zip3/3` の逆の操作にあたります。

## コード

```erlang:line-numbers=915
unzip3(Ts) -> unzip3(Ts, [], [], []).

unzip3([{X, Y, Z} | Ts], Xs, Ys, Zs) ->
    unzip3(Ts, [X | Xs], [Y | Ys], [Z | Zs]);
unzip3([], Xs, Ys, Zs) ->
    {reverse(Xs), reverse(Ys), reverse(Zs)}.
```

## 前提知識

- **三つ組（三要素のタプル）**: `{X, Y, Z}` の形で、三つの値を一つにまとめたものです。
- **三つの累積リスト**: `Xs`、`Ys`、`Zs` の三つを、一度の走査で同時に積みます。
- **`lists:reverse/1`**: リストの順番を逆にします。
- **パターン `{X, Y, Z}`**: 三要素のタプルだけに当たります。

## 何をしているか

### 1. 入口で、三つの空のリストを用意する

```erlang:line-numbers=915
unzip3(Ts) -> unzip3(Ts, [], [], []).
```

`unzip3/1` は、`Xs`、`Ys`、`Zs` を空のリストにして、`unzip3/4` に渡します。

### 2. 三つ組を分解して、三本に先頭から積む

```erlang:line-numbers=917
unzip3([{X, Y, Z} | Ts], Xs, Ys, Zs) ->
    unzip3(Ts, [X | Xs], [Y | Ys], [Z | Zs]);
```

先頭の三つ組 `{X, Y, Z}` の、それぞれの値を、対応する列の先頭に付けます。残りの三つ組に対して、同じ関数を呼びます。

### 3. 空になったら、順番を戻して組で返す

```erlang:line-numbers=919
unzip3([], Xs, Ys, Zs) ->
    {reverse(Xs), reverse(Ys), reverse(Zs)}.
```

三つ組が空になったら、三つの列を、それぞれ `reverse/1` で元の順番に戻します。その三つを、一つの組にして返します。

## ここがすごい

### 一度の走査で、三本の列を作る

三つ組の各要素を、別々の関数で取り出すと、リストを三回辿ることになります。
この関数は、一回の走査で三本の列を同時に作るので、リストの長さが大きくても、無駄な再走査がありません。

### 先頭に積んでから、最後に戻す

列の末尾に付けると、毎回リストを辿る必要があります。
先頭に積めば、一回ごとの作業は小さく済みます。逆順になった結果は、最後に一度だけ `reverse` で戻します。`unzip/1` と同じ工夫です。

### 形が合わなければ、失敗する

三つ組でない要素が混ざると、どの節にも当たらず、呼び出しは失敗します。
入力の形を、関数の頭で確かめているので、中の処理は、三つの値を取り出して積むことだけに専念できます。

### 三本の長さは、必ずそろう

三つ組の数だけ、三本の列にそれぞれ一つずつ積まれます。
そのため、結果の三つのリストは、いつも同じ長さです。呼び出し側は、三本を先頭から同時に読み進められます。

## まとめ

`lists:unzip3([{a, 1, x}, {b, 2, y}])` は、`{[a, b], [1, 2], [x, y]}` を返します。
三つの列が、元の順番のまま、それぞれに分かれます。
