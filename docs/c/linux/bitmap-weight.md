---
title: "「何を数えるか」を式ごと渡すマクロで、5 つの関数を 1 行ずつに"
description: "ビットマップの 1 の数を数える処理を、語を取り出す式 FETCH を引数にとるマクロで共通化。AND や OR の結果を数える関数、書き込みながら数える関数まで 1 行で書ける。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/bitmap.c
lines: [343, 388]
function: "BITMAP_WEIGHT"
difficulty: 3
format: 2
tags: [マクロ, メタプログラミング, ビット演算, 設計パターン]
---

## ひとことで

`BITMAP_WEIGHT` は、ビットマップ（`unsigned long` の配列をビットの列として使うもの）の中の **1 の数**を数えるためのマクロです。
おもしろいのは、引数に「数える語（ワード）を取り出す**式**」`FETCH` を渡すところです。
`bitmap[idx]` を渡せば普通の個数、`bitmap1[idx] & bitmap2[idx]` を渡せば「両方で 1 のビットの数」になります。これで 5 つの関数を、それぞれ 1 行で定義しています。

## コード

```c:line-numbers=343
#define BITMAP_WEIGHT(FETCH, bits)	\
({										\
	unsigned int __bits = (bits), idx, w = 0;				\
										\
	for (idx = 0; idx < __bits / BITS_PER_LONG; idx++)			\
		w += hweight_long(FETCH);					\
										\
	if (__bits % BITS_PER_LONG)						\
		w += hweight_long((FETCH) & BITMAP_LAST_WORD_MASK(__bits));	\
										\
	w;									\
})

unsigned int __bitmap_weight(const unsigned long *bitmap, unsigned int bits)
{
	return BITMAP_WEIGHT(bitmap[idx], bits);
}
EXPORT_SYMBOL(__bitmap_weight);

unsigned int __bitmap_weight_and(const unsigned long *bitmap1,
				const unsigned long *bitmap2, unsigned int bits)
{
	return BITMAP_WEIGHT(bitmap1[idx] & bitmap2[idx], bits);
}
EXPORT_SYMBOL(__bitmap_weight_and);

unsigned int __bitmap_weight_andnot(const unsigned long *bitmap1,
				const unsigned long *bitmap2, unsigned int bits)
{
	return BITMAP_WEIGHT(bitmap1[idx] & ~bitmap2[idx], bits);
}
EXPORT_SYMBOL(__bitmap_weight_andnot);

unsigned int __bitmap_weighted_or(unsigned long *dst, const unsigned long *bitmap1,
				  const unsigned long *bitmap2, unsigned int bits)
{
	return BITMAP_WEIGHT(({dst[idx] = bitmap1[idx] | bitmap2[idx]; dst[idx]; }), bits);
}
EXPORT_SYMBOL(__bitmap_weighted_or);

unsigned int __bitmap_weighted_xor(unsigned long *dst, const unsigned long *bitmap1,
				  const unsigned long *bitmap2, unsigned int bits)
{
	return BITMAP_WEIGHT(({dst[idx] = bitmap1[idx] ^ bitmap2[idx]; dst[idx]; }), bits);
}
EXPORT_SYMBOL(__bitmap_weighted_xor);
```

## 前提知識

- **`#define` マクロ**: コンパイル前の文字の置き換えです。引数つきマクロでは、渡した文字列（式）が**そのまま**埋め込まれます。関数と違い、値ではなく「式の書き方」を渡せます。
- **行末の `\`**: マクロの定義を次の行に続けるための記号です。
- **文式（statement expression）`({ ... })`**: GCC の拡張機能で、波かっこの中に文を並べ、**最後の式の値**を全体の値にできます。このマクロでは、最後の `w;` が結果になります。
- **`hweight_long(x)`**: 1 語の中の 1 の数を返す関数です。
- **`BITMAP_LAST_WORD_MASK(bits)`**: 最後の語のうち、有効な下位ビットだけが 1 のマスクです。
- **`BITS_PER_LONG`**: 1 語のビット数（64 か 32）です。
- **`~`、`&`、`|`、`^`**: ビットの反転、AND、OR、XOR（違えば 1）です。

## 何をしているか

### マクロ本体

```c:line-numbers=343
#define BITMAP_WEIGHT(FETCH, bits)	\
({										\
	unsigned int __bits = (bits), idx, w = 0;				\
										\
	for (idx = 0; idx < __bits / BITS_PER_LONG; idx++)			\
		w += hweight_long(FETCH);					\
										\
	if (__bits % BITS_PER_LONG)						\
		w += hweight_long((FETCH) & BITMAP_LAST_WORD_MASK(__bits));	\
										\
	w;									\
})
```

- `unsigned int __bits = (bits), idx, w = 0;				\`: `bits` を一度だけ評価して `__bits` に入れ、添字 `idx` と合計 `w` を用意します。
- `for` ループ: まるごと使える語の数だけ、`FETCH` で語を取り出して 1 の数を足します。`FETCH` の中には `idx` が書かれているので、ループのたびに違う語になります。
- `if (__bits % BITS_PER_LONG)`: 端数があれば、最後の語をマスクして、有効なビットだけを数えます。
- `w;									\`: `w` が全体の値になります。

### 普通の個数、AND、AND NOT

```c:line-numbers=356
unsigned int __bitmap_weight(const unsigned long *bitmap, unsigned int bits)
{
	return BITMAP_WEIGHT(bitmap[idx], bits);
}
EXPORT_SYMBOL(__bitmap_weight);

unsigned int __bitmap_weight_and(const unsigned long *bitmap1,
				const unsigned long *bitmap2, unsigned int bits)
{
	return BITMAP_WEIGHT(bitmap1[idx] & bitmap2[idx], bits);
}
EXPORT_SYMBOL(__bitmap_weight_and);

unsigned int __bitmap_weight_andnot(const unsigned long *bitmap1,
				const unsigned long *bitmap2, unsigned int bits)
{
	return BITMAP_WEIGHT(bitmap1[idx] & ~bitmap2[idx], bits);
}
EXPORT_SYMBOL(__bitmap_weight_andnot);
```

- `__bitmap_weight` は `bitmap[idx]` を渡すだけです。
- `__bitmap_weight_and` は `bitmap1[idx] & bitmap2[idx]` を渡します。2 つのビットマップの共通部分の大きさが、一時的な配列を作らずに求まります。
- `__bitmap_weight_andnot` は「1 番目にあって 2 番目にない」ビットの数です。

### 書き込みながら数える

```c:line-numbers=376
unsigned int __bitmap_weighted_or(unsigned long *dst, const unsigned long *bitmap1,
				  const unsigned long *bitmap2, unsigned int bits)
{
	return BITMAP_WEIGHT(({dst[idx] = bitmap1[idx] | bitmap2[idx]; dst[idx]; }), bits);
}
EXPORT_SYMBOL(__bitmap_weighted_or);

unsigned int __bitmap_weighted_xor(unsigned long *dst, const unsigned long *bitmap1,
				  const unsigned long *bitmap2, unsigned int bits)
{
	return BITMAP_WEIGHT(({dst[idx] = bitmap1[idx] ^ bitmap2[idx]; dst[idx]; }), bits);
}
EXPORT_SYMBOL(__bitmap_weighted_xor);
```

`__bitmap_weighted_or` では、`FETCH` 自体が文式になっています。`dst[idx] = bitmap1[idx] | bitmap2[idx]; dst[idx];` で、OR の結果を `dst` に書き込み、その値を数えるために返します。1 回の走査で「OR を計算して保存」と「1 の数を数える」を同時に行います。

### 具体例

64 ビット環境、`bits = 70`、`bitmap1 = {0xFF, 0x3F}`、`bitmap2 = {0x0F, 0xFF}` で `__bitmap_weight_and` を呼ぶと:

- `idx = 0`: `0xFF & 0x0F = 0x0F` で 4 個。
- 端数 6 ビット: `0x3F & 0xFF = 0x3F`、マスク（下位 6 ビット）をかけて 6 個。
- 合計 `10` を返します。

## ここがすごい

- **「ループの中身」をマクロ引数にする**: 普通の関数では、ループの中で何をするかを変えるには関数ポインタを渡す必要があり、呼び出しのコストがかかります。マクロなら式がそのまま埋め込まれるので、関数ポインタなしで、手で書いたのと同じ速さのコードになります。
- **共通部分の誤りが 1 か所に**: 最後の語のマスク処理は忘れやすいところです。ここに 1 回だけ書けば、5 つの関数すべてで正しくなります。
- **一時配列がいらない**: AND の結果を数えるために、いったん AND した配列を作る必要がありません。読み込み 2 回と AND 1 回をしながら数えるだけです。
- **トレードオフ**: `FETCH` が `idx` という名前の変数に頼っているなど、マクロの中身を知らないと書けない「約束」があります。マクロはファイルの中だけで使われ、外には出していません。

## まとめ

- マクロには値ではなく「式」を渡せるので、ループの中身を差し替える道具として使える。
- GCC の文式 `({ ... })` を使うと、複数の文を含むマクロが値を返せる。
- 端数処理のような間違えやすい部分は、共通のマクロに 1 回だけ書く。
- 「計算しながら数える」と、一時的な配列も 2 回目の走査も不要になる。
