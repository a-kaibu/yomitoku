---
title: "マップから、指定したキーをまとめて取り除く"
description: "maps:without/2 は、キーのリストに含まれるキーを、マップから順に取り除いた新しいマップを返す。キーが無くても失敗せず、元のマップは変えない。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2013-2025. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/maps.erl
lines: [1139, 1142]
function: "maps:without/2"
difficulty: 1
format: 2
tags: ["データ構造", "標準ライブラリ", "関数型"]
---
## ひとことで

`maps:without/2` は、マップから、キーのリストに入っているキーをまとめて取り除きます。
取り除いた結果は、新しいマップとして返します。元のマップは変わりません。

## コード

```erlang:line-numbers=1139
without(Ks, M) when is_list(Ks), is_map(M) ->
    lists:foldl(fun maps:remove/2, M, Ks);
without(Ks, M) ->
    error_with_info(error_type(M), [Ks,M]).
```

## 前提知識

- **マップ**: キーと値の組を持つデータ構造です。変更は、新しいマップを作る形で行われます。
- **`lists:foldl/3`**: リストを先頭から順に処理し、途中の結果を持ち回る関数です。
- **`maps:remove/2`**: マップから一つのキーを取り除き、新しいマップを返す関数です。キーが無くても、失敗しません。
- **`fun maps:remove/2`**: 既存の関数を、値として渡す書き方です。`foldl` の関数に、そのまま使えます。

## 何をしているか

### 1. 入口で、キーのリストとマップの形を確かめる

```erlang:line-numbers=1139
without(Ks, M) when is_list(Ks), is_map(M) ->
    lists:foldl(fun maps:remove/2, M, Ks);
```

`without/2` は、`Ks` がリストで、`M` がマップであることを確かめます。
条件に合うときは、`lists:foldl/3` で、キーを一つずつ取り除いていきます。

### 2. 取り除きを、キーの数だけ繰り返す

```erlang:line-numbers=1140
    lists:foldl(fun maps:remove/2, M, Ks);
```

`foldl` は、最初のマップ `M` に対して、`maps:remove/2` を `Ks` の要素ごとに適用します。
各段階で、一つのキーを取り除いた新しいマップができ、それが次の段階に渡されます。

### 3. 形が正しくなければ、型のエラー

```erlang:line-numbers=1141
without(Ks, M) ->
    error_with_info(error_type(M), [Ks,M]).
```

`Ks` がリストでない、あるいは `M` がマップでないときは、型のエラーを投げる補助関数を呼びます。

## ここがすごい

### 繰り返しを、畳み込みに任せる

複数のキーを順に消す処理を、`foldl` の一行で書いています。
消す処理そのものは、`maps:remove/2` に任せています。ループの書き方を自分で作らないので、読み手は、「キーを一つずつ消す」という考えだけで理解できます。

### 無いキーを消しても、失敗しない

`maps:remove/2` は、キーが存在しなくても、エラーになりません。
そのため、`without/2` に、マップに無いキーが混ざっていても、その分は何もせず、残りのキーを消します。「消したいキーが無い」は、この関数にとって正常な状態です。

### 元のマップを変えない

Erlang のマップは、変更できません。
`foldl` が作る途中のマップは、どれも新しいものです。元のマップは、呼び出しの前と同じ内容のままです。

## まとめ

`maps:without([a, c], #{a => 1, b => 2, c => 3})` は、`#{b => 2}` を返します。
取り除いた `a` と `c` だけが消え、`b` は残ります。
