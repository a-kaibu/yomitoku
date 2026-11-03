---
title: "集合に要素を足すとき、同じ要素は 1 つだけ残す"
description: "sets:add_element/2 は、集合に要素を 1 つ足す。新しい形の集合ではマップのキーに、古い形ではバケットに入れ、同じ要素がすでにあれば何もせず、増えたら段を広げる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [426, 437]
function: "sets:add_element/2"
difficulty: 3
format: 2
tags: ["データ構造", "ハッシュ", "標準ライブラリ"]
---
## ひとことで

`sets:add_element/2` は、集合に要素 `E` を 1 つ足します。すでに同じ要素があれば、集合は変わりません。
集合には 2 つの表し方があります。マップで表した新しい形は、その場でキーを追加します。古い形は、ハッシュの「バケット」（同じ値の振り分け先の小さなリスト）に要素を入れ、必要なら段を広げます。

## コード

```erlang:line-numbers=426
add_element(E, #{}=S) ->
    S#{E=>?VALUE};
add_element(E, #set{}=S0) ->
    Slot = get_slot(S0, E),
    Bkt = get_bucket(S0, Slot),
    case lists:member(E, Bkt) of
        true ->
            S0;
        false ->
            S1 = update_bucket(S0, Slot, [E | Bkt]),
            maybe_expand(S1)
    end.
```

## 前提知識

- **集合（set）**: 同じ要素を 2 回持たない、要素の集まりです。
- **マップのキー**: `#{E => 値}` の形で、キーは重複しません。`sets` の新しい形は、この性質を使います。
- **バケットと段**: ハッシュの値で振り分けた先の、小さなリストです。段は、そのバケットの集まりです。前に見た `dict` と似た仕組みです。
- **`get_slot/2` と `get_bucket/2`**: 要素がどのバケットにあるかを調べ、そのリストを取り出す補助関数です。
- **`lists:member/2`**: リストに値があるかを調べます。
- **`maybe_expand/1`**: 要素が増えたときに、段を広げるかを判断する補助関数です。

## 何をしているか

### 1. マップで表した集合のとき

```erlang:line-numbers=426
add_element(E, #{}=S) ->
    S#{E=>?VALUE};
```

新しい形の集合は、マップです。`S#{E => ?VALUE}` で、キーとして `E` を追加します。キーが重複しないので、同じ要素を 2 回入れても、結果は 1 つだけになります。

### 2. 古い形の集合のとき

```erlang:line-numbers=428
add_element(E, #set{}=S0) ->
    Slot = get_slot(S0, E),
    Bkt = get_bucket(S0, Slot),
```

古い形の集合は、`get_slot/2` で `E` の振り分け先（段）を求めます。`get_bucket/2` で、その中のバケット `Bkt` を取り出します。

### 3. 同じ要素があったとき

```erlang:line-numbers=431
    case lists:member(E, Bkt) of
        true ->
            S0;
```

`lists:member/2` で、バケットに `E` があるかを調べます。あれば、集合は変わらないので、元の `S0` をそのまま返します。

### 4. 無かったとき

```erlang:line-numbers=434
        false ->
            S1 = update_bucket(S0, Slot, [E | Bkt]),
            maybe_expand(S1)
```

なければ、`E` をバケットの先頭に入れ、`update_bucket/3` で集合を作り直します。要素が増えて、段を広げる必要があれば、`maybe_expand/1` が広げます。

## ここがすごい

### 同じ要素は、何もせずに返す

集合に既にある要素を足すとき、新しい集合を作る必要はありません。`lists:member/2` で確かめて、同じ `S0` を返せば済みます。
不要なコピーを作らないことで、同じ要素を何度足しても、無駄な仕事が増えません。

### 2 つの表し方を、同じ関数名で使い分ける

マップの集合は、キーの重複を言語の仕組みに任せられます。古い形は、自分でバケットを管理します。
同じ `add_element/2` で、どちらの形にも対応しています。利用者は、表し方を気にせず使えます。

## まとめ

- 集合への追加は、既にあるかを先に確かめると、不要な更新を省けます。
- マップを使う表し方は、キーの重複を言語に任せられるので、書く量が減ります。
- 要素数が増えたら段を広げる仕組みは、ハッシュの表で広く使われる考え方です。
