---
title: "プロパティリストに、キーが定義されているかを調べる"
description: "proplists:is_defined/2 は、プロパティリストに、フラグまたは組としてキーがあるかを true か false で返す。値の中身は見ず、キーの有無だけを調べる。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright 2000-2003 Richard Carlsson"
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/proplists.erl
lines: [188, 197]
function: "proplists:is_defined/2"
difficulty: 1
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`proplists:is_defined/2` は、プロパティリストの中に、指定のキーが定義されているかを調べます。
キーがフラグとして書かれている場合も、組として書かれている場合も、`true` になります。値の中身は見ません。

## コード

```erlang:line-numbers=188
is_defined(Key, [P | Ps]) ->
    if is_atom(P), P =:= Key ->
	    true;
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    true;
       true ->
	    is_defined(Key, Ps)
    end;
is_defined(_Key, []) ->
    false.
```

## 前提知識

- **プロパティリスト**: `verbose` のようなフラグと、`{timeout, 500}` のような組を、同じリストに混ぜて持つ形式です。
- **フラグ**: 値を持たないキーで、アトムだけで表されます。
- **`if` の複数の条件**: 条件を上から順に試し、最初に真になった枝を選びます。
- **`tuple_size/1` と `element/2`**: タプルの大きさを確かめ、先頭の要素を取り出すために使います。

## 何をしているか

### 1. 先頭の要素が、フラグとして Key と一致する

```erlang:line-numbers=189
    if is_atom(P), P =:= Key ->
	    true;
```

先頭の `P` がアトムで、`Key` と同じなら、キーはフラグとして定義されています。`true` を返します。

### 2. 先頭の要素が、Key を先頭に持つ組

```erlang:line-numbers=191
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    true;
```

先頭の `P` が、一つ以上の要素を持つタプルで、その先頭が `Key` と同じなら、組としてキーが定義されています。`true` を返します。
組の中の値は、見ていません。

### 3. どちらでもなければ、残りを調べる

```erlang:line-numbers=193
       true ->
	    is_defined(Key, Ps)
    end;
```

どちらにも当たらなければ、残りのリスト `Ps` に対して、同じ関数を呼びます。

### 4. 最後まで無ければ、false

```erlang:line-numbers=196
is_defined(_Key, []) ->
    false.
```

リストが空になったら、キーはどこにも無かったので、`false` を返します。

## ここがすごい

### 値を見ない、存在だけの判定

`get_value/3` が値を取り出すのに対して、この関数は、キーが「ある」かだけを答えます。
値を取り出す必要がない場合は、この関数を使うと、判断が一つに絞れます。

### フラグと組を、同じ判定で扱う

フラグは `P =:= Key`、組は `element(1, P) =:= Key` で判定します。
二つの書き方を、一つの `if` の中に並べることで、呼び出し側は、キーが書かれた形を気にせず使えます。

### 見つけたら、残りを見ない

キーが見つかった時点で `true` を返します。後ろの要素は見ません。
プロパティリストに同じキーが複数あっても、存在の判定には一つで十分です。

## まとめ

`proplists:is_defined(verbose, [verbose, {timeout, 500}])` は、`true` を返します。
`proplists:is_defined(retries, [verbose, {timeout, 500}])` は、`false` を返します。
