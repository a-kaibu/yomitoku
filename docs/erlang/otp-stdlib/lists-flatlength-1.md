---
title: "入れ子のリストを平らにしたときの要素数を、作らずに数える"
description: "lists:flatlength/1 は、入れ子になったリストの葉の要素数を数える。平らなリストを作らず、中身を再帰的にたどって、数だけを積み上げる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [1349, 1356]
function: "lists:flatlength/1"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "再帰"]
---
## ひとことで

`lists:flatlength/1` は、リストの中にリストが入っている場合でも、平らにしたときの要素数を返します。
たとえば、`[1, [2, 3], [[4]]]` は、平らにすると四つの要素なので、結果は `4` になります。平らなリストを実際に作らずに、数だけを求めます。

## コード

```erlang:line-numbers=1349
flatlength(List) ->
    flatlength(List, 0).

flatlength([H|T], L) when is_list(H) ->
    flatlength(H, flatlength(T, L));
flatlength([_|T], L) ->
    flatlength(T, L + 1);
flatlength([], L) -> L.
```

## 前提知識

- **入れ子のリスト**: リストの要素に、さらにリストを入れたものです。
- **葉の要素**: リストの中で、もうリストではない値です。数はこの葉の数で決まります。
- **累積の数 `L`**: ここまでに数えた要素の数を、引数で持ち回ります。
- **`is_list/1`**: 値がリストかを調べる関数です。ガードで使われています。

## 何をしているか

### 1. 入口で、数の初期値を 0 にする

```erlang:line-numbers=1349
flatlength(List) ->
    flatlength(List, 0).
```

`flatlength/1` は、数えた数の初期値 `0` を用意して、`flatlength/2` を呼びます。

### 2. 先頭がリストなら、その中身を先に数える

```erlang:line-numbers=1352
flatlength([H|T], L) when is_list(H) ->
    flatlength(H, flatlength(T, L));
```

先頭の要素 `H` がリストなら、その中身 `H` を数えます。そして、その結果を、残り `T` を数えた値の上に足すように、積み上げます。
`flatlength(H, flatlength(T, L))` では、残りの数を先に計算し、それを初期値にして `H` の中身を数えます。

### 3. 先頭が葉なら、数を一つ増やす

```erlang:line-numbers=1354
flatlength([_|T], L) ->
    flatlength(T, L + 1);
```

先頭がリストでなければ、それは葉の要素です。数を一つ増やして、残りを数え続けます。

### 4. 空になったら、積んだ数を返す

```erlang:line-numbers=1356
flatlength([], L) -> L.
```

リストが空になったら、持ち回ってきた数 `L` を結果として返します。

## ここがすごい

### 平らにせずに、数だけを求める

平らなリストを作れば、結果の長さは、そのリストの長さで分かります。
しかし、それでは一時的に大きなリストを作ります。この関数は、数を引数で持ち回るだけなので、中間のリストを作らずに答えを出します。

### 入れ子の深さに、そのまま従う

先頭がリストなら、その中を先に数える、という規則だけで、どれだけ深くても正しく数えられます。
深さを表す変数や、特別な場合分けは要りません。再帰が、入れ子の構造と一致しています。

### 数を積むのに、足し算を使う

葉に当たるたびに、`L + 1` で数を増やします。
この形で、結果の数を一度だけ組み立てるので、読み手は、「葉の数を数えている」という考えを、そのまま式から読み取れます。

## まとめ

`lists:flatlength([1, [2, 3], [[4]]])` は、`4` を返します。
平らにすると `[1, 2, 3, 4]` ですが、その作業は行いません。
