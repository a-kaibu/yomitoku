---
title: "集合から要素を取り除く、表の種類に合わせた方法"
description: "sets:del_element/2 は、マップの集合ではキーを消し、レコードの集合では所属するバケットを調べてから、そのバケットから要素を消す。無ければ集合をそのまま返す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [456, 467]
function: "sets:del_element/2"
difficulty: 3
format: 2
tags: ["データ構造", "ハッシュ", "イディオム"]
---
## ひとことで

`sets:del_element/2` は、集合から要素を一つ取り除きます。
集合がマップで作られている場合は、マップからキーを消すだけです。レコードで作られている場合は、ハッシュ表の該当バケットを探し、そこにあるときだけ取り除きます。

## コード

```erlang:line-numbers=456
del_element(E, #{}=S) ->
    maps:remove(E, S);
del_element(E, #set{}=S0) ->
    Slot = get_slot(S0, E),
    Bkt = get_bucket(S0, Slot),
    case lists:member(E, Bkt) of
        false ->
            S0;
        true ->
            S1 = update_bucket(S0, Slot, lists:delete(E, Bkt)),
            maybe_contract(S1, 1)
    end.
```

## 前提知識

- **マップの集合**: 要素をキーとして持つマップです。`maps:remove/2` で、キーを消せます。
- **レコードの集合**: `#set{}` の形で、ハッシュ表のバケットを持つ集合です。
- **`get_slot/2` と `get_bucket/2`**: 要素の場所を求め、そのバケットを取り出す補助関数です。
- **`update_bucket/3`**: バケットを新しいものに差し替える補助関数です。
- **`maybe_contract/2`**: 要素が減ったときに、表を縮められるかを確かめる補助関数です。

## 何をしているか

### 1. マップの集合なら、キーを消す

```erlang:line-numbers=456
del_element(E, #{}=S) ->
    maps:remove(E, S);
```

集合がマップなら、`maps:remove/2` で要素のキーを消します。要素が無くても、この関数はエラーになりません。

### 2. レコードの集合なら、バケットを探す

```erlang:line-numbers=458
del_element(E, #set{}=S0) ->
    Slot = get_slot(S0, E),
    Bkt = get_bucket(S0, Slot),
    case lists:member(E, Bkt) of
```

レコードの集合では、まず要素の場所を求めます。次に、その場所のバケットを取り出し、`lists:member/2` で要素が入っているかを調べます。

### 3. 入っていなければ、そのまま返す

```erlang:line-numbers=462
        false ->
            S0;
        true ->
```

要素が無ければ、集合 `S0` を変えずに返します。

### 4. 入っていれば、バケットから消して、表を整える

```erlang:line-numbers=465
            S1 = update_bucket(S0, Slot, lists:delete(E, Bkt)),
            maybe_contract(S1, 1)
```

要素があれば、バケットから `lists:delete/2` で一つだけ消し、`update_bucket/3` で差し替えます。
その後、`maybe_contract/2` で、表を縮める必要があるかを確かめます。

## ここがすごい

### 集合の種類で、消し方を分ける

マップの集合は、キーを消すだけで済みます。レコードの集合は、ハッシュ表の仕組みを使うので、場所を探す手間が必要です。
二つの形を、引数のパターンで振り分けるので、呼び出し側は、どちらの形かを気にせず使えます。

### 無い要素は、何もしない

要素が無い場合は、バケットを書き換えず、集合をそのまま返します。
無駄な書き換えを避けるので、表の形が変わらず、後の処理にも影響がありません。

### 消した後の、表の縮小

要素が減ると、ハッシュ表が大きすぎることがあります。
`maybe_contract/2` は、その判定を行う補助関数です。消す仕事と、表を縮める判断を、別の関数に分けています。

## まとめ

`sets:del_element(2, sets:from_list([1, 2, 3]))` は、`1` と `3` だけを持つ集合を返します。
`sets:del_element(9, sets:from_list([1, 2, 3]))` は、元の集合をそのまま返します。
