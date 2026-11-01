---
title: "「最初の語」「途中の語」「最後の語」を 1 つのループで塗るビット列操作"
description: "ビットマップの start から len 個のビットを 1 にする関数。端の語だけ部分的なマスクを使い、途中の語はまるごと塗る。マスクは引き算と AND だけで作る。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/bitmap.c
lines: [390, 408]
function: "__bitmap_set"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, イディオム]
---

## ひとことで

`__bitmap_set(map, start, len)` は、たくさんのビットを並べたビットマップ（整数の配列を、0/1 の長い列として使うデータ構造）の、`start` 番目から `len` 個のビットを 1 にする関数です。
1 ビットずつ立てれば簡単ですが、それでは遅いので、**整数 1 個（64 ビット）ずつまとめて**処理します。
範囲の両端だけが「語の一部だけを塗る」特別な場合になりますが、それを 1 つのループでうまく扱っています。

## コード

```c:line-numbers=390
void __bitmap_set(unsigned long *map, unsigned int start, int len)
{
	unsigned long *p = map + BIT_WORD(start);
	const unsigned int size = start + len;
	int bits_to_set = BITS_PER_LONG - (start % BITS_PER_LONG);
	unsigned long mask_to_set = BITMAP_FIRST_WORD_MASK(start);

	while (len - bits_to_set >= 0) {
		*p |= mask_to_set;
		len -= bits_to_set;
		bits_to_set = BITS_PER_LONG;
		mask_to_set = ~0UL;
		p++;
	}
	if (len) {
		mask_to_set &= BITMAP_LAST_WORD_MASK(size);
		*p |= mask_to_set;
	}
}
```

使われているマクロは `include/linux/bitmap.h` にあります。

<!-- source: include/linux/bitmap.h -->
```c:line-numbers=240
#define BITMAP_FIRST_WORD_MASK(start) (~0UL << ((start) & (BITS_PER_LONG - 1)))
#define BITMAP_LAST_WORD_MASK(nbits) (~0UL >> (-(nbits) & (BITS_PER_LONG - 1)))
```

## 前提知識

- **ビットマップ**: `unsigned long` の配列を、ビットの並びとして使います。64 ビット環境なら、`map[0]` に 0〜63 番、`map[1]` に 64〜127 番のビットが入ります。この 1 個ぶんを「語（ワード）」と呼びます。
- **`BITS_PER_LONG`**: 1 語のビット数（64 か 32）です。
- **`BIT_WORD(start)`**: `start` 番のビットが何番目の語にあるか（`start / BITS_PER_LONG`）です。
- **ポインタの足し算**: `map + 2` は「`map[2]` の場所」です。`*p |= m` はその語に `m` を OR で重ね、`p++` で次の語へ進みます。
- **`~0UL`**: すべてのビットが 1 の `unsigned long` です。
- **`<<` と `>>`**: ビットを左右にずらします。空いたところには 0 が入ります。
- **`int` と `unsigned int`**: `len` は符号付き（マイナスになれる）の `int` です。これがループの終わり方に関係します。

## 何をしているか

以下、64 ビット環境で `start = 60`、`len = 10`（60〜69 番を 1 にする）とします。

### 最初の語の準備

```c:line-numbers=392
	unsigned long *p = map + BIT_WORD(start);
	const unsigned int size = start + len;
	int bits_to_set = BITS_PER_LONG - (start % BITS_PER_LONG);
	unsigned long mask_to_set = BITMAP_FIRST_WORD_MASK(start);
```

- `p` は `start` を含む語 `map[0]` を指します。
- `size = 70` は範囲の終わり（含まない）です。
- `bits_to_set = 64 − 60 = 4` は、最初の語で塗るビット数です。
- `mask_to_set` は `BITMAP_FIRST_WORD_MASK(60)` で、全ビット 1 を 60 ビット左にずらしたもの、つまり 60〜63 番だけが 1 のマスクです。

### 語をまるごと（または後ろ全部）塗る

```c:line-numbers=397
	while (len - bits_to_set >= 0) {
		*p |= mask_to_set;
		len -= bits_to_set;
		bits_to_set = BITS_PER_LONG;
		mask_to_set = ~0UL;
		p++;
	}
```

「残りの `len` が、この語で塗る数以上ある」間くり返します。
1 周目は `10 − 4 >= 0` なので、`map[0]` の 60〜63 番を塗り、`len = 6` にします。以後は語の先頭からなので、`bits_to_set = 64`、マスクは全ビット 1 にして次の語へ進みます。
2 周目は `6 − 64 < 0` なのでループを抜けます。

### 最後の語の一部

```c:line-numbers=404
	if (len) {
		mask_to_set &= BITMAP_LAST_WORD_MASK(size);
		*p |= mask_to_set;
	}
```

まだ `len = 6` が残っています。`BITMAP_LAST_WORD_MASK(70)` は「70 を 64 で割った余りの 6 ビットぶん、下から 1」のマスクです。全ビット 1 のマスクと AND して `map[1]` の 0〜5 番（全体の 64〜69 番）を塗ります。

範囲が 1 つの語に収まる場合（たとえば `start = 3`、`len = 5`）は、ループに入らず、最初のマスク（3 番以上）と最後のマスク（8 番未満）の AND で 3〜7 番だけを塗ります。

## ここがすごい

- **3 種類の語を 1 つのループで**: 「最初の語」は部分的、「途中の語」はまるごと、「最後の語」は部分的です。最初の語のマスクと塗る数を初期値にし、1 周目のあとで「まるごと」に切り替えることで、場合分けを 1 つのループと最後の if に収めています。
- **`-(nbits) & 63` という技**: 最後の語のマスクは、「64 から（余り）を引いた数」だけ全ビット 1 を右にずらせば作れます。`-(nbits) & 63` は、`64 − (nbits % 64)` を 64 で割った余りと同じ値です。割り算も引き算の場合分けもなく、余りが 0（語の終わりちょうど）のときも全ビット 1 という正しいマスクになります。
- **符号付きの `len` で終わりを判定**: `len - bits_to_set >= 0` は、`len` が `int` なので、足りないときに正しくマイナスになります。符号なしだと大きな正の数になってしまうので、型の選び方にも意味があります。
- **同じ形の兄弟**: すぐ下の `__bitmap_clear` は、`|=` を `&= ~` に変えただけの同じ形です。

## まとめ

- ビット列の範囲操作は、語単位でまとめると速い。部分的に塗るのは両端の語だけ。
- 「この位置以上」のマスクは `~0UL << 位置`、「下から n ビット」のマスクは `~0UL >> (-n & 63)` で作れる。
- 初期値を最初の語用にして、ループ内で一般の値に切り替えると、場合分けが減る。
- 「足りなくなったら終わり」の判定には、マイナスになれる符号付き整数を使う。
