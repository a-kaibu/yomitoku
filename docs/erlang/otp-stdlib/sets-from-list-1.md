---
title: "リストの要素から、重複のない集合を作る"
description: "sets:from_list/1 は、リストの要素を集合にする。同じ要素は一つにまとまる。map 版の集合では、maps:from_keys/2 を使い、値に共通の定数を入れる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [224, 225]
function: "sets:from_list/1"
difficulty: 1
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`sets:from_list/1` は、リストの要素を集めて、重複のない集合を作ります。
同じ要素が何度並んでいても、集合では一つだけになります。

## コード

```erlang:line-numbers=224
from_list(Ls) ->
    maps:from_keys(Ls, ?VALUE).
```

## 前提知識

- **集合（set）**: 要素の重複を持たず、どの要素が含まれるかだけを表すデータ構造です。
- **map の形**: 要素をキーにした map で集合を表す形です。値は使わないので、すべて同じ定数を入れます。
- **`?VALUE`**: ソースの中で定義されたマクロです。集合の値に使う、同じ定数を表します。
- **`maps:from_keys/2`**: キーのリストと、全キーに入れる一つの値から、map を作る関数です。

## 何をしているか

### 1. キーのリストを、そのまま渡す

```erlang:line-numbers=224
from_list(Ls) ->
    maps:from_keys(Ls, ?VALUE).
```

本体は一行です。引数の `Ls` を、そのまま `maps:from_keys/2` のキーのリストにします。
値には `?VALUE` を入れます。集合は値を使わないので、どの要素も同じ値になります。

## ここがすごい

### 重複は、map のキーが消す

map のキーは、同じものが二つあり得ません。
そのため、リストに同じ要素が何度あっても、`maps:from_keys/2` が作る map では、キーは一つだけになります。重複の処理を、関数の中に書く必要はありません。

### 集合を、map の性質で表す

集合は、「どの要素があるか」だけが分かればよい構造です。
それを、キーだけの map で表すと、要素の追加や検索を map の機能で済ませられます。この関数は、その土台を一度に作ります。

### 値を捨てる設計

値に意味を持たせず、同じ定数を入れておく形です。
読み手は、`?VALUE` の値が何であっても、集合としての意味は変わらないと理解すれば十分です。

### 空のリストは、空の集合になる

入力のリストが空なら、`maps:from_keys/2` は、キーのない map を返します。
集合としては、要素が一つもない空の集合です。特別な分岐は要りません。

### 結果は、map なので後から要素を増やせる

作られた集合は、map の形をしています。`sets:add_element/2` で要素を加えたり、`sets:is_element/2` で確かめたりできます。
一度作った集合を、そのまま使い続けられるように、リストからの作成は、この一度の関数で済ませます。

## まとめ

`sets:from_list([a, b, a])` は、`a` と `b` の二つの要素を持つ集合を返します。
重複した `a` は、一つにまとまります。
