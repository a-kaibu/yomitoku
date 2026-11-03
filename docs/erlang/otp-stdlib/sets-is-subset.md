---
title: "部分集合かどうかを、大きさの比較で先に打ち切る"
description: "sets:is_subset/2 は、ある集合が別の集合に含まれるかを判定する。大きさを先に比べて、明らかに無理な場合は走査せずに false を返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [795, 803]
function: "sets:is_subset/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`sets:is_subset/2` は、第 1 の集合のすべての要素が、第 2 の集合にも含まれているかを判定します。
集合を表すのは、マップ（`#{}`）を使う新しい版の `sets` です。大きさを先に比べ、明らかに部分集合になり得ない場合は、中身を調べずに `false` を返します。

## コード

```erlang:line-numbers=795
is_subset(#{}=S1, #{}=S2) ->
    if
	map_size(S1) > map_size(S2) ->
	    false;
	true ->
	    is_subset_1(S2, maps:iterator(S1))
    end;
is_subset(S1, S2) ->
    fold(fun (E, Sub) -> Sub andalso is_element(E, S2) end, true, S1).
```

## 前提知識

- **部分集合**: 集合 `S1` のすべての要素が、`S2` に含まれている状態です。`S1` が空なら、どんな集合の部分集合でもあります。
- **`#{}` で表した集合**: `sets` の新しい版では、要素をマップのキーとして持ちます。値は使いません。
- **`map_size/1`**: マップの要素数を返します。
- **`maps:iterator/1`**: マップの要素を順に取り出すイテレータを作ります。
- **`fold/3`**: 集合の要素を順に処理して、1 つの値にまとめます。
- **`andalso`**: 左の条件が偽なら、右を調べずに偽を返す演算子です。

## 何をしているか

### 1. 大きさの比較で、すぐに答えが出るとき

```erlang:line-numbers=796
    if
	map_size(S1) > map_size(S2) ->
	    false;
```

`S1` の要素数が `S2` より多いなら、`S1` の要素を全部 `S2` に含めることはできません。その時点で `false` を返します。中身を 1 つも調べません。

### 2. 大きさがそれ以下のとき

```erlang:line-numbers=799
	true ->
	    is_subset_1(S2, maps:iterator(S1))
```

`S1` の要素数が `S2` 以下のときは、`S1` の要素を 1 つずつ確かめる必要があります。`is_subset_1/2` が、イテレータを使って順に確かめます。

### 3. 集合以外を比べたとき

```erlang:line-numbers=802
is_subset(S1, S2) ->
    fold(fun (E, Sub) -> Sub andalso is_element(E, S2) end, true, S1).
```

`#{}` の形でない集合が渡されたときは、古い形の集合として扱います。`fold/3` で、`S1` の各要素が `S2` に含まれるかを `andalso` で積み重ねます。途中で偽になったら、以後の判定を省きます。

## ここがすごい

### 大きさという、安いヒントで先に打ち切る

部分集合の判定は、すべての要素を比べると時間がかかります。しかし、要素数だけは `map_size/1` で一瞬に分かります。
要素数が大きい方の集合は、小さい方の中に入りません。この単純な事実で、無駄な走査を省いています。

### 途中で止まれるように、`andalso` を使う

`fold/3` で `andalso` を使うと、どこかで偽が出た時点で、以後の判定を省けます。
「全部真でなければならない」という判定は、この形がよく合っています。

## まとめ

- 部分集合の判定は、要素数の比較で先に打ち切れることがあります。
- 「すべてが真か」を調べるときは、`andalso` で途中打ち切りできます。
- マップを集合の表現に使うと、要素の存在を速く確かめられます。
