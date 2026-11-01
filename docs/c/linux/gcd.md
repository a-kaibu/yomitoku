---
title: "奇数どうしの差を「4 で割れる形」に整える最大公約数"
description: "カーネルの gcd 関数。速い命令が使えれば binary_gcd に任せ、使えない CPU では 1 ビットずつのシフトと、差を 4 で割れる形にする小技で計算する。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/math/gcd.c
lines: [45, 86]
function: "gcd"
difficulty: 3
format: 2
tags: [アルゴリズム, ビット演算, 数値計算, 移植性]
---

## ひとことで

`gcd` は、2 つの符号なし整数の最大公約数（両方を割り切る最大の数）を返すカーネルの関数です。
CPU に「末尾の 0 を数える速い命令」があれば `binary_gcd` に任せます。ない場合は、1 ビットずつのシフトと引き算だけで計算します。
後半のループには、引き算の結果を**4 で割れる形に整えてから 2 ビット削る**という小技が入っています。

## コード

::: code-group

```c:line-numbers=45 [日本語訳]
/**
 * gcd - 2 つの unsigned long の最大公約数を計算して返す
 * @a: 1 つ目の値
 * @b: 2 つ目の値
 */
unsigned long gcd(unsigned long a, unsigned long b)
{
	unsigned long r = a | b;

	if (!a || !b)
		return r;

#if !defined(CONFIG_CPU_NO_EFFICIENT_FFS)
	if (static_branch_likely(&efficient_ffs_key))
		return binary_gcd(a, b);
#endif

	/* r の最下位ビットを取り出す */
	r &= -r;

	while (!(b & r))
		b >>= 1;
	if (b == r)
		return r;

	for (;;) {
		while (!(a & r))
			a >>= 1;
		if (a == r)
			return r;
		if (a == b)
			return a;

		if (a < b)
			swap(a, b);
		a -= b;
		a >>= 1;
		if (a & r)
			a += b;
		a >>= 1;
	}
}
```

```c:line-numbers=45 [原文]
/**
 * gcd - calculate and return the greatest common divisor of 2 unsigned longs
 * @a: first value
 * @b: second value
 */
unsigned long gcd(unsigned long a, unsigned long b)
{
	unsigned long r = a | b;

	if (!a || !b)
		return r;

#if !defined(CONFIG_CPU_NO_EFFICIENT_FFS)
	if (static_branch_likely(&efficient_ffs_key))
		return binary_gcd(a, b);
#endif

	/* Isolate lsbit of r */
	r &= -r;

	while (!(b & r))
		b >>= 1;
	if (b == r)
		return r;

	for (;;) {
		while (!(a & r))
			a >>= 1;
		if (a == r)
			return r;
		if (a == b)
			return a;

		if (a < b)
			swap(a, b);
		a -= b;
		a >>= 1;
		if (a & r)
			a += b;
		a >>= 1;
	}
}
```

:::

## 前提知識

- **`unsigned long`**: 0 以上の整数を表す型です。
- **ビット演算**: `|` は OR、`&` は AND、`>>= 1` は右に 1 ビットずらす（2 で割る）操作です。
- **`r &= -r`**: `r` の**いちばん下に立っている 1 のビット**だけを残します。`12`（`1100`）なら `4` です。
- **`!(b & r)`**: `b` の、`r` の位置のビットが 0 なら真です。
- **`#if !defined(...)`**: その設定が定義されていないときだけ、`#endif` までを使います。
- **`static_branch_likely(&key)`**: 「静的キー」と呼ばれる仕組みです。条件分岐のように見えますが、実行中に機械語そのものを書き換えて、どちらに進むかを固定します。毎回の判定のコストがほぼゼロになります。
- **`swap(a, b)`**: 2 つの変数の中身を入れ替えるマクロです。

## 何をしているか

### 0 の扱い

```c:line-numbers=52
	unsigned long r = a | b;

	if (!a || !b)
		return r;
```

どちらかが 0 なら、もう片方が答えです（`gcd(0, n) = n`）。`r = a | b` はこのとき「0 でないほう」になるので、そのまま返せます。

### 速い道があればそちらへ

```c:line-numbers=57
#if !defined(CONFIG_CPU_NO_EFFICIENT_FFS)
	if (static_branch_likely(&efficient_ffs_key))
		return binary_gcd(a, b);
#endif
```

`__ffs` が速い CPU なら `binary_gcd` に任せて終わりです。ここから下は、その道がないときのやり方です。

### 共通の 2 のべき乗 `r` と、`b` の準備

```c:line-numbers=63
	r &= -r;

	while (!(b & r))
		b >>= 1;
	if (b == r)
		return r;
```

`r &= -r` で、`r` を「共通する 2 のべき乗」にします。`a | b` の最下位ビットは、`a` と `b` の末尾の 0 の数の少ないほうに一致するからです。
続く `while (!(b & r))` のループで、`r` のビットが立つまで `b` を右にずらします。こうすると `b` は「`r` × 奇数」の形になります。以下、`r` を 1 単位として考えると、`a` と `b` を奇数として扱えます。

### 引き算と 2 ビットの削り

```c:line-numbers=70
	for (;;) {
		while (!(a & r))
			a >>= 1;
		if (a == r)
			return r;
		if (a == b)
			return a;

		if (a < b)
			swap(a, b);
		a -= b;
		a >>= 1;
		if (a & r)
			a += b;
		a >>= 1;
	}
```

1. `while (!(a & r))`: `a` も同じように「`r` × 奇数」の形にします。
2. 2 つの `if`: `a` が `r`（奇数部分が 1）か、`a == b` なら答えです。
3. `swap` と `a -= b;`: 大きいほうを `a` にして `a -= b`。奇数どうしの差は偶数です。
4. `a >>= 1;` から 2 度目の `a >>= 1;` まで: ここが小技です。差を 2 で割り、それがまだ奇数なら `b` を足してから、もう一度 2 で割ります。

4 の意味を `r = 1` で考えます。`a - b` を 2 で割った値 `(a - b) / 2` が奇数なら、奇数の `b` を足すと `(a + b) / 2` になって偶数になります。どちらにしても、もう 1 回 2 で割れます。
最大公約数は奇数なので、2 で割っても、`b` を足しても変わりません。つまり 1 周で必ず 2 ビット削れます。

### 具体例: `gcd(21, 15)`（`r = 1`）

- `a = 21, b = 15`。`a -= b` で `6`。`6 >> 1 = 3` は奇数なので `3 + 15 = 18`、`18 >> 1 = 9`。
- 次の周: `a = 9`。`9 < 15` なので入れ替えて `a = 15, b = 9`。`a = 6`、`3` は奇数なので `+9` で `12`、`>> 1` で `6`。
- 次の周: `while (!(a & r))` で `a = 3`。`3 < 9` なので入れ替えて `a = 9, b = 3`。`a = 6`、`3` が奇数なので `+3` で `6`、`>> 1` で `3`。
- 次の周: `a == b == 3` なので 3 を返します。

## ここがすごい

- **割り算なし、特殊な命令もなし**: 足し算・引き算・1 ビットシフト・AND だけなので、どんな CPU でも速く動きます。`gcd()` の直前のコメントのとおり、正規化（末尾の 0 を削る）をループでしかできないなら、この偶数／奇数のやり方が有利です。
- **1 周で 2 ビット進む工夫**: 差を作ったあと、ふつうは次の周で 1 ビットずつ削ります。この 4 行は、`b` を足すかどうかの判断 1 回で、確実に 2 ビット目まで削れる形にしています。ループの回数が減ります。
- **2 の因数を「単位」にする発想**: 共通の 2 のべき乗 `r` を最初に求め、`a & r` のように**`r` のビット**を見ることで、2 のべき乗を割ったり掛け戻したりする手間をなくしています。最後に `r` や `a` をそのまま返すと、2 のべき乗が自然に含まれています。
- **静的キーで実装を選ぶ**: 速い命令があるかどうかは起動時に決まるので、毎回の if ではなく静的キーで選んでいます。

## まとめ

- `gcd(a, b) = gcd(a - b, b)`、さらに奇数の公約数は 2 で割っても `b` を足しても変わらない。
- 奇数どうしの差は、`b` を足すかどうかで必ず 4 で割れる形にできる。
- 共通の 2 のべき乗を「単位」にすると、割り戻しや掛け戻しが不要になる。
- ハードウェアに合わせて実装を切り替えつつ、どちらでも正しく動くようにしている。
