---
title: "タプルの指定した位置の値で、リストを安定に並べ替える"
description: "lists:keysort/2 は、タプルの指定した位置の値を使って、リストを並べ替える。並べ替えは安定で、同じ値の要素は元の順序を保つ。先頭の数件を比べる細かい分岐を含む。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [1517, 1535]
function: "lists:keysort/2"
difficulty: 3
format: 2
tags: ["ソート", "標準ライブラリ", "アルゴリズム"]
---
## ひとことで

`lists:keysort/2` は、タプルのリストを、指定した位置の値で昇順に並べ替えます。
並べ替えは安定です。同じ値を持つ要素は、元のリストでの順番を保ちます。

## コード

```erlang:line-numbers=1517
keysort(I, L) when is_integer(I), I > 0 ->
    case L of
	[] -> L;
	[_] -> L;
	[X, Y | T] ->
	    case {element(I, X), element(I, Y)} of
		{EX, EY} when EX =< EY ->
		    case T of
			[] ->
			    L;
			[Z] ->
			    case element(I, Z) of
				EZ when EY =< EZ ->
				    L;
				EZ when EX =< EZ ->
				    [X, Z, Y];
				_EZ ->
				    [Z, X, Y]
			    end;
```

## 前提知識

- **キー位置 `I`**: タプルのどの位置の値で並べるかを、先頭から数えた番号で指定します。`1` は先頭の要素です。
- **安定な並べ替え**: 比べた値が同じとき、元の順番のまま並ぶ性質です。
- **`element/2`**: タプルの指定した位置の要素を取り出す関数です。
- **空と一要素のリスト**: 並べ替える必要がないので、そのまま返します。

## 何をしているか

### 1. 位置の指定が正しいかを確かめる

```erlang:line-numbers=1517
keysort(I, L) when is_integer(I), I > 0 ->
```

`I` が正の整数のときだけ、この節が選ばれます。
位置が `0` 以下のときは、別の節に当たるか、例外になります。

### 2. 空と一要素の場合は、そのまま返す

```erlang:line-numbers=1518
    case L of
	[] -> L;
	[_] -> L;
```

空のリストや、要素が一つのリストは、並べ替える相手がいません。そのまま返します。

### 3. 先頭の二要素を、比べて向きを決める

```erlang:line-numbers=1521
	[X, Y | T] ->
	    case {element(I, X), element(I, Y)} of
		{EX, EY} when EX =< EY ->
```

先頭の `X` と `Y` から、キーの値 `EX` と `EY` を取り出し、比べます。
`EX =< EY` なら、二つの並びは正しい順番です。その場合は、三つ目以降の要素を見て、続きを決めます。

### 4. 三つ目までの並びを、組み替える

```erlang:line-numbers=1524
		    case T of
			[] ->
			    L;
			[Z] ->
			    case element(I, Z) of
				EZ when EY =< EZ ->
				    L;
				EZ when EX =< EZ ->
				    [X, Z, Y];
				_EZ ->
				    [Z, X, Y]
			    end;
```

残りの要素 `Z` のキーと比べて、三つの要素の並びを組み替えます。
`[X, Z, Y]` や `[Z, X, Y]` のように、二つの要素の順番を入れ替える場合があります。`_EZ` の節は、残りを正しい順番で並べる場合です。

## ここがすごい

### 先頭の数件で、無駄な比較を減らす

リストの先頭から数件だけを、特別な分岐で処理しています。
既に並んでいる部分は、そのまま残すので、余計な入れ替えが起きません。

### 同じキーの順番を、元のまま保つ

`EX =< EY` の比較は、同じ値のときに、先に出てきた要素を前に置きます。
だから、同じキーを持つ要素は、元の順番を守ります。この安定さは、複数の条件で並べ替えるときに役立ちます。

### 比較の節を、読みやすく並べる

キーの大小で場合分けをし、一つ一つの節を短く保っています。
コードは長いですが、どの場合に何を返すかが、節の並びから追えます。

## まとめ

`lists:keysort(2, [{a, 3}, {b, 1}, {c, 2}])` は、`[{b, 1}, {c, 2}, {a, 3}]` を返します。
二番目の位置の値で、昇順に並びます。
