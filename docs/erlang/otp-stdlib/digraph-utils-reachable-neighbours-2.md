---
title: "開始の頂点を除いて、そこから到達できる頂点を集める"
description: "digraph_utils:reachable_neighbours/2 は、reachable/2 と同じ探索をするが、開始の頂点は結果に含めない。ただし、別の経路で戻ってこられる場合は含まれる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1999-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/digraph_utils.erl
lines: [179, 180]
function: "digraph_utils:reachable_neighbours/2"
difficulty: 3
format: 2
tags: ["アルゴリズム", "データ構造", "標準ライブラリ"]
---
## ひとことで

`digraph_utils:reachable_neighbours/2` は、指定した頂点から辺をたどって行ける頂点を集めます。
`reachable/2` と違い、開始の頂点は、最初から結果に入れません。

## コード

```erlang:line-numbers=179
reachable_neighbours(Vs, G) when is_list(Vs) ->
    lists:append(forest(G, fun out/3, Vs, not_first)).
```

## 前提知識

- **到達可能**: 辺の向きに沿ってたどって、行ける頂点のことです。
- **`not_first`**: 開始の頂点を、結果の最初には入れない指定です。`reachable/2` が使う `first` と対になります。
- **`forest/4`**: 頂点ごとに、到達できる頂点を木の形で作る補助関数です。
- **`lists:append/1`**: 木の並びを、一つのリストに連結します。

## 何をしているか

### 1. 探索の指定だけを変える

```erlang:line-numbers=179
reachable_neighbours(Vs, G) when is_list(Vs) ->
```

`reachable_neighbours/2` の本体は、`reachable/2` と同じ形です。
違うのは、`forest/4` に渡す指定が `not_first` であることだけです。

### 2. 連結して、一つのリストにする

```erlang:line-numbers=180
    lists:append(forest(G, fun out/3, Vs, not_first)).
```

探索で得た木の並びを、`lists:append/1` で連結します。
ここまでは、`reachable/2` と同じ処理です。

## ここがすごい

### 一語の違いで、結果の意味が変わる

同じ探索を、`first` と `not_first` の一語だけで切り替えています。
関数の中身を書き直さずに、二つの意味を持たせています。読み手は、指定の一語を見れば違いが分かります。

### 戻ってこられる頂点は、含まれる

開始の頂点を最初には入れませんが、辺をたどって戻ってこられれば、結果に現れます。
つまり、「開始の頂点を除く」は、「開始の頂点を最初に数えない」という意味です。循環のあるグラフでは、この違いが結果に表れます。

### 探索の本体を、一箇所にまとめる

`reachable/2` と `reachable_neighbours/2` は、同じ `forest/4` を使います。
探索の仕組みを直すときは、一箇所を直せば、両方に効きます。

### 循環のないグラフでは、開始の頂点は含まれない

辞書の上で、開始の頂点から戻る道がなければ、その頂点は結果に現れません。
このときは、`reachable/2` の結果から開始の頂点を取り除いたものと同じになります。循環の有無で、二つの関数の結果が変わる、という理解で十分です。

## まとめ

`digraph_utils:reachable_neighbours([a], G)` は、`a` から行ける頂点を返します。
`a` 自身は、別の経路で戻ってこられない限り、結果に含まれません。
