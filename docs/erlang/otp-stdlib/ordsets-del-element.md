---
title: "順序付き集合から、一つの要素を取り除く"
description: "ordsets:del_element/2 は、昇順の集合から指定の要素を取り除く。先頭から比べ、大きすぎたら残りをそのまま返す形で、無駄な比較を減らす。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/ordsets.erl
lines: [263, 266]
function: "ordsets:del_element/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`ordsets:del_element/2` は、要素を昇順に並べたリストから、指定の要素を一つ取り除きます。
並びの前提があるので、探している要素より先に大きい要素が来た時点で、残りをそのまま返して終わります。

## コード

::: code-group

```erlang:line-numbers=263 [日本語訳]
del_element(E, [H|Es]) when E > H -> [H|del_element(E, Es)];
del_element(E, [H|_]=Set) when E < H -> Set;
del_element(_E, [_H|Es]) -> Es;			%E と H が等しいとき、H を取り除く
del_element(_, []) -> [].
```

```erlang:line-numbers=263 [原文]
del_element(E, [H|Es]) when E > H -> [H|del_element(E, Es)];
del_element(E, [H|_]=Set) when E < H -> Set;
del_element(_E, [_H|Es]) -> Es;			%E == H
del_element(_, []) -> [].
```

:::

## 前提知識

- **順序付き集合（ordset）**: 要素を昇順に並べ、重複を持たないリストです。
- **ガード `when E > H`**: 探す要素 `E` が、先頭の `H` より大きいかを確かめます。
- **`[H|del_element(E, Es)]`**: 先頭の要素を残し、残りから `E` を取り除いた結果を後ろにつなげます。
- **`Set`**: 引数の全体に付けた名前です。`[H|_]=Set` と書くと、先頭の分解と、リスト全体の両方に名前を付けられます。

## 何をしているか

### 1. 探す要素が、先頭より大きいとき

```erlang:line-numbers=263
del_element(E, [H|Es]) when E > H -> [H|del_element(E, Es)];
```

`E` が `H` より大きければ、`E` は後ろにあるかもしれません。先頭の `H` は残して、残りから続けて取り除きます。

### 2. 探す要素が、先頭より小さいとき

```erlang:line-numbers=264
del_element(E, [H|_]=Set) when E < H -> Set;
```

`E` が `H` より小さければ、並びの前提から、`E` はこのリストに無いことがわかります。何も取り除かず、`Set` をそのまま返します。

### 3. 等しいとき

```erlang:line-numbers=265
del_element(_E, [_H|Es]) -> Es;			%E == H
```

`E` と `H` が等しければ、先頭の `H` を捨てて、残りの `Es` を返します。これで、要素が一つ取り除かれます。

### 4. 空のリストのとき

```erlang:line-numbers=266
del_element(_, []) -> [].
```

空のリストからは、何も取り除けません。空のリストを返します。

## ここがすごい

### 並びの前提で、途中で止まる

並んでいない集合なら、最後まで見る必要があります。
この関数は、大きい要素に出会った時点で、残りに `E` は無いと判断して止まります。そのため、大きな集合でも、前の方だけを見れば結果が決まることが多くなります。

### 等しい場合は、要素を捨てるだけ

等しいと分かったときは、`H` を捨てて `Es` を返すだけです。残りは、元のリストの一部をそのまま使います。
新しいリストを一から作らないので、後ろの要素を組み直す手間がありません。

### 大きい場合は、先頭を残して進む

`E > H` の節は、`H` を残して、残りの処理を再帰で続けます。
戻り値の先頭に `H` を付けるので、並びの順番は崩れません。

## まとめ

`ordsets:del_element(2, [1, 2, 3])` は、`[1, 3]` を返します。
`ordsets:del_element(5, [1, 2, 3])` は、何も取り除かず、`[1, 2, 3]` を返します。
