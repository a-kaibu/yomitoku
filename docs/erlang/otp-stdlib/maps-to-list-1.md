---
title: "map の中身を、キーと値の組のリストとして取り出す"
description: "maps:to_list/1 は、map のすべてのキーと値を、組のリストにする。map を直接渡すときと、イテレータを渡すときで、取り出し方を分ける。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [529, 536]
function: "maps:to_list/1"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "イディオム"]
---
## ひとことで

`maps:to_list/1` は、map のキーと値をすべて取り出し、`{Key, Value}` の組のリストにします。
map だけでなく、イテレータも受け取れるので、同じ関数で二つの場合を扱えます。

## コード

```erlang:line-numbers=529
to_list(Map) when is_map(Map) ->
    to_list_internal(erts_internal:map_next(0, Map, []));
to_list(Iter) ->
    try to_list_from_iterator(next(Iter))
    catch
        error:_ ->
            error_with_info({badmap, Iter}, [Iter])
    end.
```

## 前提知識

- **map**: キーと値の対を、Erlang の値として持つデータ構造です。`#{a => 1}` のように書きます。
- **イテレータ**: map の中を、一つずつ順に取り出すための値です。`maps:iterator/1` で作ります。
- **`erts_internal:map_next/3`**: map の中身を、ランタイムの内部から一つずつ取り出す関数です。この記事では中身には踏み込みません。
- **`error_with_info/2`**: 例外を、理由と引数の情報を付けて投げる補助関数です。

## 何をしているか

### 1. map を直接渡されたとき

```erlang:line-numbers=529
to_list(Map) when is_map(Map) ->
    to_list_internal(erts_internal:map_next(0, Map, []));
```

引数が map なら、内部の関数で、先頭から中身をすべて取り出します。
結果は、キーと値の組のリストです。

### 2. イテレータを渡されたとき

```erlang:line-numbers=531
to_list(Iter) ->
    try to_list_from_iterator(next(Iter))
```

引数がイテレータなら、`next/1` で次の要素を取り出し、リストにまとめます。
途中で例外になったら、次の節の処理に移ります。

### 3. どちらでもないときは、例外にする

```erlang:line-numbers=533
    catch
        error:_ ->
            error_with_info({badmap, Iter}, [Iter])
    end.
```

イテレータとして読むのに失敗したら、`badmap` の例外を投げます。
引数に、何が渡されたかを、例外の中に残します。

## ここがすごい

### 一つの名前で、二つの入力を受ける

map とイテレータは、どちらも「中身を順に読む」ための値です。
この関数は、両方を同じ名前で受け取り、中で取り出し方を分けています。呼び出し側は、入力の種類を覚えなくて済みます。

### 失敗は、同じ形の例外にまとめる

イテレータの読み取りに失敗したら、`error:_` をまとめて捕まえ、`badmap` の例外を投げ直します。
どの段階で壊れていても、呼び出し側は同じ例外の形で受け取れます。

### 取り出しは、ランタイムに任せる

map の中身を、Erlang のコードで一つずつ読むのではありません。
`erts_internal:map_next/3` を使い、ランタイムの仕組みで取り出します。速さを、ランタイムの実装に任せている形です。

## まとめ

`maps:to_list(#{a => 1, b => 2})` は、`[{a, 1}, {b, 2}]` を返します。
map の中身の順番は、必ずしも昇順にはなりません。並べたいときは、`lists:sort/1` を使います。
