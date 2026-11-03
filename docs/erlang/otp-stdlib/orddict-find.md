---
title: "順に並んだ辞書から、キーを途中で打ち切って探す"
description: "orddict:find/2 は、キーで昇順に並んだリストを先頭から見ていき、キーが超えた時点で打ち切る。並んでいる前提を使って、無駄な比較を減らす関数。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/orddict.erl
lines: [212, 215]
function: "orddict:find/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`orddict:find/2` は、キーと値の組のリストから、キーに対応する値を探します。
リストはキーの昇順に並んでいるという前提があります。そのため、探しているキーより大きいキーが出てきた時点で、もう見つからないと判断して止まります。

## コード

::: code-group

```erlang:line-numbers=212 [日本語訳]
find(Key, [{K,_}|_]) when Key < K -> error;
find(Key, [{K,_}|D]) when Key > K -> find(Key, D);
find(_Key, [{_K,Value}|_]) -> {ok,Value};	%K と Key が等しいとき、値を返す
find(_, []) -> error.
```

```erlang:line-numbers=212 [原文]
find(Key, [{K,_}|_]) when Key < K -> error;
find(Key, [{K,_}|D]) when Key > K -> find(Key, D);
find(_Key, [{_K,Value}|_]) -> {ok,Value};	%Key == K
find(_, []) -> error.
```

:::

## 前提知識

- **orddict（順序付き辞書）**: `{Key, Value}` の組を、キーの昇順に並べたリストです。
- **ガード `when Key < K`**: 比較の結果で節を選びます。Erlang の項の比較順序で、数の大小や、文字列の順序などが決まります。
- **`{ok, Value}` と `error`**: 見つかったかどうかを表す、標準的な戻り値の形です。
- **再帰**: 残りのリストに対して、同じ関数をもう一度呼びます。

## 何をしているか

### 1. 探すキーより、先頭のキーが大きいとき

```erlang:line-numbers=212
find(Key, [{K,_}|_]) when Key < K -> error;
```

先頭のキー `K` が、探すキー `Key` より大きければ、並び順から見て、`Key` はこのリストに無いことがわかります。その時点で `error` を返します。

### 2. 探すキーより、先頭のキーが小さいとき

```erlang:line-numbers=213
find(Key, [{K,_}|D]) when Key > K -> find(Key, D);
```

先頭のキーが `Key` より小さければ、そのキーは探す対象ではありません。残りのリストで、同じ `find` を呼びます。

### 3. キーが一致したとき

```erlang:line-numbers=214
find(_Key, [{_K,Value}|_]) -> {ok,Value};	%Key == K
```

キーが一致したときは、その組の値を `{ok, Value}` で返します。

### 4. リストが尽きたとき

```erlang:line-numbers=215
find(_, []) -> error.
```

リストが空になれば、見つからなかったので `error` を返します。

## ここがすごい

### 並んでいることを使って、早めに諦める

ふつうのリストから探すなら、最後まで全部見る必要があります。
順序付きの辞書では、探すキーより大きいキーに出会った時点で、残りに探すキーは現れません。この一行の判定で、途中で打ち切れます。

### 比較の節を、先頭の並べ方で分ける

三つの比較（小さい、大きい、等しい）を、三つの節で書いています。
それぞれの節の本体は、一行だけです。どの場合に何を返すかが、ガードで見えるように並べられています。

### 一致の節で、値を取り出すだけにする

一致したときの節では、キーは捨て、値だけを `{ok, Value}` に包みます。
最後の節は、`Key == K` の場合だと、コメントが示しています。

## まとめ

`orddict:find(b, [{a, 1}, {b, 2}])` は、`{ok, 2}` を返します。
`orddict:find(c, [{a, 1}, {b, 2}])` は、`error` を返します。
