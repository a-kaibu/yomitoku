---
title: "平衡集合が、別の集合の部分集合かを確かめる"
description: "gb_sets:is_subset/2 は、一方の集合のすべての要素が、もう一方に含まれるかを調べる。要素数の大小と、比率を使って、要素を比べる方法を選ぶ。"
language: erlang
project: "Erlang/OTP stdlib"
repo: https://github.com/erlang/otp
license: Apache-2.0
copyright: "Copyright Ericsson AB 2011-2026. All Rights Reserved."
commit: "9b3582453d9b66e709f11cf148d92f326ee00486"
file: lib/stdlib/src/gb_sets.erl
lines: [1365, 1367]
function: "gb_sets:is_subset/2"
difficulty: 3
format: 2
tags: ["データ構造", "アルゴリズム", "標準ライブラリ"]
---
## ひとことで

`gb_sets:is_subset/2` は、一つ目の集合が二つ目の集合の部分集合かどうかを、`true` か `false` で返します。
部分集合とは、一つ目の集合の要素がすべて二つ目に含まれている状態のことです。

## コード

```erlang:line-numbers=1365
is_subset({N1, T1}, {N2, T2}) when is_integer(N1), N1 >= 0,
                                   is_integer(N2), N2 >= 0 ->
    is_subset(to_list_1(T1), N1, T2, N2).
```

## 前提知識

- **部分集合**: `A` の要素が、すべて `B` にも入っているとき、`A` は `B` の部分集合です。空の集合は、どの集合の部分集合でもあります。
- **`to_list_1/1`**: 木の要素を、昇順のリストに直す補助関数です。
- **`is_subset_1/2` と `is_subset_2/2`**: 二つのリストを比べて、部分集合かを判定する補助関数です。この記事では中身には踏み込みません。
- **`?c`**: ソースで定義されたマクロです。要素数の比から、比べ方を選ぶために使われます。

## 何をしているか

### 1. 両方の要素数を確かめる

```erlang:line-numbers=1365
is_subset({N1, T1}, {N2, T2}) when is_integer(N1), N1 >= 0,
                                   is_integer(N2), N2 >= 0 ->
    is_subset(to_list_1(T1), N1, T2, N2).
```

二つの集合は、どちらも `{要素数, 木}` の組です。要素数が整数で、`0` 以上であることを、ガードで確かめます。
確かめた後、一つ目の木を昇順のリストに直し、`N1`、`T2`、`N2` と共に `is_subset/4` へ渡します。

### 2. 小さな集合なら、リストで比べる

```erlang:line-numbers=1369
is_subset(L, _N1, T2, N2) when N2 < 10 ->
    is_subset_2(L, to_list_1(T2));
```

二つ目の集合の要素数 `N2` が `10` より小さいときは、両方をリストに直して比べます。
要素数が少ないなら、木の形より、リストで順に比べる方が簡単で速いからです。

### 3. 大きさの比で、比べ方を選ぶ

```erlang:line-numbers=1371
is_subset(L, N1, T2, N2) ->
    X = N1 * round(?c * math:log(N2)),
    if N2 < X ->
	    is_subset_2(L, to_list_1(T2));
       true ->
	    is_subset_1(L, T2)
```

要素数が大きいときは、`N1` と `N2` の比を使って、比べ方を選びます。
`X` は、`N1` と `log(N2)` を掛けた値です。`N2` が `X` より小さければ、リストで比べます。そうでなければ、一つ目のリストの要素を、二つ目の木から一つずつ探します。

## ここがすごい

### 比べ方を、データの大きさで変える

部分集合の判定は、どの方法を使っても答えは同じです。
しかし、速さは違います。この関数は、要素数の比を見て、最も速そうな方法を選びます。呼び出し側は、その選択を意識しなくて済みます。

### 木をリストに直して、順に比べる

昇順のリストは、先頭から順に比べられます。
二つの昇順リストを同時に読めば、一度の走査で判定が終わります。木を直接比べるより、読み方が単純です。

### 比率の定数を、マクロに隠す

`?c` の値は、ソースの冒頭で決められています。
読み手は、`is_subset/4` の中の「比の大きさで方法を選ぶ」という考え方だけを追えば、全体の意図が分かります。

## まとめ

`gb_sets:is_subset(gb_sets:from_list([1, 2]), gb_sets:from_list([1, 2, 3]))` は、`true` を返します。
逆に、`[1, 4]` が含まれない場合は、`false` を返します。
