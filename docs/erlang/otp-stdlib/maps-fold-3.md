---
title: "map の全要素を、関数で一つずつ畳み込む"
description: "maps:fold/3 は、map のキーと値を、関数で一つずつ受け取りながら、途中の値に積み上げる。map のときは直接、イテレータのときはその続きを読む。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [885, 886]
function: "maps:fold/3"
difficulty: 2
format: 2
tags: ["データ構造", "関数型", "標準ライブラリ"]
---
## ひとことで

`maps:fold/3` は、map の中のキーと値を、一つずつ関数に渡します。
関数は、キーと値と途中の結果を受け取り、次の途中の結果を返します。最後の途中の結果が、全体の結果になります。

## コード

```erlang:line-numbers=885
fold(Fun, Init, Map) when is_map(Map), is_function(Fun, 3) ->
    fold_1(Fun, Init, next(iterator(Map)), undefined);
```

## 前提知識

- **畳み込み（fold）**: 要素を順に処理しながら、途中の結果を次に渡していく操作です。
- **`Fun/3`**: キー、値、途中の結果の三つを受け取る関数です。`is_function(Fun, 3)` で、その形を確かめます。
- **`Init`**: 最初の途中の結果です。合計なら `0`、組のリストを作るなら `[]` を渡します。
- **イテレータ**: map の続きを、一つずつ読むための値です。`fold/3` は、map と、イテレータのどちらも受け取れます。

## 何をしているか

### 1. map が渡されたら、最初の要素から始める

```erlang:line-numbers=885
fold(Fun, Init, Map) when is_map(Map), is_function(Fun, 3) ->
    fold_1(Fun, Init, next(iterator(Map)), undefined);
```

引数が map で、関数が三引数なら、`next/1` で最初の要素を取り出し、`fold_1/4` に渡します。
最初の途中の結果は `Init` です。

### 2. イテレータのときは、印で失敗を見分ける

```erlang:line-numbers=887
fold(Fun, Init, Iter) when is_function(Fun, 3) ->
    ErrorTag = make_ref(),
```

イテレータを渡された場合は、エラーを捕まえるための印 `ErrorTag` を作り、その印を使って読み進めます。
読み取りの途中で失敗すれば、`badmap` の例外を投げます。

### 3. 形が違えば、例外にする

```erlang:line-numbers=894
fold(Fun, Init, Map) ->
    badarg_with_info([Fun, Init, Map]).
```

map でもイテレータでもない引数、または三引数ではない関数が渡されたときは、`badarg` の例外を投げます。

## ここがすごい

### 途中の結果を、持ち回るだけ

`fold_1/4` は、要素を読むたびに、関数の結果を次の `Acc` として渡します。
結果を保存する変数は必要ありません。値を持ち回る形なので、Erlang の値の性質にそのまま合っています。

### 同じ関数で、map とイテレータを扱う

map を直接渡しても、イテレータを渡しても、同じ `fold/3` で処理できます。
イテレータは、途中から読み直せるので、大きな map を分割して扱うときに役立ちます。

### 入り口で、形を確かめる

`is_function(Fun, 3)` と `is_map(Map)` のガードで、引数の形を先に確かめます。
誤った引数は、中に入る前に、はっきりした例外になります。

## まとめ

`maps:fold(fun(_K, V, Acc) -> V + Acc end, 0, #{a => 1, b => 2})` は、`3` を返します。
キーを使わず、値だけを足し合わせる例です。
