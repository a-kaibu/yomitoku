---
title: "指数を 2 進数で読んで、掛け算を対数回に減らすべき乗"
description: "整数のべき乗 base^exp を求める関数。指数を 2 進数として 1 ビットずつ読み、base を 2 乗しながら必要なときだけ掛ける「繰り返し二乗法」の教科書的な実装。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/math/int_pow.c
lines: [12, 31]
function: "int_pow"
difficulty: 1
format: 2
tags: [アルゴリズム, ビット演算, 数値計算]
---

## ひとことで

`int_pow(base, exp)` は、`base` の `exp` 乗を整数で計算する関数です。`int_pow(3, 5)` は `243` を返します。
`base` を `exp` 回掛ければ求まりますが、この関数は**指数を 2 進数として読む**ことで、掛け算の回数を大幅に減らしています。
「繰り返し二乗法」と呼ばれる有名なアルゴリズムの、短くてきれいな実装です。

## コード

::: code-group

```c:line-numbers=12 [日本語訳]
/**
 * int_pow - 与えられた底と指数のべき乗を計算する
 * @base: 累乗される底
 * @exp: 累乗の指数
 *
 * 計算するもの: pow(base, exp)、つまり @base の @exp 乗
 */
u64 int_pow(u64 base, unsigned int exp)
{
	u64 result = 1;

	while (exp) {
		if (exp & 1)
			result *= base;
		exp >>= 1;
		base *= base;
	}

	return result;
}
```

```c:line-numbers=12 [原文]
/**
 * int_pow - computes the exponentiation of the given base and exponent
 * @base: base which will be raised to the given power
 * @exp: power to be raised to
 *
 * Computes: pow(base, exp), i.e. @base raised to the @exp power
 */
u64 int_pow(u64 base, unsigned int exp)
{
	u64 result = 1;

	while (exp) {
		if (exp & 1)
			result *= base;
		exp >>= 1;
		base *= base;
	}

	return result;
}
```

:::

## 前提知識

- **`u64`**: カーネルで使う「64 ビットの符号なし整数」の型名です。
- **`unsigned int`**: 0 以上の整数の型です。
- **`exp & 1`**: `exp` の最下位ビット（2 進数のいちばん右の桁）が 1 かどうかを調べます。奇数なら 1 です。
- **`exp >>= 1`**: `exp` を右に 1 ビットずらします。2 で割って切り捨てるのと同じです。
- **`result *= base`**: `result = result * base` の短い書き方です。
- **`while (exp)`**: `exp` が 0 でない間くり返します。C では 0 が偽、それ以外が真です。
- **オーバーフロー**: 結果が 64 ビットに入りきらないと、上の桁が捨てられて値が化けます。この関数は確認しないので、呼び出し側が範囲に気をつけます。

## 何をしているか

### 考え方

`exp = 5` は 2 進数で `101` です。つまり `5 = 4 + 1` なので、`3^5 = 3^4 × 3^1` と分けられます。
`3^1, 3^2, 3^4, 3^8 …` は、前の値を 2 乗するだけで次々に作れます。あとは、`exp` のビットが 1 になっている位置のものだけを掛け合わせればよいのです。

### 答えの初期値

```c:line-numbers=21
	u64 result = 1;
```

何も掛けていない状態は 1 です。`exp = 0` ならループに入らず 1 を返すので、`x^0 = 1` も自然に正しくなります。

### ビットを 1 つずつ読む

```c:line-numbers=23
	while (exp) {
		if (exp & 1)
			result *= base;
		exp >>= 1;
		base *= base;
	}
```

- `if (exp & 1)`: 今見ているビットが 1 なら、`result` に今の `base` を掛けます。
- `exp >>= 1;`: `exp` を 1 ビット右へずらして、次のビットを最下位に持ってきます。
- `base *= base;`: `base` を 2 乗します。ループの k 周目には、`base` は元の値の `2^k` 乗になっています。

### 具体例: `int_pow(3, 5)`

| 周 | `exp`（2 進） | 最下位ビット | `result` | 次の `base` |
| --- | --- | --- | --- | --- |
| 1 | `101` | 1 | 1 × 3 = 3 | 9 |
| 2 | `10` | 0 | 3 | 81 |
| 3 | `1` | 1 | 3 × 81 = 243 | 6561 |

`exp` が 0 になってループを抜け、`243` を返します。

## ここがすごい

- **掛け算の回数が桁違いに少ない**: 素直に掛けると `exp` 回の掛け算が必要です。この方法なら、ループは `exp` のビット数の回数だけで、`exp = 1000` でも 10 周です。1 周あたり最大 2 回の掛け算なので、合計でも約 20 回です。
- **ビットを下から読む**: 2 進数を上の桁から読む方法もありますが、下から読むと「最下位ビットを見る、右にずらす」という単純な操作のくり返しで済み、桁数を先に数える必要もありません。
- **短く、場合分けがない**: 特別扱いが必要に見える `exp = 0` や `exp = 1` も、同じループで正しく処理されます。
- **トレードオフ**: 最後の周でも `base *= base` を実行するので、使わない掛け算が 1 回だけ余分に起きます（表の「6561」）。その代わりにループの形がとても単純になっています。

## まとめ

- べき乗は「指数を 2 進数で読み、ビットが 1 のところだけ掛ける」と、掛け算の回数が指数のビット数程度で済む。
- `x & 1` と `x >>= 1` の組み合わせで、整数のビットを下から 1 つずつ読める。
- 初期値を「何もしていない状態」（掛け算なら 1）にすると、境界の場合分けがいらなくなる。
- この考え方は、べき乗の余りを求める計算（暗号など）にもそのまま使える。
