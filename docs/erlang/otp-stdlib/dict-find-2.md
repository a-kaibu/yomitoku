---
title: "辞書から、キーの値を例外を使わずに取り出す"
description: "dict:find/2 は、キーに対応する値を {ok, Value} で返し、無ければ error を返す。dict:fetch/2 の例外版と対になる、戻り値で有無を伝える関数。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/dict.erl
lines: [256, 263]
function: "dict:find/2"
difficulty: 2
format: 2
tags: ["ハッシュ", "データ構造", "エラー処理"]
---
## ひとことで

`dict:find/2` は、辞書からキーの値を探します。
見つかれば `{ok, Value}`、無ければ `error` を返します。例外は投げません。キーが無いことが、普通に起こり得る処理で使う関数です。

## コード

```erlang:line-numbers=256
find(Key, D) ->
    Slot = get_slot(D, Key),
    Bkt = get_bucket(D, Slot),
    find_val(Key, Bkt).

find_val(K, [?kv(K,Val)|_]) -> {ok,Val};
find_val(K, [_|Bkt]) -> find_val(K, Bkt);
find_val(_, []) -> error.
```

## 前提知識

- **スロットとバケット**: 辞書は、キーからスロットの番号を求め、そのバケット（キーと値の組のリスト）を調べます。
- **`get_slot/2` と `get_bucket/2`**: キーの場所を求め、バケットを取り出す補助関数です。
- **`?kv(K, Val)`**: キーと値の組を表すマクロです。パターンの中で、キーと値を一緒に分けるために使われています。
- **`{ok, Val}` と `error`**: 見つかった場合と見つからない場合を、戻り値の形で区別する約束です。

## 何をしているか

### 1. キーのバケットを探す

```erlang:line-numbers=256
find(Key, D) ->
    Slot = get_slot(D, Key),
    Bkt = get_bucket(D, Slot),
    find_val(Key, Bkt).
```

`find/2` は、`get_slot` でキーの場所を求め、`get_bucket` でそのバケットを取り出します。ここまでは、`fetch/2` と同じ手順です。
バケットの中から値を探すのは、`find_val/2` に任せます。

### 2. 同じキーが見つかれば、{ok, Val}

```erlang:line-numbers=261
find_val(K, [?kv(K,Val)|_]) -> {ok,Val};
```

バケットの先頭の組のキーが `K` と一致すれば、その値を `{ok, Val}` で返します。

### 3. 違うキーなら、残りを探す

```erlang:line-numbers=262
find_val(K, [_|Bkt]) -> find_val(K, Bkt);
```

一致しなければ、残りのバケットに対して同じ関数を呼びます。

### 4. 最後まで無ければ、error

```erlang:line-numbers=263
find_val(_, []) -> error.
```

バケットが空になったら、キーはこの辞書に無かったので、`error` を返します。

## ここがすごい

### 例外を使わず、戻り値で伝える

`fetch/2` は、無いときに例外を投げます。
`find/2` は、`{ok, Val}` と `error` という二つの形で、結果を返します。呼び出し側は、`case` で両方を扱えるので、例外を捕まえる構文を使う必要がありません。

### 同じ探し方を、もう一度書かない

`find/2` の探し方は、`fetch/2` と同じ、「スロットを求め、バケットを調べる」流れです。
違うのは、見つからないときの扱いだけです。その違いを、補助関数の最後の節で表しています。

### `{ok, _}` の形で、成功を明確にする

`{ok, Val}` の形は、Erlang の標準的な約束です。
値そのものを返すと、値が `error` という文字と同じだったときに区別がつきません。`{ok, _}` で包むことで、この曖昧さを避けています。

## まとめ

`dict:find(a, dict:store(a, 1, dict:new()))` は、`{ok, 1}` を返します。
`dict:find(b, dict:new())` は、`error` を返します。
