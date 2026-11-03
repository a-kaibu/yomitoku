---
title: "絞り込みと変換を 1 回で行う、flatmap の使い方"
description: "lists:filtermap/2 は、関数が true なら要素を残し、{true, V} なら V に変えて残し、false なら捨てる。内部では flatmap を使い、要素ごとに 0 個か 1 個のリストを返している。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/lists.erl
lines: [2574, 2581]
function: "lists:filtermap/2"
difficulty: 2
format: 2
tags: ["イテレータ", "標準ライブラリ", "関数型"]
---
## ひとことで

`lists:filtermap/2` は、リストの要素を「残す」「変えて残す」「捨てる」のどれかにします。`filter` と `map` を 1 回の走査でまとめたものです。
関数の戻り値が `true` なら要素を残し、`{true, Value}` なら `Value` に置き換えて残し、`false` なら捨てます。

## コード

```erlang:line-numbers=2574
filtermap(Fun, List1) ->
    lists:flatmap(fun(Elem) ->
                          case Fun(Elem) of
                              false -> [];
                              true -> [Elem];
                              {true,Value} -> [Value]
                          end
                  end, List1).
```

## 前提知識

- **`filter` と `map`**: `filter` は条件で要素を残す関数、`map` は要素を変換する関数です。
- **`lists:flatmap/2`**: 各要素を、リストを返す関数で変換し、結果のリストをつないで 1 つにします。
- **`case ... of`**: 値の形で分岐します。`false`、`true`、`{true, Value}` の 3 つを書き分けています。
- **`fun(Elem) -> ... end`**: 無名関数です。要素を 1 つ受け取ります。
- **`[]` と `[Elem]`**: 0 個のリストと、1 個のリストです。`flatmap` でつなぐと、要素を残すか捨てるかが決まります。

## 何をしているか

### 1. 関数の結果で、要素の行き先を決める

```erlang:line-numbers=2575
    lists:flatmap(fun(Elem) ->
                          case Fun(Elem) of
                              false -> [];
                              true -> [Elem];
                              {true,Value} -> [Value]
                          end
```

`flatmap` に渡す関数は、要素ごとに 1 つの結果を作ります。

- `false` のときは `[]`（捨てる）。
- `true` のときは `[Elem]`（そのまま残す）。
- `{true, Value}` のときは `[Value]`（値を置き換えて残す）。

### 2. 全体をつなぐ

```erlang:line-numbers=2581
                  end, List1).
```

`lists:flatmap/2` が、それぞれの結果リストを順番につなげます。空のリストは何も足さず、1 要素のリストはその要素を足します。結果として、絞り込みと変換が、元の順番どおりに 1 つのリストになります。

## ここがすごい

### 「空か 1 個のリスト」で、残す・捨てるを表す

絞り込みを `filter` で行い、変換を `map` で行うと、リストを 2 回たどります。この関数は、要素を「空か 1 個のリスト」に変えて、後で `flatmap` がつなげる方式です。
1 回の走査で、捨てる・残す・変える、のすべてを表せます。

### 戻り値の形で、3 つの場合を区別する

関数の結果は `false`、`true`、`{true, Value}` の 3 通りです。これを `case` で書き分けることで、利用者は「変換しない」「変換する」「捨てる」を、同じ関数の中の返し方で選べます。
戻り値の形が分かりやすく、型の違いを意識せずに書けます。

## まとめ

- 絞り込みと変換は、要素ごとに「空か 1 個のリスト」を返すと、1 回の走査でまとめられます。
- 戻り値の形（`false`、`true`、`{true, V}`）で、要素の扱いを表せます。
- `flatmap` のように結果をつなぐ関数を使うと、順番を保ったまま 1 つのリストになります。
