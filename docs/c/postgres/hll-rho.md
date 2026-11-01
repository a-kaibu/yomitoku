---
title: "「最初の 1 は上から何番目か」を最上位ビット命令で一発で求める"
description: "HyperLogLog の内部関数 rho。ビット列の上から数えて最初に 1 が現れる位置を返す。ループで数える代わりに最上位ビットの位置を求める関数を使い、全部 0 のときや範囲を超えたときは b + 1 に丸める。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL AND MIT
copyright: "Portions Copyright (c) 2014-2026, PostgreSQL Global Development Group; Copyright (c) 2013 Hideaki Ohno"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/backend/lib/hyperloglog.c
lines: [223, 254]
function: "rho"
difficulty: 2
format: 2
tags: [ビット演算, アルゴリズム, 最適化]
---

## ひとことで

`rho` は、32 ビットの値 `x` を上（最上位ビット）から見ていき、**最初に 1 が現れるのが何番目か** を返します。1 番目から数え、最初の `b` ビットだけを対象にします。
関数の前のコメントの例のとおり、10 ビットを対象にするとき、`0b1000000000` なら 1、`0b0010000000` なら 3、全部 0 なら `b + 1`（ここでは 11）を返します。
HyperLogLog で「先頭に 0 がいくつ続いたか」を観測するための部品です（0 が n 個続けば `n + 1` が返ります）。

## コード

::: code-group

```c:line-numbers=223 [日本語訳]
/*
 * addHyperLogLog() の下請け関数。
 *
 * 引数 x の先頭 b ビットの中で、最初に立っているビットの位置を計算する。
 * 先頭から数え、最上位ビットから最下位ビットに向かって
 * 読む。
 *
 * 例（x の先頭 10 ビットを考える場合）:
 *
 * rho(x = 0b1000000000)   は 1 を返す
 * rho(x = 0b0010000000)   は 3 を返す
 * rho(x = 0b0000000000)   は b + 1 を返す
 *
 * 「x の先頭 b ビットで決まる 2 進のアドレス」
 *
 * 戻り値 "j" は、監視するビットパターンの添字に使われる。
 */
static inline uint8
rho(uint32 x, uint8 b)
{
	uint8		j = 1;

	if (x == 0)
		return b + 1;

	j = 32 - pg_leftmost_one_pos32(x);

	if (j > b)
		return b + 1;

	return j;
}
```

```c:line-numbers=223 [原文]
/*
 * Worker for addHyperLogLog().
 *
 * Calculates the position of the first set bit in first b bits of x argument
 * starting from the first, reading from most significant to least significant
 * bits.
 *
 * Example (when considering first 10 bits of x):
 *
 * rho(x = 0b1000000000)   returns 1
 * rho(x = 0b0010000000)   returns 3
 * rho(x = 0b0000000000)   returns b + 1
 *
 * "The binary address determined by the first b bits of x"
 *
 * Return value "j" used to index bit pattern to watch.
 */
static inline uint8
rho(uint32 x, uint8 b)
{
	uint8		j = 1;

	if (x == 0)
		return b + 1;

	j = 32 - pg_leftmost_one_pos32(x);

	if (j > b)
		return b + 1;

	return j;
}
```

:::

## 前提知識

- **ビットの位置**: 32 ビットの整数は、一番下を 0 番、一番上を 31 番とする 32 個のビットでできています。この関数はそれとは逆に、**上から 1, 2, 3, …** と数えた位置を返します。
- **`pg_leftmost_one_pos32(x)`**: PostgreSQL のビット操作用関数で、最上位の 1 のビットの位置を「下から数えた番号」（0〜31）で返します。CPU の専用命令（先頭の 0 を数える命令）で 1 命令になることが多い関数です。`x` が 0 のときは使えません。
- **`static inline`**: このファイルだけで使う関数で、呼び出し元に中身を埋め込んでよいという指示です。小さく頻繁に呼ばれる関数に向いています。
- **`uint8`**: 0〜255 の符号なし 8 ビット整数です。
- **呼ばれ方**: `addHyperLogLog` は、ハッシュ値から箱の番号に使った上位ビットを左シフトで捨て、残りのビットを上に詰めた値を `x` として渡します。`b` は残りのビット数です。

## 何をしているか

### 1. 全部 0 なら b + 1

```c:line-numbers=245
	if (x == 0)
		return b + 1;
```

`x == 0` なら 1 が存在しないので、対象範囲を全部見ても見つからなかったことを表す `b + 1` を返します。この確認は、次の行で使う関数が 0 を受け付けないためにも必要です。

### 2. 最上位の 1 の位置を変換する

```c:line-numbers=248
	j = 32 - pg_leftmost_one_pos32(x);
```

`pg_leftmost_one_pos32` は下から数えた位置（0〜31）を返すので、`32 - 位置` で「上から数えて何番目か」（1〜32）に直します。
`x = 0x08000000`（上から 5 番目のビットだけ 1）なら、下から数えた位置は 27 なので、`32 - 27 = 5` です。
`x = 0x80000000`（最上位が 1）なら、位置は 31 で、`32 - 31 = 1` です。

### 3. 範囲外なら b + 1 に丸める

```c:line-numbers=250
	if (j > b)
		return b + 1;

	return j;
```

`b = 28` のとき、最初の 1 が 30 番目なら、それは対象の 28 ビットの外です。対象範囲内には 1 がなかったとみなし、`b + 1 = 29` を返します。範囲内ならそのまま返します。

## ここがすごい

- **ループを使わない**: 素直に書くと「最上位ビットから 1 ビットずつ調べて、1 が出るまで数える」ループになり、最悪 32 回まわります。最上位ビットの位置を CPU 命令 1 つで求め、引き算で向きを変えるだけにしたので、どんな入力でも一定の短い時間で終わります。HyperLogLog は大量の値を処理するので、この差が効きます。
- **2 つの「見つからない」をそろえる**: 全部 0 の場合も、対象範囲の外にしか 1 がない場合も、同じ `b + 1` を返します。呼び出し側は、ハッシュ値の下位ビットに箱の番号の残りかすがあるかどうかを気にせずに済みます。実際には左シフトで下に 0 が詰められるので、範囲外の 1 は出にくいのですが、`b` を引数で受けて丸めることで、関数単体として仕様どおりに振る舞います。
- **コメントに具体例がある**: 「上から数える」「1 から始まる」「全部 0 なら b + 1」という、取り違えやすい約束が、3 つの例で一目でわかるように書かれています。ビット演算の関数では、こうした例が理解を大きく助けます。
- **前提条件を自分で守る**: `pg_leftmost_one_pos32` は 0 を渡してはいけない関数ですが、その前に 0 を別扱いしているので、呼び出し元はその制約を意識しなくてよくなっています。

## まとめ

- 「上から数えて最初の 1」は、最上位ビットの位置を 32 から引けば求まる。
- 0 を受け付けない関数を使う前に、0 の場合を別に処理する。
- 見つからなかった場合の答えを 1 つの値（`b + 1`）にそろえると、呼び出し側が単純になる。
- 取り違えやすいビットの数え方は、コメントの具体例で示すとよい。
