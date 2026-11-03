---
title: "辞書から、キーに対応する値を取り出す"
description: "dict:fetch/2 は、キーのスロットとバケットを求め、バケットの中から同じキーの値を探す。見つからなければ badarg の例外を投げる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/dict.erl
lines: [225, 231]
function: "dict:fetch/2"
difficulty: 2
format: 2
tags: ["ハッシュ", "データ構造", "エラー処理"]
---
## ひとことで

`dict:fetch/2` は、辞書からキーに対応する値を取り出します。
キーがなければ、`badarg` という例外を投げます。値が必ずあると前提している呼び出しに向いた関数です。

## コード

```erlang:line-numbers=225
fetch(Key, D) ->
    Slot = get_slot(D, Key),
    Bkt = get_bucket(D, Slot),
    try fetch_val(Key, Bkt)
    catch
	badarg -> erlang:error(badarg, [Key, D])
    end.
```

## 前提知識

- **スロットとバケット**: 辞書は、キーからスロットという番号を求め、そのスロットのバケットを調べます。バケットは、キーと値の組のリストです。
- **`get_slot/2`**: キーから、スロットの番号を求めます。
- **`get_bucket/2`**: スロットの番号から、バケットを取り出します。
- **`try ... catch`**: 例外を捕まえる構文です。ここでは、内側の `throw(badarg)` を捕まえて、`erlang:error/2` に変えています。
- **`erlang:error(badarg, [Key, D])`**: 例外を投げる関数です。第二引数に、呼び出し時の引数を入れて、どの呼び出しで失敗したかを残します。

## 何をしているか

### 1. キーのバケットを求める

```erlang:line-numbers=225
fetch(Key, D) ->
    Slot = get_slot(D, Key),
    Bkt = get_bucket(D, Slot),
```

`get_slot` でキーの場所を求め、`get_bucket` でそのバケットを取り出します。ここまでは、キーの場所の計算だけです。値を探すのは、次の段階です。

### 2. バケットの中を順に調べる

```erlang:line-numbers=233
fetch_val(K, [?kv(K,Val)|_]) -> Val;
fetch_val(K, [_|Bkt]) -> fetch_val(K, Bkt);
fetch_val(_, []) -> throw(badarg).
```

`fetch_val/2` は、バケットのリストを先頭から見ていきます。キーが一致した組があれば、その値を返します。一致しなければ、残りのリストに対して同じ関数を呼びます。
リストの終わりまで来たときは、`throw(badarg)` で、見つからなかったことを知らせます。

### 3. 例外の形を整える

```erlang:line-numbers=228
    try fetch_val(Key, Bkt)
    catch
	badarg -> erlang:error(badarg, [Key, D])
    end.
```

`fetch_val/2` が投げた `throw` を、`try` の `catch` で受けます。受けたら、`erlang:error/2` に変えて投げ直します。
`throw` は、Erlang では制御の流れに使う例外です。エラーとして扱いたいときは、`error` に変えます。ここでは、呼び出し元に「キーが無い」というエラーとして見せています。

## ここがすごい

### 内側は throw、外側は error

`fetch_val/2` は、見つからないときに `throw` で抜けます。こうすると、再帰の途中からでも、一度で抜けられます。
外側の `fetch/2` で `error` に変えるのは、呼び出し元が「キーが無いのは誤り」として扱えるようにするためです。内側の仕組みと、外側に見せる形を分けています。

### 引数を例外に残す

`erlang:error(badarg, [Key, D])` の第二引数は、エラーの詳細を表すリストです。
ここには、キーと辞書を入れています。失敗したときに、どのキーで、どの辞書を使ったかが、エラーの情報に残ります。

### 見つからないかもしれない場合は、別の関数を使う

キーが無いことが普通にある処理では、この関数は向きません。
その場合は、`dict:find/2` のように、`{ok, Value}` と `error` を返す関数を使うと、例外を使わずに分岐できます。

## まとめ

`dict:fetch(a, dict:store(a, 1, dict:new()))` は、`1` を返します。
キーがない辞書に `fetch` を使うと、`badarg` のエラーになります。
