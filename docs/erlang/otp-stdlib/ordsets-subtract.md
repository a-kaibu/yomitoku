---
title: "集合から別の集合を引く、差集合の 3 つの動き"
description: "ordsets:subtract/2 は、ある集合から別の集合の要素を取り除いた差集合を作る。先頭どうしの比較で、残す・捨てる・両方進める、の 3 通りを使い分ける。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/ordsets.erl
lines: [443, 450]
function: "ordsets:subtract/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`ordsets:subtract/2` は、第 1 の集合から、第 2 の集合に含まれる要素を取り除いた差集合を作ります。
たとえば `{1, 2, 3}` から `{2}` を引くと `{1, 3}` です。昇順に並んだ 2 つのリストを、先頭から比べながら進みます。

## コード

::: code-group

```erlang:line-numbers=443 [日本語訳]
subtract([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    [E1|subtract(Es1, Set2)];
subtract([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    subtract(Set1, Es2);
subtract([_E1|Es1], [_E2|Es2]) ->		%E1 と E2 が等しいとき
    subtract(Es1, Es2);
subtract([], _) -> [];
subtract(Es1, []) -> Es1.
```

```erlang:line-numbers=443 [原文]
subtract([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    [E1|subtract(Es1, Set2)];
subtract([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    subtract(Set1, Es2);
subtract([_E1|Es1], [_E2|Es2]) ->		%E1 == E2
    subtract(Es1, Es2);
subtract([], _) -> [];
subtract(Es1, []) -> Es1.
```

:::

## 前提知識

- **差集合**: 第 1 集合にあり、第 2 集合にない要素の集まりです。
- **昇順のリスト**: 要素が小さい順に並んだリストです。`ordsets` は、この形で集合を表します。
- **`[E1|Es1]`**: 先頭の要素 `E1` と残りのリストです。
- **`_E1` と `_E2`**: 使わない値を表す変数です。先頭を捨てるときに使います。
- **再帰の順番**: 節は上から順に試されます。一致した最初の節が使われます。

## 何をしているか

### 1. 第 1 集合の先頭が小さいとき

```erlang:line-numbers=443
subtract([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    [E1|subtract(Es1, Set2)];
```

`E1 < E2` なら、`E1` は第 2 集合にないので、残す要素です。`E1` を結果の先頭に付け、残りを比べ続けます。

### 2. 第 2 集合の先頭が小さいとき

```erlang:line-numbers=445
subtract([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    subtract(Set1, Es2);
```

`E1 > E2` なら、`E2` は第 1 集合にないので、比べる相手を進めます。`E1` は、まだ比べていないので、そのまま残して比べ続けます。

### 3. 等しいとき

```erlang:line-numbers=447
subtract([_E1|Es1], [_E2|Es2]) ->		%E1 == E2
    subtract(Es1, Es2);
```

`E1` と `E2` が等しければ、`E1` は第 2 集合にあるので、結果に入れません。両方の先頭を 1 つずつ進めます。

### 4. 空になったとき

```erlang:line-numbers=449
subtract([], _) -> [];
subtract(Es1, []) -> Es1.
```

第 2 集合が空になったら、残りの第 1 集合は全部残ります。第 1 集合が空なら、結果は空です。

## ここがすごい

### 3 通りの動きが、比較結果にそのまま対応する

「小さい方を残す」「大きい方を先に進める」「等しければ両方捨てる」は、比較の結果に 1 対 1 で対応します。
どの節がどの動きかは、ガードの比較を見れば分かります。複雑な条件分岐を書かずに済みます。

### 残りを、比べずにそのまま使える

第 2 集合が空になれば、第 1 集合の残りは、すべて差集合に入ります。その残りを 1 つずつ比べる必要はありません。
この打ち切りのおかげで、後半の大きな部分を速く返せます。

差集合は、第 2 集合の要素を取り除くだけなので、第 1 集合の残りをコピーする量が、結果の大きさにほぼ比例します。どちらの集合も 1 回だけ先頭から読むので、要素数の和に比例する時間で終わります。

## まとめ

- 差集合は、昇順の 2 つのリストを先頭から比べて、3 通りの動きで作れます。
- 比較の結果と、残すかどうかを対応させると、規則が読みやすくなります。
- 比べる相手がなくなったら、残りをそのまま返すと、無駄な比較を省けます。
