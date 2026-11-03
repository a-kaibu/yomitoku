---
title: "プロパティリストから、キーに対応する値を取り出す"
description: "proplists:get_value/3 は、キーと値の組やフラグを混ぜて持つプロパティリストから、値を探す。フラグのように値の無い要素は true とみなし、形が合わない組では探すのを止める。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright 2000-2003 Richard Carlsson"
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/proplists.erl
lines: [222, 237]
function: "proplists:get_value/3"
difficulty: 2
format: 2
tags: ["データ構造", "標準ライブラリ", "イディオム"]
---
## ひとことで

`proplists:get_value/3` は、プロパティリストから、キーに対応する値を取り出します。
プロパティリストは、`{Key, Value}` の組と、`verbose` のような単独のアトムを、同じリストに混ぜて持つ形式です。見つからなければ、三つ目の引数 `Default` を返します。

## コード

::: code-group

```erlang:line-numbers=222 [日本語訳]
get_value(Key, [P | Ps], Default) ->
    if is_atom(P), P =:= Key ->
	    true;
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    case P of
		{_, Value} ->
		    Value;
		_ ->
		    %% 次の要素は探さず、ここで止める
		    Default
	    end;
       true ->
	    get_value(Key, Ps, Default)
    end;
get_value(_Key, [], Default) ->
    Default.
```

```erlang:line-numbers=222 [原文]
get_value(Key, [P | Ps], Default) ->
    if is_atom(P), P =:= Key ->
	    true;
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    case P of
		{_, Value} ->
		    Value;
		_ ->
		    %% Don't continue the search!
		    Default
	    end;
       true ->
	    get_value(Key, Ps, Default)
    end;
get_value(_Key, [], Default) ->
    Default.
```

:::

## 前提知識

- **プロパティリスト**: Erlang の設定や、オプションを表す慣習的な形です。`[verbose, {timeout, 500}]` のように書きます。
- **フラグ**: 値の無いキーを、アトムだけで表したものです。`verbose` が書かれていれば、その名前は「真」として扱えます。
- **`if` 式の複数節**: `if` は、条件の並びで最初に真になった節を選びます。
- **`tuple_size/1` と `element/2`**: タプルの大きさを調べ、指定の位置の要素を取り出します。
- **`Default`**: 見つからなかったときの戻り値です。引数で渡すので、呼び出し側が決められます。

## 何をしているか

### 1. 先頭の要素がフラグのとき

```erlang:line-numbers=223
    if is_atom(P), P =:= Key ->
	    true;
```

先頭の `P` がアトムで、`Key` と同じなら、`true` を返します。`verbose` を探すと、`true` が返るというわけです。

### 2. 先頭の要素がキーの組のとき

```erlang:line-numbers=225
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    case P of
		{_, Value} ->
		    Value;
		_ ->
		    %% Don't continue the search!
		    Default
	    end;
```

`P` がタプルで、最初の要素が `Key` と同じなら、ここで結果を決めます。
- `{_, Value}` の形なら、その `Value` を返します。
- それ以外の形なら、`Default` を返します。

### 3. 関係のない要素のとき

```erlang:line-numbers=233
       true ->
	    get_value(Key, Ps, Default)
    end;
```

`P` が `Key` と違うなら、残りのリストで同じ関数を呼びます。

### 4. 最後まで見つからないとき

```erlang:line-numbers=236
get_value(_Key, [], Default) ->
    Default.
```

リストが空になったら、`Default` を返します。

## ここがすごい

### フラグと組を、一つの判定で扱う

プロパティリストは、形が二種類混ざっています。
この関数は、`if` の節を順に試すことで、フラグの場合と、組の場合を一つの流れで処理します。呼び出し側は、どちらの形かを気にせず、キーだけを渡せます。

### 形が合わない組では、探すのを止める

最後のタプルの節は、キーは合っているのに、組の形が `{_, Value}` でないとき、`Default` を返して止まります。
コメントに「探索を続けない」とあるとおり、同じキーの後ろの要素は見ません。見つけたキーの扱いを、一つに決めるためです。

### 戻り値を一つの形に決めておく

見つかったときは値そのもの、見つからなかったときは `Default` です。
`{ok, Value}` のように包まないので、呼び出し側は、既定値を渡すだけで済みます。

## まとめ

`proplists:get_value(timeout, [verbose, {timeout, 500}], 0)` は、`500` を返します。
`proplists:get_value(verbose, [verbose, {timeout, 500}], false)` は、`true` を返します。
