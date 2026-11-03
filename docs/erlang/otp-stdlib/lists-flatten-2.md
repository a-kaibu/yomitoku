---
title: "入れ子のリストを、末尾をつないだまま平らにする"
description: "lists:flatten/2 は、入れ子のリストを 1 つの平らなリストにして、指定の末尾をつなぐ。再帰の 2 つの節で、先頭の要素がリストかどうかで処理を分けている。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [1320, 1328]
function: "lists:flatten/2"
difficulty: 2
format: 2
tags: ["イディオム", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`lists:flatten/2` は、入れ子になったリストを、1 段の平らなリストに変えます。そして、2 番目の引数 `Tail` を、最後の要素のあとにつなげます。
たとえば `[[1, [2]], 3]` を平らにすると `[1, 2, 3]` です。`Tail` に `[4]` を渡すと、`[1, 2, 3, 4]` になります。

## コード

```erlang:line-numbers=1320
flatten(List, Tail) when is_list(List), is_list(Tail) ->
    do_flatten(List, Tail).

do_flatten([H|T], Tail) when is_list(H) ->
    do_flatten(H, do_flatten(T, Tail));
do_flatten([H|T], Tail) ->
    [H|do_flatten(T, Tail)];
do_flatten([], Tail) ->
    Tail.
```

## 前提知識

- **入れ子のリスト**: リストの中の要素が、さらにリストであるものです。`[[1, 2], [3]]` のように、深さは任意です。
- **`[H|T]`**: 先頭 `H` と残り `T` の組です。
- **`is_list/1`**: 値がリストかどうかを返します。空リスト `[]` も `true` です。
- **`Tail`**: 結果の最後につなげるリストです。`[]` を渡せば、何もつながりません。
- **`[H|do_flatten(T, Tail)]`**: `H` を先頭にして、残りの処理の結果をつなぎます。

## 何をしているか

### 1. 先頭の要素がリストのとき

```erlang:line-numbers=1323
do_flatten([H|T], Tail) when is_list(H) ->
    do_flatten(H, do_flatten(T, Tail));
```

先頭 `H` がリストなら、`H` の中身をさらに平らにする処理を行います。その結果の後ろに、残り `T` の処理結果をつなぎます。
`do_flatten(H, do_flatten(T, Tail))` は、内側の `T` を先に平らにして `Tail` につなぎ、その結果を `H` の中身の末尾にします。順番を正しく保つための書き方です。

### 2. 先頭の要素がリストでないとき

```erlang:line-numbers=1325
do_flatten([H|T], Tail) ->
    [H|do_flatten(T, Tail)];
```

先頭 `H` が普通の値（数や文字など）なら、そのまま先頭に置きます。残りの `T` を同じ方法で処理し、結果をつなぎます。

### 3. 空のリストになったとき

```erlang:line-numbers=1327
do_flatten([], Tail) ->
    Tail.
```

どこまで読んでも残りが `[]` になったら、`Tail` を返します。これで、連結の終わりに `Tail` が付きます。

## ここがすごい

### 末尾を引数にして、余分なコピーを避ける

入れ子を平らにしてから `++` でつなぐと、途中で何度もリストをコピーします。この関数は、残りの `Tail` を引数として渡し続けます。
結果の最後に、`Tail` をそのまま共有して付けられるので、余分なコピーが減ります。

### 先頭がリストかどうかだけで、すべてを処理する

平らにする仕事は、2 つの節だけで書けます。先頭がリストなら「中へ入る」、そうでなければ「その値を置く」。深さが何段でも、同じ 2 つの規則で処理されます。
このように、再帰の規則を少なく保つことが、Erlang のリスト処理の基本です。

## まとめ

- 入れ子のリストは、先頭の要素の種類で「中へ入る」か「置く」かを決めれば平らにできます。
- 後ろにつなげたいリストは、引数として渡すと、コピーを減らせます。
- 再帰の規則が 2 つ程度で済むと、読み手にとっても理解しやすくなります。
