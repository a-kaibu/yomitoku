---
title: "頂点のリストから、到達できるすべての頂点を集める"
description: "digraph_utils:reachable/2 は、指定した頂点から辺をたどって到達できる頂点を集める。森を作る forest の結果を、lists:append/1 で一つのリストにまとめる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1999-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/digraph_utils.erl
lines: [164, 165]
function: "digraph_utils:reachable/2"
difficulty: 3
format: 2
tags: ["アルゴリズム", "データ構造", "標準ライブラリ"]
---
## ひとことで

`digraph_utils:reachable/2` は、有向グラフの中で、指定した頂点から辺をたどって行ける頂点を集めます。
開始の頂点も、結果に含まれます。

## コード

```erlang:line-numbers=164
reachable(Vs, G) when is_list(Vs) ->
    lists:append(forest(G, fun out/3, Vs, first)).
```

## 前提知識

- **有向グラフ（digraph）**: 頂点と、向きのある辺からできたグラフです。`digraph` モジュールで表されます。
- **到達可能**: ある頂点から、辺の向きに沿ってたどって、別の頂点に行けることです。
- **`forest/4`**: 頂点ごとに、到達できる頂点を木の形で作る補助関数です。`fun out/3` は、ある頂点から出ている辺を取り出す関数です。
- **`first`**: 開始の頂点を結果に含める指定です。

## 何をしているか

### 1. 指定の頂点から、森を作る

```erlang:line-numbers=164
reachable(Vs, G) when is_list(Vs) ->
```

`reachable/2` は、頂点のリスト `Vs` を受け取ります。
`forest/4` に、グラフ `G`、出ている辺を取る関数 `fun out/3`、頂点のリスト、そして `first` を渡します。結果は、木の並びです。

### 2. 森を一つのリストにまとめる

```erlang:line-numbers=165
    lists:append(forest(G, fun out/3, Vs, first)).
```

`lists:append/1` で、木の並びを一つのリストに連結します。
頂点が複数の木に現れることは、この処理の中で扱われます。

## ここがすごい

### 関数の組み合わせで、探索を書く

グラフの探索の細かい処理は、`forest/4` に任せています。
この関数は、その結果を連結するだけです。探す方向や、開始の扱いを、引数で切り替えられる作りになっています。

### 開始の頂点を、`first` で指定する

`first` は、開始の頂点を結果に含めることを表します。
同じ探索を、開始の頂点を含めない形でも使えるように、`reachable_neighbours/2` では `not_first` を渡しています。

### 結果は、リストの形で返る

到達可能な頂点は、順番を持つリストとして返ります。
順番に意味はありません。集合のように扱いたいときは、`sets:from_list/1` で包むと扱いやすくなります。

### 結果の重複は、呼び出し側が気にしなくてよい

頂点が複数の経路で到達できても、結果のリストに同じ頂点が何度も並ぶとは限りません。
ただし、木の並びを連結するので、重複の扱いは `forest/4` の結果に依存します。重複を確実に取り除きたいときは、`sets:from_list/1` で包む方が安全です。

## まとめ

`digraph_utils:reachable([a], G)` は、頂点 `a` から行ける頂点を、`a` を含めてリストで返します。
辺が一つも無い頂点を渡すと、その頂点だけを含むリストになります。
