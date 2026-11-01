---
title: "空き領域探しで、邪魔なビットの「一番後ろ」へ一気に飛ぶ"
description: "ビットマップから、0 が nr 個連続し、かつ指定のアラインメントに合う領域を探す関数。候補の中で最後に 1 になっているビットを探し、そこから先へ飛んで探索を続ける。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/bitmap.c
lines: [432, 472]
function: "bitmap_find_next_zero_area_off"
difficulty: 3
format: 2
tags: [探索, ビット演算, メモリ管理, アルゴリズム]
---

## ひとことで

`bitmap_find_next_zero_area_off` は、使用中を 1、空きを 0 で表したビットマップの中から、**0 が `nr` 個続いている場所**を探す関数です。
メモリやデバイスの番号など、「連続した空き」を割り当てたいときに使います。開始位置は「8 の倍数」のような**アラインメント**（そろえ方）の条件にも合わせます。
候補の範囲に 1 があったら、その範囲で**最後の 1 の直後**まで一気に飛ぶのが工夫です。

## コード

::: code-group

```c:line-numbers=432 [日本語訳]
/**
 * bitmap_find_next_zero_area_off - 連続し、アラインされた 0 の領域を探す
 * @map: 探索の基準となるアドレス
 * @size: ビットマップの大きさ（ビット数）
 * @start: 探索を始めるビット番号
 * @nr: 探している 0 のビットの個数
 * @align_mask: 0 の領域のアラインメントのマスク
 * @align_offset: 0 の領域のアラインメントのオフセット。
 *
 * @align_mask は 2 のべき乗より 1 小さい値にする。その結果、
 * この関数が見つける 0 の領域のビット位置に @align_offset を足したものは
 * その 2 のべき乗の倍数になる。
 *
 * 戻り値: 見つかった領域のビット位置。見つからなければ @size 以上の
 * 値。
 */
unsigned long bitmap_find_next_zero_area_off(unsigned long *map,
					     unsigned long size,
					     unsigned long start,
					     unsigned int nr,
					     unsigned long align_mask,
					     unsigned long align_offset)
{
	unsigned long end, i, off;

	for_each_clear_bit_from(start, map, size) {
		start = __ALIGN_MASK(start + align_offset, align_mask) - align_offset;
		end = start + nr;
		if (end > size)
			break;

		off = round_down(start, BITS_PER_LONG);
		i = find_last_bit(map + start / BITS_PER_LONG, end - off) + off;
		if (i >= end || i < start)
			return start;

		start = i;
	}

	return size;
}
```

```c:line-numbers=432 [原文]
/**
 * bitmap_find_next_zero_area_off - find a contiguous aligned zero area
 * @map: The address to base the search on
 * @size: The bitmap size in bits
 * @start: The bitnumber to start searching at
 * @nr: The number of zeroed bits we're looking for
 * @align_mask: Alignment mask for zero area
 * @align_offset: Alignment offset for zero area.
 *
 * The @align_mask should be one less than a power of 2; the effect is that
 * the bit offset of all zero areas this function finds plus @align_offset
 * is multiple of that power of 2.
 *
 * Return: The bit offset of the found area or a value greater than or equal
 * to @size if no area is found.
 */
unsigned long bitmap_find_next_zero_area_off(unsigned long *map,
					     unsigned long size,
					     unsigned long start,
					     unsigned int nr,
					     unsigned long align_mask,
					     unsigned long align_offset)
{
	unsigned long end, i, off;

	for_each_clear_bit_from(start, map, size) {
		start = __ALIGN_MASK(start + align_offset, align_mask) - align_offset;
		end = start + nr;
		if (end > size)
			break;

		off = round_down(start, BITS_PER_LONG);
		i = find_last_bit(map + start / BITS_PER_LONG, end - off) + off;
		if (i >= end || i < start)
			return start;

		start = i;
	}

	return size;
}
```

:::

## 前提知識

- **ビットマップ**: `unsigned long` の配列を 0/1 の長い列として使うデータ構造です。
- **`for_each_clear_bit_from(start, map, size)`**: カーネルのマクロで、`start` から先の「0 のビット」を順に `start` に入れてくり返します。中身は `for (; (start) = find_next_zero_bit(map, size, start), (start) < size; (start)++)` で、ループの最後に `start++` してから、次の 0 を探し直します。
- **`find_last_bit(addr, n)`**: `addr` から `n` ビットの中で、最後に 1 になっているビットの位置を返します。1 がなければ `n` を返します。
- **`__ALIGN_MASK(x, mask)`**: `x` を、`mask + 1`（2 のべき乗）の倍数に切り上げます。中身は `(x + mask) & ~mask` です。
- **`round_down(x, y)`**: `x` を `y` の倍数に切り下げます。
- **ポインタの足し算**: `map + k` は「`map[k]` の場所」です。
- **`BITS_PER_LONG`**: 1 語のビット数（64 か 32）です。

## 何をしているか

### 0 のビットから候補を始める

```c:line-numbers=457
	for_each_clear_bit_from(start, map, size) {
```

`start` 以降の最初の 0 のビットが、候補の始まりです。

### アラインメントに合わせ、はみ出しを調べる

```c:line-numbers=458
		start = __ALIGN_MASK(start + align_offset, align_mask) - align_offset;
		end = start + nr;
		if (end > size)
			break;
```

`start + align_offset` が `align_mask + 1` の倍数になるように、`start` を切り上げます。`align_offset` は、ビットマップの 0 番が実際の番号の途中から始まる場合のずれです。
候補の終わり `end = start + nr` が全体の大きさを超えたら、見つからなかったので抜けます。

### 候補の中に 1 があるか、1 回で調べる

```c:line-numbers=463
		off = round_down(start, BITS_PER_LONG);
		i = find_last_bit(map + start / BITS_PER_LONG, end - off) + off;
		if (i >= end || i < start)
			return start;
```

`off` は `start` を含む語の先頭のビット番号です。そこから `end` までの範囲で、最後の 1 を `find_last_bit` で探します。

- 1 がなければ、戻り値は `end` 以上になります。
- 1 が `start` より前（同じ語の中の、候補より手前）にしかなければ、候補の中は全部 0 です。

どちらでも、`start` が答えです。

### 最後の 1 まで飛ぶ

```c:line-numbers=468
		start = i;
```

候補の中に 1 があれば、`start` をその**最後の 1** の位置にします。ループの `start++` と `find_next_zero_bit` で、その次の 0 から探し直します。

### 具体例

`nr = 4`、アラインメントなし（`align_mask = 0`）で、ビットマップの先頭が `0 0 1 0 1 0 0 0 0 1` とします。

- `start = 0` が候補。0〜3 番に最後の 1 があるか調べると 2 番。`start = 2` にし、次の 0 は 3 番。
- `start = 3` が候補。3〜6 番の最後の 1 は 4 番。次の 0 は 5 番。
- `start = 5` が候補。5〜8 番には 1 がないので、`5` を返します。

## ここがすごい

- **最初の 1 ではなく最後の 1 へ**: 候補の中に 1 がいくつあっても、その手前から始まる領域はすべて失敗します。最後の 1 まで飛べば、無駄な候補を一度にまとめて捨てられます。
- **語の先頭から探す理由**: `find_last_bit` は語の境目から数えたほうが効率よく動きます。そのため `off` まで切り下げて探し、手前に見つかった 1 は `if (i >= end || i < start)` の `i < start` で「候補の外」として無視しています。
- **ビット単位の作業を語単位の関数に任せる**: 0 を探すのも 1 を探すのも、語ごとにまとめて調べる関数に任せているので、この関数自体には 1 ビットずつのループがありません。
- **見つからないことを `size` で表す**: 失敗を特別な値（-1 など）ではなく `size` 以上の値で返すので、呼び出し側は `if (pos >= size)` と書くだけで判定できます。カーネルのビット探索関数全体で同じ約束になっています。

## まとめ

- 連続した空きを探すときは、邪魔なものの「最後」まで飛ぶと無駄な候補を減らせる。
- アラインメントは `(x + mask) & ~mask` で切り上げられる。
- 語単位で動く探索関数を組み合わせると、ビット単位のループを書かずに済む。
- 「見つからない」は範囲外の値で返すと、判定が簡単になる。
