---
title: "順序付き辞書に、キーがあるかを昇順の並びを使って調べる"
description: "orddict:is_key/2 は、昇順のキーの並びを先頭から比べ、探すキーが先頭より小さくなった時点で false を返す。見つかれば true、無ければ false。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/orddict.erl
lines: [91, 94]
function: "orddict:is_key/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`orddict:is_key/2` は、順序付き辞書に、指定のキーがあるかを `true` か `false` で返します。
辞書は、キーの昇順に並んでいるので、探すキーより大きいキーに出会った時点で、もう無いと判断して止まります。

## コード

::: code-group

```erlang:line-numbers=91 [日本語訳]
is_key(Key, [{K,_}|_]) when Key < K -> false;
is_key(Key, [{K,_}|Dict]) when Key > K -> is_key(Key, Dict);
is_key(_Key, [{_K,_Val}|_]) -> true;		%キーが一致したとき、見つかったので true を返す
is_key(_, []) -> false.
```

```erlang:line-numbers=91 [原文]
is_key(Key, [{K,_}|_]) when Key < K -> false;
is_key(Key, [{K,_}|Dict]) when Key > K -> is_key(Key, Dict);
is_key(_Key, [{_K,_Val}|_]) -> true;		%Key == K
is_key(_, []) -> false.
```

:::

## 前提知識

- **順序付き辞書（orddict）**: `{Key, Value}` の組を、キーの昇順に並べたリストです。
- **比較 `<` と `>`**: 探すキー `Key` と、先頭の組のキー `K` を比べて、進むかどうかを決めます。
- **`_Key` と `_K`**: アンダースコアで始まる変数は、使わないことを表します。

## 何をしているか

### 1. 探すキーが先頭より小さければ、無い

```erlang:line-numbers=91
is_key(Key, [{K,_}|_]) when Key < K -> false;
```

`Key` が先頭のキー `K` より小さければ、並びの前提から、このリストには無いと分かります。`false` を返します。

### 2. 探すキーが先頭より大きければ、残りを探す

```erlang:line-numbers=92
is_key(Key, [{K,_}|Dict]) when Key > K -> is_key(Key, Dict);
```

`Key` が `K` より大きければ、先頭は違うキーなので、残りの辞書で同じ関数を呼びます。

### 3. 一致すれば、有る

```erlang:line-numbers=93
is_key(_Key, [{_K,_Val}|_]) -> true;		%Key == K
```

先頭のキーが `Key` と等しければ、キーは辞書にあるので、`true` を返します。

### 4. 最後まで無ければ、無い

```erlang:line-numbers=94
is_key(_, []) -> false.
```

辞書が空になれば、キーは無かったので、`false` を返します。

## ここがすごい

### 並びを使って、途中で打ち切る

昇順の並びでは、探すキーより大きいキーに出会ったとき、残りに探すキーは現れません。
この関数は、その時点で `false` を返すので、辞書の後ろまで見る必要はありません。

### 値を見ずに、キーだけを比べる

値は、この関数では使われません。キーの有無だけを答えるので、比べる対象は、キーだけです。
読み手は、関数の中で「値」を探す必要が無いと、すぐに分かります。

### 四つの節が、場合を網羅する

探すキーと先頭の大小関係は、「小さい」「大きい」「等しい」の三通りです。
そこに、「空」の場合を足して、四つの節で全部を覆っています。どの入力にも、必ず一つの節が当たります。

### 値を取り出す関数との違い

`orddict:find/2` や `orddict:fetch/2` は、キーの値も返します。
`is_key/2` は、値を取り出さず、有無だけを返すので、比べる手間が少し減ります。
存在だけを確かめたい場面では、この関数が自然な選択です。

## まとめ

`orddict:is_key(b, [{a, 1}, {b, 2}])` は、`true` を返します。
`orddict:is_key(c, [{a, 1}, {b, 2}])` は、`false` を返します。
