---
title: "昇順の集合が含まれるかを、先頭どうしの比較だけで決める"
description: "ordsets:is_subset/2 は、ある集合のすべての要素が別の集合にあるかを、昇順のリストの先頭どうしの比較で判定する。見つからない要素が出た時点で false を返して打ち切る。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/ordsets.erl
lines: [473, 480]
function: "ordsets:is_subset/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`ordsets:is_subset/2` は、第 1 の集合のすべての要素が、第 2 の集合に含まれているかを判定します。
どちらも昇順に並んだリストなので、先頭どうしを比べながら 1 回ずつ読み進めます。第 1 の要素が第 2 に現れないと分かった時点で、すぐに `false` を返します。

## コード

::: code-group

```erlang:line-numbers=473 [日本語訳]
is_subset([E1|_], [E2|_]) when E1 < E2 ->	%E1 は第 2 集合にない
    false;
is_subset([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    is_subset(Set1, Es2);
is_subset([_E1|Es1], [_E2|Es2]) ->		%E1 と E2 が等しいとき
    is_subset(Es1, Es2);
is_subset([], _) -> true;
is_subset(_, []) -> false.
```

```erlang:line-numbers=473 [原文]
is_subset([E1|_], [E2|_]) when E1 < E2 ->	%E1 not in Set2
    false;
is_subset([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    is_subset(Set1, Es2);
is_subset([_E1|Es1], [_E2|Es2]) ->		%E1 == E2
    is_subset(Es1, Es2);
is_subset([], _) -> true;
is_subset(_, []) -> false.
```

:::

## 前提知識

- **部分集合**: 第 1 集合のすべての要素が、第 2 集合にも入っている状態です。空の集合は、どの集合の部分集合でもあります。
- **昇順のリスト**: 要素が小さい順に並んでいるリストです。`ordsets` はこの形で集合を表します。
- **`[E1|_]` と `[E2|Es2]`**: 先頭の要素と残りを表すパターンです。`_` は使わない値を表します。
- **ガード `when E1 < E2`**: 先頭の大小で節を選びます。
- **`true` と `false`**: 判定の結果です。

## 何をしているか

### 1. 第 1 の先頭が、第 2 のどの要素よりも小さいとき

```erlang:line-numbers=473
is_subset([E1|_], [E2|_]) when E1 < E2 ->	%E1 not in Set2
    false;
```

`E1 < E2` なら、`E1` は第 2 集合のこれ以降の要素と一致しません。昇順なので、第 2 集合の残りには、もう `E1` は現れないからです。そこで `false` を返し、すぐに終わります。

### 2. 第 2 の先頭が小さいとき

```erlang:line-numbers=475
is_subset([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    is_subset(Set1, Es2);
```

`E1 > E2` なら、`E2` は第 1 集合に対応する要素がないので、第 2 集合の側だけを進めます。`E1` は、まだ比べていないので、そのまま残します。

### 3. 等しいとき

```erlang:line-numbers=477
is_subset([_E1|Es1], [_E2|Es2]) ->		%E1 == E2
    is_subset(Es1, Es2);
```

`E1` と `E2` が等しければ、その要素は含まれています。両方の先頭を 1 つずつ進めて、残りを調べます。

### 4. 第 1 集合を読み終えたとき

```erlang:line-numbers=479
is_subset([], _) -> true;
```

第 1 集合の要素を全部確かめ終わったら、すべて含まれていたので `true` です。

### 5. 第 2 集合だけが空になったとき

```erlang:line-numbers=480
is_subset(_, []) -> false.
```

まだ第 1 集合に要素が残っているのに、第 2 集合が空になったら、残りの要素は含まれていません。`false` を返します。

## ここがすごい

### 「見つからない」を、早い段階で確定させる

全要素を 1 つずつ探す素朴な方法では、見つからない要素が最後に現れても、それまでの探索は無駄になりません。ただし、見つからない要素があるかを、早く知ることはできません。
この関数は、昇順という性質を使い、ある要素より後ろには現れないと判断できる時点で、すぐに答えを返します。

### 1 回の読み進めだけで済む

どちらのリストも、先頭から一度ずつ読むだけです。要素数の和に比例する時間で判定が終わります。
集合の比較を、リストの並びの性質に任せることで、特別なデータ構造を使わずに済んでいます。

## まとめ

- 昇順の集合の包含は、先頭どうしの比較で 1 回の読み進めで判定できます。
- 含まれないと分かった時点で打ち切ると、無駄な比較を省けます。
- 空の集合の扱いを節で決めておくと、境界の場合も正しく判定できます。
