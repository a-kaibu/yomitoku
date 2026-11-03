---
title: "2 つの集合を合わせるとき、小さい方を大きい方へ足す"
description: "sets:union/2 は、2 つの集合の和集合を作る。マップで表された集合どうしは maps:merge で一度に合わせ、そうでない場合は小さい方の要素を大きい方へ 1 つずつ足す。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2000-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/sets.erl
lines: [503, 511]
function: "sets:union/2"
difficulty: 2
format: 2
tags: ["データ構造", "最適化", "標準ライブラリ"]
---
## ひとことで

`sets:union/2` は、2 つの集合の和集合（どちらかに含まれる要素の集まり）を作ります。
新しい `sets` は、要素をマップのキーとして持ちます。その場合は、`maps:merge/2` で一度に合わせられます。古い形の集合では、要素を 1 つずつ足します。

## コード

```erlang:line-numbers=503
union(#{}=S1, #{}=S2) ->
    maps:merge(S1, S2);
union(S1, S2) ->
    case size(S1) < size(S2) of
	true ->
	    fold(fun (E, S) -> add_element(E, S) end, S2, S1);
	false ->
	    fold(fun (E, S) -> add_element(E, S) end, S1, S2)
    end.
```

## 前提知識

- **和集合**: 2 つの集合のどちらかに含まれる要素の集まりです。同じ要素は 1 つだけ残ります。
- **マップのキー**: `#{要素 => 値}` の形で、キーは重複しません。`sets` の新しい形では、要素をキーとして持ちます。
- **`maps:merge/2`**: 2 つのマップを合わせて、1 つのマップを作ります。同じキーは、後の値で上書きされます。ここでは値を使わないので、結果は和集合になります。
- **`fold/3`**: 集合の要素を順に処理して、1 つの値にまとめます。
- **`add_element/2`**: 集合に要素を 1 つ足します。

## 何をしているか

### 1. 両方がマップのとき

```erlang:line-numbers=503
union(#{}=S1, #{}=S2) ->
    maps:merge(S1, S2);
```

両方がマップ（新しい形の集合）なら、`maps:merge/2` で一度に合わせます。キーの重複は、マップの仕組みが自動で取り除きます。

### 2. 古い形の集合のとき

```erlang:line-numbers=505
union(S1, S2) ->
    case size(S1) < size(S2) of
	true ->
	    fold(fun (E, S) -> add_element(E, S) end, S2, S1);
```

`S1` の大きさが `S2` より小さいときは、`S1` の要素を 1 つずつ `S2` に足します。`fold/3` の初期値に `S2` を使うので、大きい方を土台にしています。

### 3. 反対のとき

```erlang:line-numbers=509
	false ->
	    fold(fun (E, S) -> add_element(E, S) end, S1, S2)
```

`S1` の方が大きいか同じなら、`S2` の要素を `S1` に足します。小さい方を回し、大きい方を土台にする点は同じです。

## ここがすごい

### 大きい方を土台にして、足す回数を減らす

集合の要素を 1 つずつ足すと、足す回数は小さい方の要素数に比例します。土台を大きい方にすれば、足す回数は少なくなります。
マップ同士では、この最適化すら要らず、組み込みの統合に任せています。

### 型の違いを、パターンで振り分ける

新しい形と古い形の集合を、同じ関数名で扱えるように、節を 2 つに分けています。利用者は、どちらの形の集合でも、同じ `union/2` を呼べます。

## まとめ

- 集合の和は、マップで表せるなら、組み込みの統合関数で一度に作れます。
- 要素を足す形では、小さい方を回して大きい方へ足すと効率が良くなります。
- 表現が違っても、関数の入り口を 1 つにすると、利用者は迷いません。
