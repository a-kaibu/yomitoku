---
title: "集合の要素を、リストとして取り出す"
description: "sets:to_list/1 は、集合の要素をリストにする。Erlang の集合は、map か、専用の record のどちらかで表され、この関数は、それぞれに応じた取り出し方を選ぶ。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [374, 377]
function: "sets:to_list/1"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`sets:to_list/1` は、集合の要素を一つのリストとして返します。
集合の表し方が二種類あるので、この関数は、その違いを内側で吸収しています。

## コード

```erlang:line-numbers=374
to_list(#{}=S) ->
    maps:keys(S);
to_list(#set{} = S) ->
    fold(fun (Elem, List) -> [Elem|List] end, [], S).
```

## 前提知識

- **集合（set）**: 要素の重複を持たず、どの要素があるかだけを表すデータ構造です。`sets` モジュールは、その操作をまとめています。
- **map 版の集合**: 要素をキーにした map で表す形です。値は使わず、キーだけを要素として持ちます。
- **`#set{}` 版の集合**: `sets` モジュールが定義する record の形です。古くから使われている表し方です。
- **`maps:keys/1`**: map のキーを、リストとして取り出す関数です。

## 何をしているか

### 1. map 版は、キーをそのまま返す

```erlang:line-numbers=374
to_list(#{}=S) ->
    maps:keys(S);
```

map の形の集合なら、`maps:keys/1` でキーを取り出します。キーが集合の要素なので、その一覧が結果になります。

### 2. record 版は、折り畳みで組み立てる

```erlang:line-numbers=376
to_list(#set{} = S) ->
    fold(fun (Elem, List) -> [Elem|List] end, [], S).
```

`#set{}` の形の集合では、`fold/3` を使い、要素を一つずつ先頭に積んでいきます。
途中の結果は、リストの先頭に入るので、順番は元の並びと逆になります。結果を返す前に、逆順にする処理は行いません。

## ここがすごい

### 表し方の違いを、外に出さない

呼び出し側は、集合が map か record のどちらなのかを、知らなくて済みます。
どちらの形で作られた集合にも、同じ関数が使えます。この工夫によって、古い形の集合を使うコードも、変えずに動きます。

### map のキーを、そのまま使う

map 版の集合は、要素がキーになっています。
だから、`maps:keys/1` を一度呼ぶだけで、結果が得られます。余分な変換は要りません。

### 順番を、保証しない

集合は、要素の順番を意味しません。
この関数の戻り値の順番は、表し方によって違います。並べた結果が欲しいときは、`lists:sort/1` で並べてから使います。

### 集合を作り直すときの土台として使う

`to_list/1` で得たリストは、後で別の集合を作るときや、ソートや検索に使うときの、中間の形として役立ちます。
集合の型を保ったまま処理したいなら、`sets` モジュールの関数を使い、リストに直すのは、外へ出すときだけにするのが、読みやすい使い方です。

## まとめ

`sets:to_list(sets:from_list([b, a]))` は、`a` と `b` を含むリストを返します。
リストの順番は、集合の表し方によって決まり、必ず昇順になるとは限りません。
