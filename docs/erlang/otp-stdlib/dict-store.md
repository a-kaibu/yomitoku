---
title: "ハッシュ表に値を入れ、必要なら表を広げる"
description: "dict:store/3 は、キーの場所（スロット）を求め、そのバケットに値を入れ、新しいキーが増えたときだけ表の大きさを確かめる。辞書の一回の書き込みを三段で表す関数。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/dict.erl
lines: [373, 377]
function: "dict:store/3"
difficulty: 3
format: 2
tags: ["ハッシュ", "データ構造", "アルゴリズム"]
---
## ひとことで

`dict:store/3` は、キーと値を辞書に入れる関数です。
辞書は、キーのハッシュ値から「スロット」を決め、そのスロットにある「バケット」というリストに、キーと値の組を入れます。
この関数は、その手順を三段階で書いています。場所を探す、入れる、表の大きさを確かめる、の三つです。

## コード

```erlang:line-numbers=373
store(Key, Val, D0) ->
    Slot = get_slot(D0, Key),
    {D1,Ic} = on_bucket(fun (B0) -> store_bkt_val(Key, Val, B0) end,
			D0, Slot),
    maybe_expand(D1, Ic).
```

## 前提知識

- **ハッシュ表（辞書）**: キーを計算して、場所の番号（スロット）を決める入れ物です。同じ場所に複数のキーが入ることがあるので、場所ごとに小さなリスト（バケット）を持ちます。
- **スロット**: バケットの番号です。`get_slot/2` が、キーからスロットを求めます。
- **バケット**: 一つのスロットに入る、キーと値の組のリストです。
- **`on_bucket/3`**: 指定されたスロットのバケットに、関数を一つ適用します。適用した後の辞書と、増えた件数 `Ic` を返します。
- **`Ic`（増分）**: 新しいキーが増えたときは 1、既存の値を書き換えたときは 0 です。表の要素数を数えるために使います。

## 何をしているか

### 1. キーに対応するスロットを求める

```erlang:line-numbers=373
store(Key, Val, D0) ->
    Slot = get_slot(D0, Key),
```

`get_slot(D0, Key)` で、キーを置く場所の番号を求めます。同じキーなら、いつも同じスロットになります。

### 2. バケットに値を入れる

```erlang:line-numbers=375
    {D1,Ic} = on_bucket(fun (B0) -> store_bkt_val(Key, Val, B0) end,
			D0, Slot),
```

`on_bucket` に、`store_bkt_val` を包んだ無名関数を渡します。
`store_bkt_val` は、バケットの中を調べ、同じキーがあれば値を書き換え、なければ末尾に新しい組を足します。
戻り値は、新しいバケットと増分の組です。この増分が、後の判定に使われます。

<!-- source: lib/stdlib/src/dict.erl -->
```erlang:line-numbers=381
store_bkt_val(Key, New, [?kv(Key,_Old)|Bkt]) -> {[?kv(Key,New)|Bkt],0};
store_bkt_val(Key, New, [Other|Bkt0]) ->
    {Bkt1,Ic} = store_bkt_val(Key, New, Bkt0),
    {[Other|Bkt1],Ic};
store_bkt_val(Key, New, []) -> {[?kv(Key,New)],1}.
```

同じキーが見つかったときは増分が 0 で、見つからずにリストの終わりまで来たときは増分が 1 です。

### 3. 表が大きくなりすぎたら広げる

```erlang:line-numbers=377
    maybe_expand(D1, Ic).
```

`maybe_expand/2` は、増分が 0 なら何もせず、1 のときだけ、要素数が上限を超えたかを確かめます。上限を超えたら、表を広げます。

## ここがすごい

### 増分を値として返す

新しいキーかどうかを、別の関数で調べ直すこともできます。
しかし、この関数は、バケットを書き換える途中で得た増分をそのまま返しています。一回のバケット走査で、「入れたか」と「増えたか」が同時にわかります。

### 関数を渡して、場所の処理を一箇所に集める

`on_bucket/3` は、スロットを探す仕事と、バケットを書き換える仕事を分けています。
`store/3` の本体は、どのスロットに入れるかを気にせず、「このバケットに、この処理をする」だけを書けます。辞書の他の操作も、同じ `on_bucket` を使えます。

### 表を広げるかどうかは、増分だけで決める

`maybe_expand/2` の二つの節は、増分 0 と 1 しか受け付けません。
書き換えのときは、何もしないで済みます。要素が増えたときだけ、広げる判定を行うので、無駄な計算を避けられます。

## まとめ

`dict:store(a, 1, dict:new())` は、要素一つを持つ新しい辞書を返します。
同じキーで再度 `store` を呼ぶと、要素の数は増えず、値だけが書き換わります。
