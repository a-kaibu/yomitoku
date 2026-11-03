---
title: "リストの各要素に、一から始まる番号を付けた組を作る"
description: "lists:enumerate/1 は、リストの各要素を {番号, 要素} の組にする。番号は 1 から始まり、既定では一つずつ増える。インデックスを付ける処理の基本形。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [1805, 1806]
function: "lists:enumerate/1"
difficulty: 1
format: 2
tags: ["標準ライブラリ", "関数型", "イディオム"]
---
## ひとことで

`lists:enumerate/1` は、リストの各要素に、位置を表す番号を付けます。
結果は `{番号, 要素}` の組のリストです。番号は `1` から始まり、要素ごとに一つずつ増えます。

## コード

```erlang:line-numbers=1805
enumerate(List1) ->
    enumerate(1, 1, List1).
```

## 前提知識

- **インデックス（番号）**: リストの中で、何番目の要素かを表す数です。Erlang のリストは、先頭から順に読むのが基本なので、番号を付けるには、読みながら数を数えます。
- **`enumerate/3`**: 開始の番号と増える幅を指定する版です。この関数は、その二つを既定値で呼んでいます。
- **`mapfoldl/3`**: 要素を一つずつ変換しながら、途中の値を持ち回る関数です。ドキュメントでは、`enumerate/3` の動きを、この関数で説明しています。

## 何をしているか

### 1. 既定の開始番号と増える幅を使う

```erlang:line-numbers=1805
enumerate(List1) ->
    enumerate(1, 1, List1).
```

`enumerate/1` の本体は一行だけです。開始番号 `1` と、増える幅 `1` を、`enumerate/3` に渡します。
呼び出し側は、番号の決まりを何も書かずに済みます。

### 2. ドキュメントが、動きを説明している

```erlang:line-numbers=1829
enumerate(I, S, List) ->
  {List1, _ } = lists:mapfoldl(fun(T, Acc) -> {{Acc, T}, Acc+S} end, I, List),
```

ドキュメントには、`enumerate/3` が、`mapfoldl/3` を使った形で書かれています。
`{Acc, T}` の組を作り、`Acc` に増える幅 `S` を足していきます。つまり、番号は、リストを読むのと同時に、一つずつ決まります。

## ここがすごい

### 番号を、読みながら付ける

番号付きのリストを作るには、リストの長さを先に数えて、そこから番号を振る方法もあります。
しかし、この関数の形なら、一度の走査で済みます。要素を読むたびに、次の番号を作るので、追加の処理は要りません。

### 既定値で、呼び出しを短くする

多くの場合、番号は `1` から始めて、一つずつ増えれば十分です。
この関数は、その場合の呼び出しを、引数一つにまとめています。開始番号や増える幅を変えたいときだけ、`enumerate/3` を直接使います。

### 結果の形は、組のリスト

戻り値は、`{番号, 要素}` の組が並んだリストです。
この形は、`lists:keyfind/3` や、`lists:keysort/2` で扱いやすい形でもあります。番号を先頭に置いたので、番号で探したり並べたりできます。

## まとめ

`lists:enumerate([a, b, c])` は、`[{1, a}, {2, b}, {3, c}]` を返します。
開始番号を変えたいときは、`lists:enumerate(0, [a, b])` のように、番号を先頭の引数で渡します。
