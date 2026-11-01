---
title: "何千ビットもある整数を左にずらす：語単位と端数に分けるシフト"
description: "複数の語からなる長いビット列を、任意のビット数だけ左にずらす関数。ずらし量を「語の数」と「端数」に分け、後ろから処理することで同じ配列の中でも安全に動く。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/bitmap.c
lines: [126, 160]
function: "__bitmap_shift_left"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, アルゴリズム]
---

## ひとことで

`__bitmap_shift_left` は、`unsigned long` の配列で表した長いビット列（ビットマップ）を、`shift` ビットだけ左（大きい番号の方向）へずらす関数です。
1 つの整数なら `x << shift` で済みますが、ビット列は何語にもまたがっています。そこで、ずらし量を「語まるごと何個ぶんか」と「1 語未満の端数」に分け、隣の語からはみ出してくるビットを組み合わせて作ります。

## コード

::: code-group

```c:line-numbers=126 [日本語訳]
/**
 * __bitmap_shift_left - ビットマップのビットの論理左シフト
 *   @dst : 書き込み先のビットマップ
 *   @src : 元のビットマップ
 *   @shift : ずらすビット数
 *   @nbits : ビットマップの大きさ（ビット数）
 *
 * 左シフト（掛け算）とは、ビットを LS から MS の
 * 方向へ動かすこと。空いた LS 側の位置には 0 が入り、
 * 上の MS 側からはみ出したビットは失われる。
 */

void __bitmap_shift_left(unsigned long *dst, const unsigned long *src,
			unsigned int shift, unsigned int nbits)
{
	int k;
	unsigned int lim = BITS_TO_LONGS(nbits);
	unsigned int off = shift/BITS_PER_LONG, rem = shift % BITS_PER_LONG;
	for (k = lim - off - 1; k >= 0; --k) {
		unsigned long upper, lower;

		/*
		 * shift が語の境目にそろっていなければ、下の語の上位 rem ビットを
		 * 取り、結果の下位 rem ビットにする。
		 */
		if (rem && k > 0)
			lower = src[k - 1] >> (BITS_PER_LONG - rem);
		else
			lower = 0;
		upper = src[k] << rem;
		dst[k + off] = lower | upper;
	}
	if (off)
		memset(dst, 0, off*sizeof(unsigned long));
}
```

```c:line-numbers=126 [原文]
/**
 * __bitmap_shift_left - logical left shift of the bits in a bitmap
 *   @dst : destination bitmap
 *   @src : source bitmap
 *   @shift : shift by this many bits
 *   @nbits : bitmap size, in bits
 *
 * Shifting left (multiplying) means moving bits in the LS -> MS
 * direction.  Zeros are fed into the vacated LS bit positions
 * and those MS bits shifted off the top are lost.
 */

void __bitmap_shift_left(unsigned long *dst, const unsigned long *src,
			unsigned int shift, unsigned int nbits)
{
	int k;
	unsigned int lim = BITS_TO_LONGS(nbits);
	unsigned int off = shift/BITS_PER_LONG, rem = shift % BITS_PER_LONG;
	for (k = lim - off - 1; k >= 0; --k) {
		unsigned long upper, lower;

		/*
		 * If shift is not word aligned, take upper rem bits of
		 * word below and make them the bottom rem bits of result.
		 */
		if (rem && k > 0)
			lower = src[k - 1] >> (BITS_PER_LONG - rem);
		else
			lower = 0;
		upper = src[k] << rem;
		dst[k + off] = lower | upper;
	}
	if (off)
		memset(dst, 0, off*sizeof(unsigned long));
}
```

:::

## 前提知識

- **ビットマップ**: `unsigned long` の配列をビットの列として使います。64 ビット環境なら `src[0]` が 0〜63 番、`src[1]` が 64〜127 番です。番号が大きいほうを「上」と呼びます。
- **`BITS_PER_LONG`**: 1 語のビット数（64 か 32）です。
- **`BITS_TO_LONGS(nbits)`**: `nbits` ビットを入れるのに必要な語の数（切り上げ）です。
- **`/` と `%`**: 割り算の商と余りです。
- **`<<` と `>>`**: 左・右へのビットシフトです。はみ出したビットは捨てられ、空いたところには 0 が入ります。
- **`memset(p, 0, n)`**: `p` から `n` バイトを 0 で埋める標準関数です。`&dst[k]` は `dst[k]` の場所です。
- **`int k` と `--k`**: `k` は符号付きなので、0 から 1 を引くと -1 になり、`k >= 0` が偽になってループが止まります。

## 何をしているか

### ずらし量を分解

```c:line-numbers=142
	unsigned int lim = BITS_TO_LONGS(nbits);
	unsigned int off = shift/BITS_PER_LONG, rem = shift % BITS_PER_LONG;
```

`lim` は語の数です。`off = shift / 64` が「語まるごと何個ずらすか」、`rem = shift % 64` が端数です。`shift = 70` なら `off = 1`、`rem = 6` です。

### 上の語から順に作る

```c:line-numbers=144
	for (k = lim - off - 1; k >= 0; --k) {
		unsigned long upper, lower;

		/*
		 * If shift is not word aligned, take upper rem bits of
		 * word below and make them the bottom rem bits of result.
		 */
		if (rem && k > 0)
			lower = src[k - 1] >> (BITS_PER_LONG - rem);
		else
			lower = 0;
		upper = src[k] << rem;
		dst[k + off] = lower | upper;
	}
```

結果の `dst[k + off]` は、元の `src[k]` を `rem` ビット左にずらしたもの（`upper = src[k] << rem;`）に、1 つ下の語 `src[k − 1]` の上位 `rem` ビットを下に持ってきたもの（`lower = src[k - 1] >> (BITS_PER_LONG - rem);`）を OR で合わせたものです。
`rem` が 0 のときや、`k` が 0（下の語がない）のときは、下から来るビットはありません（`if (rem && k > 0)` の分岐）。

ループは `k = lim − off − 1` から 0 へ向かって、**上の語から順に**進みます。`k + off` が `lim` 以上になる語は、配列からはみ出すので最初から作りません。

### 空いた下の語を 0 にする

```c:line-numbers=158
	if (off)
		memset(dst, 0, off*sizeof(unsigned long));
```

まるごとずらした分、`dst[0]` から `off` 個の語は空になるので、0 で埋めます。

### 具体例

64 ビット環境、`lim = 2`、`shift = 4`（`off = 0`、`rem = 4`）で、`src = {0xF000000000000001, 0x0}` とします。

- `k = 1`: `lower = src[0] >> 60 = 0xF`、`upper = src[1] << 4 = 0`。`dst[1] = 0xF`。
- `k = 0`: 下の語はないので `lower = 0`、`upper = src[0] << 4 = 0x10`。`dst[0] = 0x10`。

`src[0]` の上 4 ビットが `dst[1]` の下 4 ビットへ、1 番のビットが 5 番へ移りました。

## ここがすごい

- **同じ配列の中でもずらせる**: `dst` と `src` が同じ配列でも、上の語から順に作れば、まだ読む必要のある下の語を書きつぶしません。`dst[k + off]` に書き込むとき、読み終えた `src[k]` 以上の語にしか触れないからです。コピー用の一時的な配列が要りません。
- **境界の扱いがすっきり**: 「下の語がない」「端数がない」場合を `if (rem && k > 0)`の 1 つの条件にまとめています。特に `rem = 0` のとき `src[k - 1] >> 64` を計算しないのは大切です。C では、型のビット数以上のシフトは結果が決まっていない（未定義動作）からです。
- **はみ出す語を最初から作らない**: ループの開始を `lim − off − 1` にすることで、捨てられる語の計算をしません。
- **右シフトとの対比**: 直前の `__bitmap_shift_right` は、逆に下の語から順に作ります。ずらす向きと処理の順番を逆にするのが、重なった領域を安全に扱うための定石です（`memmove` と同じ考え方です）。

## まとめ

- 長いビット列のシフトは、「語単位のずらし」と「語の中の端数のずらし」に分けて考える。
- 結果の各語は、元の語の一部と隣の語からはみ出したビットを OR で合わせて作る。
- 左へずらすなら上から、右へずらすなら下から処理すると、同じ配列の中でも壊れない。
- 型の幅以上のシフト（`x >> 64` など）は C では未定義なので、場合分けで避ける。
