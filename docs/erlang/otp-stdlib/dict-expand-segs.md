---
title: "表を 2 倍にするとき、古い段を先頭へ並べて再利用する"
description: "dict:expand_segs/2 は、dict の内部のタプルに持つ段（セグメント）の数を 2 倍にする。既存の段をそのまま並べ、新しい段は空の段で埋めるので、中身の再計算がいらない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/dict.erl
lines: [865, 880]
function: "dict:expand_segs/2"
difficulty: 3
format: 2
tags: ["データ構造", "ハッシュ"]
---
## ひとことで

`dict:expand_segs/2` は、`dict` の内部にある「段（セグメント）」の数を 2 倍に増やす関数です。
段は、ハッシュ値の範囲ごとに要素を入れておく器です。要素が増えたときに段を増やしますが、既存の段の中身は作り直しません。新しい段は、同じ空の段（`Empty`）で埋めます。

## コード

```erlang:line-numbers=865
expand_segs({B1}, Empty) ->
    {B1,Empty};
expand_segs({B1,B2}, Empty) ->
    {B1,B2,Empty,Empty};
expand_segs({B1,B2,B3,B4}, Empty) ->
    {B1,B2,B3,B4,Empty,Empty,Empty,Empty};
expand_segs({B1,B2,B3,B4,B5,B6,B7,B8}, Empty) ->
    {B1,B2,B3,B4,B5,B6,B7,B8,
     Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty};
expand_segs({B1,B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12,B13,B14,B15,B16}, Empty) ->
    {B1,B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12,B13,B14,B15,B16,
     Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty,
     Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty};
expand_segs(Segs, Empty) ->
    list_to_tuple(tuple_to_list(Segs)
    ++ lists:duplicate(tuple_size(Segs), Empty)).
```

## 前提知識

- **`dict`**: キーと値の組を持つ辞書のモジュールです。Erlang の標準ライブラリにあります。
- **段（セグメント）**: `dict` の中では、ハッシュ値で振り分けられた「バケツの集まり」を、いくつかの段にまとめています。この関数は、段の数を変えます。
- **タプル `{B1, B2, ...}`**: 固定長の値の並びです。`tuple_size/1` で長さを、`tuple_to_list/1` でリストにできます。
- **`list_to_tuple/1`**: リストをタプルに変換します。
- **`lists:duplicate/2`**: 同じ値を指定の個数だけ並べたリストを作ります。
- **`++`**: リストどうしを連結します。
- **`Empty`**: 空の段を表す値です。呼び出しのたびに、同じものを新しい段に入れます。

## 何をしているか

### 1. 段が 1 つ、2 つ、4 つ、8 つ、16 つの場合

```erlang:line-numbers=865
expand_segs({B1}, Empty) ->
    {B1,Empty};
expand_segs({B1,B2}, Empty) ->
    {B1,B2,Empty,Empty};
expand_segs({B1,B2,B3,B4}, Empty) ->
    {B1,B2,B3,B4,Empty,Empty,Empty,Empty};
expand_segs({B1,B2,B3,B4,B5,B6,B7,B8}, Empty) ->
    {B1,B2,B3,B4,B5,B6,B7,B8,
     Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty};
expand_segs({B1,B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12,B13,B14,B15,B16}, Empty) ->
    {B1,B2,B3,B4,B5,B6,B7,B8,B9,B10,B11,B12,B13,B14,B15,B16,
     Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty,
     Empty,Empty,Empty,Empty,Empty,Empty,Empty,Empty};
```

段の数が小さいときは、タプルの中身をそのまま並べ直し、後ろに空の段を同じ数だけ追加します。たとえば段が `{B1, B2}` の 2 つなら、`{B1, B2, Empty, Empty}` の 4 つになります。
ここでは `list_to_tuple/1` を使わず、タプルのパターンを直接書いています。小さな段数の場合を速く扱うためです。

### 2. それ以外の場合

```erlang:line-numbers=878
expand_segs(Segs, Empty) ->
    list_to_tuple(tuple_to_list(Segs)
    ++ lists:duplicate(tuple_size(Segs), Empty)).
```

段の数が 16 を超えるときは、一般的な方法で扱います。タプルをいったんリストにし、同じ数の `Empty` を後ろにつなげて、もう一度タプルに戻します。

## ここがすごい

### 既存の段を、そのまま使い回す

段を増やすとき、今ある段に入っているキーをすべて取り出して、ハッシュ値の振り分けを計算し直すこともできます。しかしこの関数は、既存の段を一切触りません。
段の数を 2 倍にしたときは、新しい段がすべて空なので、どの要素もそのまま使えます。

### 段の数が 2 のべきになる理由

段の数を 2 倍ずつに増やすと、段の数の増え方が予想しやすくなります。コメントに書かれているとおり、2 のべきの場合を特別扱いするのは、よくある大きさを速く扱うためです。

## まとめ

- 表を大きくするとき、既存の要素を移動させず、空の段を後ろに足すだけで済ませられます。
- 2 のべきで段を増やすと、振り分けの計算がそろい、移動も少なくなります。
- 小さな大きさには、タプルのパターンで直接書いた速い経路を用意しています。
