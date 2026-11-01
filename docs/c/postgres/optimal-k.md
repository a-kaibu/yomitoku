---
title: "誤判定が最小になるハッシュ関数の数を ln 2 × m / n で求める"
description: "ブルームフィルタのビット数と要素数から、偽陽性率を最小にするハッシュ関数の数 k を計算する関数。理論式を 1 行で書き、1 以上 10 以下に丸める。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2018-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/bloomfilter.c
lines: [223, 234]
function: "optimal_k"
difficulty: 2
format: 2
tags: [数値計算, データ構造, アルゴリズム]
---

## ひとことで

`optimal_k` は、ブルームフィルタで使う **ハッシュ関数の数 k** を決める関数です。
ブルームフィルタのビット数を m、入れる要素の数を n とすると、誤判定（偽陽性）の確率が最も小さくなる k は、およそ `ln 2 × m / n` であることが知られています。この関数はその式をそのまま計算し、1〜10 の範囲に収めて返します。
たとえば `m = 1600万` ビット、`n = 100万` 個なら、`0.693 × 16 = 11.09` で、四捨五入すると 11 ですが、上限の 10 に抑えられて `10` が返ります。

## コード

::: code-group

```c:line-numbers=223 [日本語訳]
/*
 * フィルタのビット数と、見込まれる要素の総数から、
 * 最適なハッシュ関数の数を決める。最適な数とは、
 * 偽陽性率を最小にする数のこと。
 */
static int
optimal_k(uint64 bitset_bits, int64 total_elems)
{
	int			k = rint(log(2.0) * bitset_bits / total_elems);

	return Max(1, Min(k, MAX_HASH_FUNCS));
}
```

```c:line-numbers=223 [原文]
/*
 * Determine optimal number of hash functions based on size of filter in bits,
 * and projected total number of elements.  The optimal number is the number
 * that minimizes the false positive rate.
 */
static int
optimal_k(uint64 bitset_bits, int64 total_elems)
{
	int			k = rint(log(2.0) * bitset_bits / total_elems);

	return Max(1, Min(k, MAX_HASH_FUNCS));
}
```

:::

## 前提知識

- **ブルームフィルタと k**: 値を追加するとき、k 個のハッシュ値が示すビットを 1 にするデータ構造です。調べるときは同じ k 個を見て、全部 1 なら「たぶん有る」と答えます。
  - k が小さすぎると、調べるビットが少なく、偶然全部 1 になりやすい。
  - k が大きすぎると、1 個の値で多くのビットを立てるので、ビット列がすぐ 1 だらけになる。
  - その間にちょうどよい k があります。
- **`log(2.0)`**: C の数学ライブラリ（`<math.h>`）の関数で、自然対数 ln 2 ≈ 0.693 を返します。
- **`rint(x)`**: 小数 `x` を最も近い整数に丸める関数です（ちょうど中間のときの扱いは丸めのモードに従います）。結果は小数型なので、`int` 型の変数に代入するときに整数に変換されます。
- **整数と小数の混ざった計算**: `log(2.0) * bitset_bits / total_elems` は左から計算されます。最初の掛け算で小数（`double`）になるので、割り算も小数で行われ、切り捨てが起きません。
- **`Min` / `Max`**: 小さいほう・大きいほうを返すマクロです。`MAX_HASH_FUNCS` は同じファイルで 10 と定義されています。
- **`uint64` と `int64`**: 64 ビットの符号なし・符号付き整数です。

## 何をしているか

### 1. 理論上の最適値を計算する

```c:line-numbers=231
	int			k = rint(log(2.0) * bitset_bits / total_elems);
```

`ln 2 × m / n` を小数で計算し、`rint` で丸めます。
`m = 2²⁴`（約 1678 万ビット = 2MB）、`n = 300万` なら、`0.693 × 16777216 / 3000000 ≈ 3.88` で、`k = 4` です。

### 2. 範囲に収める

```c:line-numbers=233
	return Max(1, Min(k, MAX_HASH_FUNCS));
```

`Min(k, 10)` で上限を 10 にし、`Max(1, ...)` で下限を 1 にします。
要素が非常に多く `m / n` が小さいと、計算値は 0 になることがあります。k = 0 では何も記録できないので、最低 1 にしています。

## ここがすごい

- **理論式をそのまま使う**: 偽陽性の確率はおよそ `(1 - e^(-kn/m))^k` と表せ、これを k について最小にすると `k = (m/n) ln 2` が得られます。このとき、ビット列のおよそ半分が 1 になる状態になります。同じファイルの `bloom_prop_bits_set` のコメントに「立っているビットの割合はだいたい 0.5 に近いはず」とあるのは、この性質を反映したものです。
- **上限 10 の意味**: k を大きくすると、追加・検索のたびに見るビットが増えて遅くなり、メモリ上のばらばらな位置に触れるのでキャッシュにも不利です。一方で誤判定率の改善は小さくなっていきます。上限を設け、`hashes` を固定長 10 の配列で用意できるようにしているのは、速さと単純さを優先した割り切りです。
- **メモリが多いほど k が増える**: `bloom_create` は 1 要素 2 バイト（16 ビット）を目安にビット列を作るので、普通は `m / n ≈ 16` 前後になり、k は上限近くになります。逆に、メモリが足りず `m / n` が小さいときは k が小さくなり、ビット列が早く埋まりすぎるのを防ぎます。
- **呼ぶ側に k を決めさせない**: k を引数で受け取る設計もありえますが、利用者は最適値を知らないことがほとんどです。大きさと要素数から自動で決めることで、API が簡単になっています。

## まとめ

- ブルームフィルタのハッシュ関数の数は、`k ≈ (m/n) ln 2` が最適。
- 最適な k のとき、ビット列のおよそ半分が 1 になる。
- 理論値はそのまま使い、実装の都合（速さ・配列の大きさ）で上限と下限をかける。
- 利用者が知らない値は、ライブラリの側で計算して決める。
