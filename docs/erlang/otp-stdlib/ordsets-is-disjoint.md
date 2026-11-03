---
title: "二つの順序付き集合に、共通の要素が無いかを、並びを比べながら調べる"
description: "ordsets:is_disjoint/2 は、二つの昇順の集合を先頭から比べ、共通の要素が一つも無ければ true を返す。小さい方を進めて、同じ要素に出会ったら false にする。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 1996-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/ordsets.erl
lines: [412, 421]
function: "ordsets:is_disjoint/2"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`ordsets:is_disjoint/2` は、二つの順序付き集合が、共通の要素を持たないかを調べます。
共通の要素が無ければ `true`、一つでもあれば `false` です。並びが昇順であることを使って、両方のリストを一度だけ先頭から進めます。

## コード

::: code-group

```erlang:line-numbers=412 [日本語訳]
is_disjoint([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    is_disjoint(Es1, Set2);
is_disjoint([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    is_disjoint(Es2, Set1);			% E1 > E2 のとき、引数を入れ替えて続ける
is_disjoint([_E1|_Es1], [_E2|_Es2]) ->		%E1 と E2 が等しいとき、共通の要素がある
    false;
is_disjoint([], _) ->
    true;
is_disjoint(_, []) ->
    true.
```

```erlang:line-numbers=412 [原文]
is_disjoint([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    is_disjoint(Es1, Set2);
is_disjoint([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    is_disjoint(Es2, Set1);			% switch arguments!
is_disjoint([_E1|_Es1], [_E2|_Es2]) ->		%E1 == E2
    false;
is_disjoint([], _) ->
    true;
is_disjoint(_, []) ->
    true.
```

:::

## 前提知識

- **順序付き集合（ordset）**: 要素を昇順に並べ、重複を持たないリストです。
- **比較 `<` と `>`**: 先頭どうしの大小で、どちらのリストを進めるかを決めます。
- **引数の入れ替え**: `is_disjoint` は、二つのリストの役割が対等なので、片方を進めた後に、どちらを先頭にしても同じ判定になります。ここでは、そのために入れ替えて呼び出しています。
- **空のリスト**: 比べる相手が無いので、共通の要素は無く、`true` を返します。

## 何をしているか

### 1. 左の先頭が小さければ、左を進める

```erlang:line-numbers=412
is_disjoint([E1|Es1], [E2|_]=Set2) when E1 < E2 ->
    is_disjoint(Es1, Set2);
```

左の先頭 `E1` が右の先頭 `E2` より小さければ、左の `E1` は右の集合のどこにも無いことが分かります。`E1` を捨てて、左の残りだけで続けます。

### 2. 左の先頭が大きければ、右を進める

```erlang:line-numbers=414
is_disjoint([E1|_]=Set1, [E2|Es2]) when E1 > E2 ->
    is_disjoint(Es2, Set1);			% switch arguments!
```

左の先頭が右の先頭より大きければ、右の `E2` は左のどこにも無いことが分かります。二つの引数を入れ替えて、右の残りで続けます。
入れ替えると、どちらのリストも同じ役割で扱えます。

### 3. 同じ要素に出会えば、false

```erlang:line-numbers=416
is_disjoint([_E1|_Es1], [_E2|_Es2]) ->		%E1 == E2
    false;
```

先頭どうしが等しければ、共通の要素が見つかりました。そこで `false` を返します。

### 4. 一方が空になったら、true

```erlang:line-numbers=418
is_disjoint([], _) ->
    true;
is_disjoint(_, []) ->
    true.
```

どちらかのリストが空になったら、残りの要素と比べる相手が無いので、共通の要素は無かったことになります。`true` を返します。

## ここがすごい

### 並んでいることを使って、一度だけ進む

並んでいない集合どうしを比べるなら、全部の組み合わせを調べる必要があります。
この関数は、昇順の性質を使い、先頭だけを比べて、小さい方を進めます。両方の要素を、それぞれ一回ずつ見るだけで答えが決まります。

### 引数の入れ替えで、一つの形にまとめる

左が大きいときと、右が大きいときは、鏡のように同じ処理です。
二つの節を作る代わりに、引数を入れ替えて同じ関数を呼びます。節の数が減り、判定の流れも分かりやすくなります。

### 最初の共通要素で止まる

共通の要素が見つかった時点で `false` を返します。
後ろの要素は見ません。「重なるかどうか」だけが知りたいときに、無駄な作業をしない形です。

## まとめ

`ordsets:is_disjoint([1, 2], [3, 4])` は、`true` を返します。
`ordsets:is_disjoint([1, 2], [2, 3])` は、`2` が共通なので、`false` を返します。
