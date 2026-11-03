---
title: "辞書の一つのバケットに処理をかけ、結果だけ差し替える"
description: "dict:on_bucket/3 は、スロットの番号からバケットを取り出し、関数を適用して、結果のバケットを辞書に戻す。読み書きの両方を、一つの経路でまとめる補助関数。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/dict.erl
lines: [689, 696]
function: "dict:on_bucket/3"
difficulty: 3
format: 2
tags: ["ハッシュ", "データ構造", "イディオム"]
---
## ひとことで

`dict:on_bucket/3` は、辞書の中の一つのバケットを取り出し、そこに関数 `F` を適用します。
`F` は、新しいバケットと、結果の値の組を返します。この関数は、新しいバケットを辞書の中に入れ直し、更新された辞書と結果を返します。

## コード

::: code-group

```erlang:line-numbers=689 [日本語訳]
on_bucket(F, T, Slot) ->
    SegI = ((Slot-1) div ?seg_size) + 1,
    BktI = ((Slot-1) rem ?seg_size) + 1,
    Segs = T#dict.segs,
    Seg = element(SegI, Segs),
    B0 = element(BktI, Seg),
    {B1,Res} = F(B0),				%バケットに対して処理をかける
    {T#dict{segs=setelement(SegI, Segs, setelement(BktI, Seg, B1))},Res}.
```

```erlang:line-numbers=689 [原文]
on_bucket(F, T, Slot) ->
    SegI = ((Slot-1) div ?seg_size) + 1,
    BktI = ((Slot-1) rem ?seg_size) + 1,
    Segs = T#dict.segs,
    Seg = element(SegI, Segs),
    B0 = element(BktI, Seg),
    {B1,Res} = F(B0),				%Op on the bucket.
    {T#dict{segs=setelement(SegI, Segs, setelement(BktI, Seg, B1))},Res}.
```

:::

## 前提知識

- **スロット番号とバケット**: 辞書は、番号で区切られたバケットの並びです。この関数は、番号から、バケットがある場所を計算します。
- **`div` と `rem`**: 割り算の商と余りです。番号を、セグメントの番号と、セグメントの中の番号に分けるために使います。
- **セグメント**: バケットをまとめた単位です。辞書は、セグメントの配列の中に、バケットを持ちます。
- **`element/2` と `setelement/3`**: タプルの指定位置の要素を取り出し、差し替えた新しいタプルを作ります。Erlang のタプルは書き換えられないので、差し替えは新しい値を作る形になります。

## 何をしているか

### 1. スロット番号から、セグメントの位置を計算する

```erlang:line-numbers=689
on_bucket(F, T, Slot) ->
    SegI = ((Slot-1) div ?seg_size) + 1,
    BktI = ((Slot-1) rem ?seg_size) + 1,
    Segs = T#dict.segs,
```

`Slot` を、セグメントの番号 `SegI` と、セグメントの中の番号 `BktI` に分けます。どちらも `1` から数えるように、`-1` と `+1` で調整しています。

### 2. バケットを取り出し、関数を適用する

```erlang:line-numbers=693
    Seg = element(SegI, Segs),
    B0 = element(BktI, Seg),
    {B1,Res} = F(B0),				%Op on the bucket.
```

セグメントと、その中のバケットを取り出します。`F(B0)` で、バケットに処理をかけます。結果は、新しいバケット `B1` と、値 `Res` の組です。

### 3. 新しいバケットを入れ直して返す

```erlang:line-numbers=696
    {T#dict{segs=setelement(SegI, Segs, setelement(BktI, Seg, B1))},Res}.
```

`setelement` で、セグメントの中の該当位置を `B1` に差し替え、さらにそのセグメントを辞書の中に差し替えます。
新しい辞書と、`Res` の組を返します。元の辞書は変わりません。

## ここがすごい

### 読み書きの流れを一つにまとめる

`store/3` や `fetch/2` のように、バケットを扱う関数は、どれも「取り出す、処理する、戻す」の流れになります。
この流れを `on_bucket` に一つだけ書けば、他の関数は、処理の中身だけを書けます。
辞書の中の場所の計算が、一箇所にまとまります。

### 差し替えは、新しい値を作る

Erlang のタプルは、書き換えられません。
そのため、`setelement` は、元の値を変えずに、差し替えた新しいタプルを作ります。元の辞書を使い続けたい場合でも、安全に扱えます。

### 結果と新しい辞書を組で返す

戻り値は `{新しい辞書, 結果}` です。
バケットを変えるだけでなく、その中から値を取り出す処理も、同じ関数の中で行えます。呼び出し側は、新しい辞書と結果を、一度に受け取れます。

## まとめ

`dict:on_bucket` は、辞書の中の一か所だけを差し替えるための仕組みです。
この関数を使う `dict:store/3` は、同じ流れで、新しい辞書を返します。
