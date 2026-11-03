---
title: "順序付き集合に、要素を正しい位置に入れる"
description: "ordsets:add_element/2 は、昇順の集合に要素を一つ加える。並びを保つ位置まで先頭から進み、そこに入れる。既に含まれていれば、集合をそのまま返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/ordsets.erl
lines: [240, 243]
function: "ordsets:add_element/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`ordsets:add_element/2` は、昇順に並んだ集合に、要素を一つ加えます。
要素は、並びが崩れない位置に入ります。すでに同じ要素があれば、集合は変わりません。

## コード

::: code-group

```erlang:line-numbers=240 [日本語訳]
add_element(E, [H|Es]) when E > H -> [H|add_element(E, Es)];
add_element(E, [H|_]=Set) when E < H -> [E|Set];
add_element(_E, [_H|_]=Set) -> Set;		%E と H が等しいとき、既にあるので集合をそのまま返す
add_element(E, []) -> [E].
```

```erlang:line-numbers=240 [原文]
add_element(E, [H|Es]) when E > H -> [H|add_element(E, Es)];
add_element(E, [H|_]=Set) when E < H -> [E|Set];
add_element(_E, [_H|_]=Set) -> Set;		%E == H
add_element(E, []) -> [E].
```

:::

## 前提知識

- **順序付き集合（ordset）**: 要素を昇順に並べ、重複を持たないリストです。
- **比較 `>` と `<`**: 加える要素 `E` と、先頭の `H` の大小で、どこまで進むかを決めます。
- **`[E|Set]`**: 要素を先頭に付ける形です。ここでは、正しい位置に来たことを表します。
- **空のリスト**: 末尾まで来たら、最後の位置に `E` を入れます。

## 何をしているか

### 1. 加える要素が先頭より大きければ、先頭を残して進む

```erlang:line-numbers=240
add_element(E, [H|Es]) when E > H -> [H|add_element(E, Es)];
```

`E` が先頭の `H` より大きければ、`H` は残し、`E` を残りの中に入れる作業を続けます。

### 2. 先頭より小さければ、ここに入れる

```erlang:line-numbers=241
add_element(E, [H|_]=Set) when E < H -> [E|Set];
```

`E` が先頭 `H` より小さければ、`E` は `H` の前に入るべき位置です。`[E|Set]` で、`E` を先頭に付けます。

### 3. 同じ要素があれば、そのまま返す

```erlang:line-numbers=242
add_element(_E, [_H|_]=Set) -> Set;		%E == H
```

`E` と `H` が等しければ、すでに集合に入っています。加えずに、`Set` をそのまま返します。

### 4. 末尾まで来たら、最後に入れる

```erlang:line-numbers=243
add_element(E, []) -> [E].
```

空のリストに当たったら、`E` は全ての要素より大きいので、末尾に入ります。`[E]` を返します。

## ここがすごい

### 並びを保つ位置を、比較だけで決める

昇順の集合に入れるとき、正しい位置は比較で分かります。
先頭より大きければ進み、小さければ止まります。大きさの順番を、並べ替えずに保てます。

### 同じ要素は、一つのまま

等しい場合は、新しく加えません。`Set` をそのまま返すので、集合は重複を持たないままです。
この判定を一つの節で書いていることで、重複を防ぐ仕組みが読み取りやすくなっています。

### 結果も、昇順のまま

どの節の結果も、昇順の並びを保っています。
読み手は、関数の結果を、次の集合の操作にそのまま渡せます。

### 集合の大きさは、一つ増えるだけ

同じ要素が無ければ、結果の要素数は一つ増えます。既にあれば、増えません。
この二つの場合を節で分けているので、呼び出し側は、集合の大きさがどう変わるかを、式の形から予測できます。

## まとめ

`ordsets:add_element(2, [1, 3])` は、`[1, 2, 3]` を返します。
`ordsets:add_element(3, [1, 3])` は、すでに `3` があるので、`[1, 3]` を返します。
