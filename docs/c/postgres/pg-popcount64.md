---
title: "分割統治で 1 のビットを数える popcount、掛け算 1 回で総和をとる"
description: "64 ビット整数の中の 1 のビット数を数える関数。2 ビット、4 ビット、8 ビットと区画を広げながら並列に足し、最後は掛け算で 8 バイト分の合計を一気に集める。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2019-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/include/port/pg_bitutils.h
lines: [316, 335]
function: "pg_popcount64"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, アルゴリズム]
---

## ひとことで

`pg_popcount64` は、64 ビットの整数の中に **1 のビットがいくつあるか**（population count、popcount）を返します。
たとえば `word = 0xF0`（`11110000`）なら `4` です。
ループで 1 ビットずつ数えるのではなく、ビット全体を「小さな箱の並び」と見なして、すべての箱を同時に足し合わせる技を使っています。PostgreSQL ではビットマップの集計などで使われます。

## コード

::: code-group

```c:line-numbers=316 [日本語訳]
/*
 * pg_popcount64
 *	word の中で立っている 1 のビットの数を返す
 *
 * 次のページを元にしている:
 * https://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel.
 *
 * 人気のあるコンパイラの新しい版は、可能ならこれを自動的に専用の
 * popcount 命令に置き換えてくれるので、わざわざ
 * 組み込み関数や intrinsics は使わない。
 */
static inline int
pg_popcount64(uint64 word)
{
	word -= (word >> 1) & UINT64CONST(0x5555555555555555);
	word = (word & UINT64CONST(0x3333333333333333)) +
		((word >> 2) & UINT64CONST(0x3333333333333333));
	word = (word + (word >> 4)) & UINT64CONST(0xf0f0f0f0f0f0f0f);
	return (word * UINT64CONST(0x101010101010101)) >> 56;
}
```

```c:line-numbers=316 [原文]
/*
 * pg_popcount64
 *		Return the number of 1 bits set in word
 *
 * Adapted from
 * https://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetParallel.
 *
 * Note that newer versions of popular compilers will automatically replace
 * this with a special popcount instruction if possible, so we don't bother
 * using builtin functions or intrinsics.
 */
static inline int
pg_popcount64(uint64 word)
{
	word -= (word >> 1) & UINT64CONST(0x5555555555555555);
	word = (word & UINT64CONST(0x3333333333333333)) +
		((word >> 2) & UINT64CONST(0x3333333333333333));
	word = (word + (word >> 4)) & UINT64CONST(0xf0f0f0f0f0f0f0f);
	return (word * UINT64CONST(0x101010101010101)) >> 56;
}
```

:::

## 前提知識

- **`uint64`**: 符号なし 64 ビット整数です。
- **`UINT64CONST(...)`**: 定数を 64 ビット整数として書くための PostgreSQL のマクロです。環境によって必要な接尾辞（`ULL` など）を付けてくれます。
- **16 進数の定数**: `0x5555...` は 2 進数で `0101 0101 ...`、`0x3333...` は `0011 0011 ...`、`0x0f0f...` は `0000 1111 ...` です。「どの位置のビットを取り出すか」を表すマスクとして使います。
- **`&`、`>>`、`-=`**: `&` はビットごとの AND、`>>` は右シフト、`word -= x` は `word = word - x` の短い書き方です。
- **符号なし整数の掛け算のあふれ**: 符号なし整数の計算が範囲を超えると、上の桁は捨てられます（2⁶⁴ で割った余りになる）。C ではこれが規格で決まった動作なので、安心して利用できます。

## 何をしているか

8 ビットの例 `word = 11011010`（1 が 5 個）で、64 ビットの場合も同じことが起きると考えて追います。

### 1. 2 ビットずつの個数にする

```c:line-numbers=330
	word -= (word >> 1) & UINT64CONST(0x5555555555555555);
```

`(word >> 1) & 0x55...` は、2 ビットの箱ごとに「上のビット」を取り出します。それを `word` から引くと、各 2 ビットの箱に「その 2 ビットの中の 1 の個数」が入ります。
2 ビットの値 `ab` は数値として `2a + b`、上のビットは `a` なので、引くと `a + b` になる、という仕掛けです。
`11 01 10 10` → `10 01 01 01`（2, 1, 1, 1）。

### 2. 4 ビットずつに足す

```c:line-numbers=331
	word = (word & UINT64CONST(0x3333333333333333)) +
		((word >> 2) & UINT64CONST(0x3333333333333333));
```

`word & 0x33...` で各 4 ビットの箱の下 2 ビット、`(word >> 2) & 0x33...` で上 2 ビットを取り出して足します。
`(2+1) (1+1)` → `0011 0010`（3, 2）。

### 3. 8 ビットずつに足す

```c:line-numbers=333
	word = (word + (word >> 4)) & UINT64CONST(0xf0f0f0f0f0f0f0f);
```

`word + (word >> 4)` で隣の 4 ビットを足し、`& 0x0f0f...` で各バイトの下 4 ビットだけを残します。1 バイトの中の 1 の個数は最大 8 なので、4 ビットに収まります。
`3 + 2 = 5` → `00000101`。

### 4. 掛け算で 8 バイトの合計を集める

```c:line-numbers=334
	return (word * UINT64CONST(0x101010101010101)) >> 56;
```

ここで各バイトにそのバイトの個数が入っています。`0x0101010101010101` を掛けると、各バイトを「自分より上のバイトすべてに足し込む」ことになり、**一番上のバイトに 8 バイト全部の合計** が集まります。`>> 56` でその一番上のバイトを取り出せば答えです。合計は最大 64 なので 1 バイトに収まり、途中の桁あふれで壊れることもありません。

## ここがすごい

- **ループも分岐もない**: 素直に書くと 64 回ループし、そのたびに条件分岐が入ります。この方法はシフト・AND・足し算・掛け算をあわせて十数回の演算だけで、入力によって手数が変わりません。
- **SWAR（レジスタ内の並列計算）**: 1 つの 64 ビット整数を、32 個の 2 ビット箱、16 個の 4 ビット箱、8 個の 8 ビット箱…と見なし、箱ごとの足し算を一度に行います。箱があふれない大きさを保ちながら区画を倍々に広げていくのがポイントです。
- **掛け算を「足し合わせ装置」として使う**: 最後の段で 8 個のバイトを足すには、シフトと足し算を 3 回繰り返す方法もあります。掛け算 1 回に置き換えると命令数が減ります。
- **組み込み関数をあえて使わない理由**: 関数の前のコメントによれば、新しいコンパイラはこの書き方を見抜いて CPU の popcount 命令に置き換えてくれるので、組み込み関数や特殊命令を直接書く必要がない、という判断です。移植性の高い C のまま、速いマシン語を得られます。

## まとめ

- 1 のビットの数は、2 ビット → 4 ビット → 8 ビットと箱を広げながら並列に足すと速く数えられる。
- 2 ビットの箱では `x - (x >> 1)` が「1 の個数」になる。
- `0x0101...01` を掛けると、全バイトの合計が一番上のバイトに集まる。
- 定番の書き方で書いておけば、コンパイラが専用命令に置き換えてくれることがある。
