---
title: "集合に要素が入っているかを、表の種類に合わせて調べる"
description: "sets:is_element/2 は、集合が「マップ版」か「レコード版」かで、調べ方を変える。マップ版はキーの有無で、レコード版はバケットの中を線形に探す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [395, 403]
function: "sets:is_element/2"
difficulty: 2
format: 2
tags: ["データ構造", "ハッシュ", "イディオム"]
---
## ひとことで

`sets:is_element/2` は、要素が集合に入っているかを `true` か `false` で返します。
集合には、マップで作られたものと、`#set{}` というレコードで作られたものがあります。この関数は、どちらが渡されたかを、パターンマッチで見分けて、適した方法で調べます。

## コード

```erlang:line-numbers=395
is_element(E, #{}=S) ->
    case S of
        #{E := _} -> true;
        _ -> false
    end;
is_element(E, #set{}=S) ->
    Slot = get_slot(S, E),
    Bkt = get_bucket(S, Slot),
    lists:member(E, Bkt).
```

## 前提知識

- **マップ**: `#{キー => 値}` の形で、キーの有無を素早く調べられるデータ構造です。ここでは、要素をキーとして使っています。
- **`#{E := _}` パターン**: マップに `E` というキーがあるときだけ、マッチします。値は捨てています。
- **レコード `#set{}`**: 名前付きのフィールドを持つタプルです。ここでは、ハッシュ表の構造をまとめて持つ箱として使われています。
- **`get_slot/2` と `get_bucket/2`**: レコード版の集合で、要素の場所とバケットを求める関数です。辞書の仕組みと、同じ考え方です。
- **`lists:member/2`**: リストの中に、値が含まれるかを調べます。

## 何をしているか

### 1. マップで作られた集合

```erlang:line-numbers=395
is_element(E, #{}=S) ->
    case S of
        #{E := _} -> true;
        _ -> false
    end;
```

集合がマップのとき、`case` で `#{E := _}` にマッチするかを調べます。キーとして `E` があれば `true`、なければ `false` です。
マップのキーの検索は、要素数が多くても速く、この関数の中で、探す手順を書く必要がありません。

### 2. レコードで作られた集合

```erlang:line-numbers=400
is_element(E, #set{}=S) ->
    Slot = get_slot(S, E),
    Bkt = get_bucket(S, Slot),
    lists:member(E, Bkt).
```

集合がレコードのとき、まず `get_slot` でキーの場所を求めます。次に `get_bucket` で、その場所のバケットを取り出します。
最後に、バケットの中を `lists:member/2` で調べます。バケットは短いリストなので、線形に探しても、全体の速さは保たれます。

## ここがすごい

### 二つの形を、関数の節で分ける

集合の形が二種類あるとき、一つの関数の中で `if` を使って分けることもできます。
しかし、この関数は、引数の形で節を分けています。`#{}=S` と `#set{}=S` は、パターンそのものが形の判定になっています。読み手は、どの形がどう扱われるかを、節の見出しから読み取れます。

### 短いバケットを、そのまま線形に探す

レコード版は、ハッシュ表なので、同じバケットに入る要素は少数です。
そのため、バケットの中では、リストを先頭から調べるだけで十分です。大きな木構造を持ち込まなくても、ハッシュ表の性質で、探す量が抑えられています。

### 戻り値を真偽値に限る

どちらの節も、戻り値は `true` か `false` だけです。
値そのものは返さないので、呼び出し側は、ただ「入っているか」だけを判断できます。

## まとめ

`sets:is_element(3, sets:from_list([1, 2, 3]))` は、`true` を返します。
要素が無ければ、同じ関数が `false` を返します。
