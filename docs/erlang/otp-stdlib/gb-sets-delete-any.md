---
title: "集合から要素を、無ければ何もせずに取り除く"
description: "gb_sets:delete_any/2 は、要素が集合にあれば取り除き、無ければ元の集合をそのまま返す。delete と違い、無い要素を指定してもエラーにならない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_sets.erl
lines: [547, 553]
function: "gb_sets:delete_any/2"
difficulty: 1
format: 2
tags: ["データ構造", "標準ライブラリ", "エラー処理"]
---
## ひとことで

`gb_sets:delete_any/2` は、集合から指定の要素を取り除きます。
要素が無くても、エラーにはなりません。その場合は、元の集合をそのまま返します。

## コード

```erlang:line-numbers=547
delete_any(Key, S) ->
    case is_member(Key, S) of
 	true ->
 	    delete(Key, S);
 	false ->
 	    S
    end.
```

## 前提知識

- **gb_sets**: 要素を平衡木に入れて持つ集合です。
- **`is_member/2`**: 要素が集合に入っているかを、`true` か `false` で返します。
- **`delete/2`**: 要素を取り除く関数です。要素が無いときは、エラーになる方式を取ります。
- **`case` 式**: 真偽値によって、二つの枝に分けます。

## 何をしているか

### 1. まず、要素が入っているかを調べる

```erlang:line-numbers=547
delete_any(Key, S) ->
    case is_member(Key, S) of
```

`delete_any/2` は、最初に `is_member/2` で、要素が集合にあるかを調べます。

### 2. 入っていれば、取り除く

```erlang:line-numbers=549
 	true ->
 	    delete(Key, S);
```

要素が見つかったときは、`delete/2` で取り除いた新しい集合を返します。

### 3. 入っていなければ、そのまま返す

```erlang:line-numbers=551
 	false ->
 	    S
    end.
```

要素が無いときは、元の集合 `S` をそのまま返します。取り除く作業は、しません。

## ここがすごい

### 「無いこと」を、エラーにしない

`delete/2` は、無い要素を消そうとすると、エラーになる場合があります。
`delete_any/2` は、その失敗を前もって調べ、無ければ何もしないと決めています。呼び出し側は、「入っているかもしれない要素」を、安心して消せます。

### 確かめてから消す、二段の流れ

まず調べ、次に消す、という二段の流れで書いています。
節の見た目は、`true` と `false` の二択で、読み手は、どちらの場合に何が起きるかをすぐに読み取れます。

### 元の集合を、そのまま返せる

無い場合は、新しい集合を作らず、元の `S` を返します。
余計なコピーが無く、結果が元と同じものなので、呼び出し側は、その違いを気にしなくて済みます。

### 集合の値は、常に新しいものになる

要素を取り除いた場合は、`delete/2` が新しい集合を返します。元の集合は、どちらの場合も変わりません。
Erlang の集合は、書き換えず、新しい値を作る形で扱われます。そのため、`delete_any` の結果を、元の集合と並べて比べても、安全です。

## まとめ

`gb_sets:delete_any(2, gb_sets:from_list([1, 2, 3]))` は、`1` と `3` だけを持つ集合を返します。
`gb_sets:delete_any(9, gb_sets:from_list([1, 2, 3]))` は、元の集合をそのまま返します。
