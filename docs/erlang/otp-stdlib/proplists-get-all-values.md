---
title: "プロパティリストから、同じキーの値を全部集める"
description: "proplists:get_all_values/2 は、プロパティリストの中で同じキーを持つ値をすべて集めて、リストにする。単独のアトムは true として扱い、タプルの 2 要素目を値にする。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright 2000-2003 Richard Carlsson"
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/proplists.erl
lines: [247, 261]
function: "proplists:get_all_values/2"
difficulty: 2
format: 2
tags: ["データ構造", "イディオム", "標準ライブラリ"]
---
## ひとことで

`proplists:get_all_values/2` は、プロパティリスト（設定を並べたリスト）の中から、同じキーに対応する値をすべて集めます。
`get_value/2` が最初の 1 つだけを返すのに対して、こちらはキーの出現をすべて集めます。

## コード

```erlang:line-numbers=247
get_all_values(Key, [P | Ps]) ->
    if is_atom(P), P =:= Key ->
	    [true | get_all_values(Key, Ps)];
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    case P of
		{_, Value} ->
		    [Value | get_all_values(Key, Ps)];
		_ ->
		    get_all_values(Key, Ps)
	    end;
       true ->
	    get_all_values(Key, Ps)
    end;
get_all_values(_Key, []) ->
    [].
```

## 前提知識

- **プロパティリスト**: `[verbose, {timeout, 100}, {timeout, 200}]` のように、アトムやタプルを並べたリストです。
- **アトムだけの要素**: `verbose` のように、アトムだけの要素は「そのキーがある（真）」を表します。
- **`{Key, Value}` の形**: 2 要素のタプルは、キーと値の組として扱います。
- **`if` の条件**: `is_atom(P), P =:= Key` のように、`,` で書いた条件はすべて真のときに成り立ちます。
- **`[true | ...]`**: アトムだけの要素は、値として `true` を集めます。

## 何をしているか

### 1. アトムだけの要素

```erlang:line-numbers=248
    if is_atom(P), P =:= Key ->
	    [true | get_all_values(Key, Ps)];
       tuple_size(P) >= 1, element(1, P) =:= Key ->
```

要素 `P` がアトムで、キーと同じなら、値として `true` を結果に入れます。残りの要素の処理を、再帰で続けます。

### 2. タプルの要素

```erlang:line-numbers=250
       tuple_size(P) >= 1, element(1, P) =:= Key ->
	    case P of
		{_, Value} ->
		    [Value | get_all_values(Key, Ps)];
		_ ->
		    get_all_values(Key, Ps)
	    end;
```

要素が 1 つ以上の要素を持つタプルで、その 1 番目がキーと同じなら、`{_, Value}` の形かを確かめます。2 要素のタプルなら、その値を結果に入れます。2 要素でなければ、捨てて続けます。

### 3. それ以外の要素

```erlang:line-numbers=257
       true ->
	    get_all_values(Key, Ps)
    end;
```

キーと関係ない要素は、結果に入れずに次へ進みます。

### 4. 空のリスト

```erlang:line-numbers=260
get_all_values(_Key, []) ->
    [].
```

リストが空になったら、空のリストを返して終わります。

## ここがすごい

### 同じ関数で、2 種類の書き方を受け付ける

プロパティリストは、`verbose` と `{verbose, true}` のどちらの形でも書けます。この関数は、アトムの形とタプルの形を、同じ再帰の中で両方扱います。
利用者は書き方を選べて、取り出す側は 1 つの関数で済みます。

### 途中で条件を分けて、残りの要素を捨てる

キーに合わない要素は、再帰の中でそのまま次へ送られます。全部の要素を 1 回ずつ見る、単純な走査です。
結果が見つかった順番のまま集まるので、元のリストの順番も保たれます。

## まとめ

- プロパティリストは、アトムとタプルの両方の書き方を、同じ規則で読み取れます。
- 同じキーを全部集めるには、先頭から 1 回ずつ見て、一致するものだけを積めば十分です。
- 順番を保つ単純な走査は、読みやすく、結果の予測もしやすいです。
