---
title: "プロパティリストから、キーに対応する項目を探す"
description: "proplists:lookup/2 は、プロパティリストの中で最初に見つかったキーの項目を返す。アトムだけの項目は {Key, true} に直し、タプルはそのまま返す。見つからなければ none。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright 2000-2003 Richard Carlsson"
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/proplists.erl
lines: [144, 154]
function: "proplists:lookup/2"
difficulty: 2
format: 2
tags: ["データ構造", "イディオム", "標準ライブラリ"]
---
## ひとことで

`proplists:lookup/2` は、プロパティリスト（`[verbose, {timeout, 100}]` のような設定の並び）の中から、キーに対応する項目を探します。
見つかったときは、`{キー, 値}` の形のタプルを返します。見つからなければ `none` を返します。

## コード

::: code-group

```erlang:line-numbers=144 [日本語訳]
lookup(Key, [P | Ps]) ->
    if is_atom(P), P =:= Key ->
	    {Key, true};
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    %%  この場合、Key はアトムである必要はない
	    P;
       true ->
	    lookup(Key, Ps)
    end;
lookup(_Key, []) ->
    none.
```

```erlang:line-numbers=144 [原文]
lookup(Key, [P | Ps]) ->
    if is_atom(P), P =:= Key ->
	    {Key, true};
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    %% Note that <code>Key</code> does not have to be an atom in this case.
	    P;
       true ->
	    lookup(Key, Ps)
    end;
lookup(_Key, []) ->
    none.
```

:::

## 前提知識

- **プロパティリスト**: アトムや、タプルを並べたリストです。アトム `verbose` は「`verbose` が真」を表します。
- **`tuple_size/1` と `element/2`**: タプルの大きさを調べ、指定の位置の要素を取り出します。
- **`{Key, true}`**: アトムだけの項目を、キーと値の形に直した組です。
- **`none`**: 見つからなかったことを示す値です。

## 何をしているか

### 1. アトムの項目

```erlang:line-numbers=145
    if is_atom(P), P =:= Key ->
	    {Key, true};
```

項目 `P` がアトムで、キーと同じなら、`{Key, true}` を返します。アトムだけの項目は、「そのキーが真である」という意味だからです。

### 2. タプルの項目

```erlang:line-numbers=147
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    %% Note that <code>Key</code> does not have to be an atom in this case.
	    P;
```

項目が 1 つ以上の要素を持つタプルで、その 1 番目がキーと同じなら、タプル `P` をそのまま返します。コメントにあるとおり、キーはアトムでなくてもかまいません。

### 3. 一致しない項目

```erlang:line-numbers=150
       true ->
	    lookup(Key, Ps)
```

どちらにも当てはまらなければ、残りの項目を同じ方法で探します。

### 4. 最後まで見つからないとき

```erlang:line-numbers=153
lookup(_Key, []) ->
    none.
```

リストが空になったら、`none` を返します。

## ここがすごい

### 同じ形の結果を、アトムとタプルから作る

アトムの項目は、そのままでは `{キー, 値}` の形ではありません。この関数は、アトムの項目を `{Key, true}` に直して返します。
呼び出し側は、どちらの書き方で設定されていても、`{キー, 値}` の形だけを扱えます。

### 最初に見つかった項目で止まる

同じキーが複数あっても、この関数は最初の項目を返して終わります。探索を途中で打ち切るので、後ろの項目は読みません。
「最初の設定を優先する」という、プロパティリストの読み方を素直に表しています。

## まとめ

- 設定の並びから値を探すときは、書き方の違い（アトムか、タプルか）を、結果の形でそろえると扱いやすくなります。
- 最初に見つかった項目で止めると、探索の量を減らせます。
- 見つからない場合を `none` で表すと、呼び出し側が結果を確かめやすくなります。
