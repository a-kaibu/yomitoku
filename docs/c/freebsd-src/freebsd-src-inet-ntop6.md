---
title: "いちばん長い 0 の並びを「::」に縮める IPv6 アドレスの文字列化"
description: "16 バイトの IPv6 アドレスを \"2001:db8::1\" のような文字列にする inet_ntop6。最長の 0 の連続を 1 回の走査で見つけ、そこだけを :: に置き換え、IPv4 を埋め込んだアドレスは末尾をドット区切りで書く。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: ISC
copyright: "Copyright (c) 2004 by Internet Systems Consortium, Inc. ('ISC'); Copyright (c) 1996-1999 by Internet Software Consortium."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/inet/inet_ntop.c
lines: [115, 191]
function: "inet_ntop6"
difficulty: 2
format: 2
tags: [ネットワーク, 文字列処理, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`inet_ntop6` は、IPv6 アドレス（16 バイトの数値）を、人が読める文字列に変換する内部関数です。`inet_ntop()` から呼ばれます。
IPv6 アドレスは 16 ビットずつ 8 つの区切りを `:` でつないで書きますが、0 が続く部分は `::` に省略できます。たとえば `2001:db8:0:0:0:0:0:1` は `2001:db8::1` になります。
ただし `::` は 1 か所しか使えないので、**いちばん長い 0 の並び** を選ぶ必要があります。この関数はそれを短いループで見つけています。

## コード

::: code-group

```c:line-numbers=115 [日本語訳]
	/*
	 * 前処理:
	 * 入力の（バイト単位の）配列を、ワード単位の配列にコピーする。
	 * :: で省略するために、src[] の中で最も長い 0x00 の並びを探す。
	 */
	memset(words, '\0', sizeof words);
	for (i = 0; i < NS_IN6ADDRSZ; i++)
		words[i / 2] |= (src[i] << ((1 - (i % 2)) << 3));
	best.base = -1;
	best.len = 0;
	cur.base = -1;
	cur.len = 0;
	for (i = 0; i < (NS_IN6ADDRSZ / NS_INT16SZ); i++) {
		if (words[i] == 0) {
			if (cur.base == -1)
				cur.base = i, cur.len = 1;
			else
				cur.len++;
		} else {
			if (cur.base != -1) {
				if (best.base == -1 || cur.len > best.len)
					best = cur;
				cur.base = -1;
			}
		}
	}
	if (cur.base != -1) {
		if (best.base == -1 || cur.len > best.len)
			best = cur;
	}
	if (best.base != -1 && best.len < 2)
		best.base = -1;

	/*
	 * 結果を組み立てる。
	 */
	tp = tmp;
	for (i = 0; i < (NS_IN6ADDRSZ / NS_INT16SZ); i++) {
		/* 最長の 0x00 の並びの中にいるか？ */
		if (best.base != -1 && i >= best.base &&
		    i < (best.base + best.len)) {
			if (i == best.base)
				*tp++ = ':';
			continue;
		}
		/* 先頭の 0x00 の並びの後か、実際の 16 進数の後か？ */
		if (i != 0)
			*tp++ = ':';
		/* このアドレスは IPv4 を埋め込んだものか？ */
		if (i == 6 && best.base == 0 && (best.len == 6 ||
		    (best.len == 7 && words[7] != 0x0001) ||
		    (best.len == 5 && words[5] == 0xffff))) {
			if (!inet_ntop4(src+12, tp, sizeof tmp - (tp - tmp))) {
				errno = ENOSPC;
				return (NULL);
			}
			tp += strlen(tp);
			break;
		}
		tp += sprintf(tp, "%x", words[i]);
	}
	/* 末尾が 0x00 の並びだったか？ */
	if (best.base != -1 && (best.base + best.len) == 
	    (NS_IN6ADDRSZ / NS_INT16SZ))
		*tp++ = ':';
	*tp++ = '\0';

	/*
	 * あふれていないか確かめ、コピーして終わり。
	 */
	if ((socklen_t)(tp - tmp) > size) {
		errno = ENOSPC;
		return (NULL);
	}
	strcpy(dst, tmp);
	return (dst);
}
```

```c:line-numbers=115 [原文]
	/*
	 * Preprocess:
	 *	Copy the input (bytewise) array into a wordwise array.
	 *	Find the longest run of 0x00's in src[] for :: shorthanding.
	 */
	memset(words, '\0', sizeof words);
	for (i = 0; i < NS_IN6ADDRSZ; i++)
		words[i / 2] |= (src[i] << ((1 - (i % 2)) << 3));
	best.base = -1;
	best.len = 0;
	cur.base = -1;
	cur.len = 0;
	for (i = 0; i < (NS_IN6ADDRSZ / NS_INT16SZ); i++) {
		if (words[i] == 0) {
			if (cur.base == -1)
				cur.base = i, cur.len = 1;
			else
				cur.len++;
		} else {
			if (cur.base != -1) {
				if (best.base == -1 || cur.len > best.len)
					best = cur;
				cur.base = -1;
			}
		}
	}
	if (cur.base != -1) {
		if (best.base == -1 || cur.len > best.len)
			best = cur;
	}
	if (best.base != -1 && best.len < 2)
		best.base = -1;

	/*
	 * Format the result.
	 */
	tp = tmp;
	for (i = 0; i < (NS_IN6ADDRSZ / NS_INT16SZ); i++) {
		/* Are we inside the best run of 0x00's? */
		if (best.base != -1 && i >= best.base &&
		    i < (best.base + best.len)) {
			if (i == best.base)
				*tp++ = ':';
			continue;
		}
		/* Are we following an initial run of 0x00s or any real hex? */
		if (i != 0)
			*tp++ = ':';
		/* Is this address an encapsulated IPv4? */
		if (i == 6 && best.base == 0 && (best.len == 6 ||
		    (best.len == 7 && words[7] != 0x0001) ||
		    (best.len == 5 && words[5] == 0xffff))) {
			if (!inet_ntop4(src+12, tp, sizeof tmp - (tp - tmp))) {
				errno = ENOSPC;
				return (NULL);
			}
			tp += strlen(tp);
			break;
		}
		tp += sprintf(tp, "%x", words[i]);
	}
	/* Was it a trailing run of 0x00's? */
	if (best.base != -1 && (best.base + best.len) == 
	    (NS_IN6ADDRSZ / NS_INT16SZ))
		*tp++ = ':';
	*tp++ = '\0';

	/*
	 * Check for overflow, copy, and we're done.
	 */
	if ((socklen_t)(tp - tmp) > size) {
		errno = ENOSPC;
		return (NULL);
	}
	strcpy(dst, tmp);
	return (dst);
}
```

:::

## 前提知識

- **IPv6 アドレス**: 128 ビット（16 バイト）の番号です。16 ビット（2 バイト）ずつ 8 個の「ワード」に分け、それぞれを 16 進数で書いて `:` でつなぎます。
- **`u_char *src`**: アドレスの 16 バイトを指すポインタ（メモリ上の場所）です。`src[i]` で i 番目のバイトを読めます。
- **`NS_IN6ADDRSZ` / `NS_INT16SZ`**: 16（アドレスのバイト数）と 2（ワードのバイト数）を表す定数です。`NS_IN6ADDRSZ / NS_INT16SZ` は 8 です。
- **`struct { int base, len; }`**: 名前のない構造体で、「0 の並びの開始位置」と「長さ」を組にします。`best = cur;` で 2 つの値をまとめてコピーできます。
- **シフト `<<`**: ビットを左にずらす演算です。`x << 8` は 256 倍です。
- **`sprintf(tp, "%x", n)`**: 数 `n` を 16 進数の文字列にして `tp` に書き、書いた文字数を返します。
- **カンマ演算子**: `cur.base = i, cur.len = 1;` は、2 つの代入を順に行う 1 つの文です。

## 何をしているか

### 1. バイトをワードにまとめる

```c:line-numbers=120
	memset(words, '\0', sizeof words);
	for (i = 0; i < NS_IN6ADDRSZ; i++)
		words[i / 2] |= (src[i] << ((1 - (i % 2)) << 3));
```
偶数番目のバイトを上位 8 ビット、奇数番目を下位 8 ビットとして 8 個のワードを作ります。
`(1 - (i % 2)) << 3` は、`i` が偶数なら 8、奇数なら 0 です。

### 2. いちばん長い 0 の並びを探す

```c:line-numbers=123
	best.base = -1;
	best.len = 0;
	cur.base = -1;
	cur.len = 0;
	for (i = 0; i < (NS_IN6ADDRSZ / NS_INT16SZ); i++) {
		if (words[i] == 0) {
			if (cur.base == -1)
				cur.base = i, cur.len = 1;
			else
				cur.len++;
		} else {
			if (cur.base != -1) {
				if (best.base == -1 || cur.len > best.len)
					best = cur;
				cur.base = -1;
			}
		}
	}
	if (cur.base != -1) {
		if (best.base == -1 || cur.len > best.len)
			best = cur;
	}
	if (best.base != -1 && best.len < 2)
		best.base = -1;
```
`cur` が今たどっている 0 の並び、`best` がこれまでの最長です。
0 のワードが来たら `cur` を始めるか伸ばし、0 でないワードが来たら `cur` を閉じて、`best` より長ければ入れ替えます。ループの後で、末尾まで 0 が続いていた場合も同じ判定をします。
長さが 1 の並びは `::` にしません。`:0:` と書いても `::` と書いても同じ長さなので、省略しない決まりです。

### 3. 文字列を組み立てる

```c:line-numbers=151
	tp = tmp;
	for (i = 0; i < (NS_IN6ADDRSZ / NS_INT16SZ); i++) {
		/* Are we inside the best run of 0x00's? */
		if (best.base != -1 && i >= best.base &&
		    i < (best.base + best.len)) {
			if (i == best.base)
				*tp++ = ':';
			continue;
		}
		/* Are we following an initial run of 0x00s or any real hex? */
		if (i != 0)
			*tp++ = ':';
```
ワードを順に書きます。最長の並びの中は飛ばし、その先頭で `:` を 1 つだけ書きます。それ以外は、2 番目以降のワードの前に `:` を付けて 16 進数で書きます。
並びが末尾まで続く場合、最後に `:` をもう 1 つ足して `::` にします。

例: ワードが `2001, db8, 0, 0, 0, 0, 0, 1` なら、`best` は位置 2 から長さ 5。
`2001` → `:db8` → 位置 2 で `:` → 位置 3〜6 は飛ばす → `:1`。結果は `2001:db8::1` です。

### 4. IPv4 を埋め込んだアドレス

```c:line-numbers=164
		if (i == 6 && best.base == 0 && (best.len == 6 ||
		    (best.len == 7 && words[7] != 0x0001) ||
		    (best.len == 5 && words[5] == 0xffff))) {
			if (!inet_ntop4(src+12, tp, sizeof tmp - (tp - tmp))) {
				errno = ENOSPC;
				return (NULL);
			}
			tp += strlen(tp);
			break;
		}
```
先頭 6 ワードが 0 のアドレス（`::1.2.3.4`）や、`::ffff:1.2.3.4` の形は、最後の 4 バイトを `inet_ntop4` でドット区切りの IPv4 形式で書きます。`::1`（ループバック）は IPv4 と誤解されないよう `words[7] != 0x0001` で除外しています。

### 5. 大きさを確かめてコピー

```c:line-numbers=185
	if ((socklen_t)(tp - tmp) > size) {
		errno = ENOSPC;
		return (NULL);
	}
	strcpy(dst, tmp);
	return (dst);
```
いったん十分大きな `tmp` に作ってから、呼び出し側のバッファ `dst` に収まるか確かめてコピーします。

## ここがすごい

- **1 回の走査で最長を見つける**: 「今の並び」と「最長の並び」の 2 つだけを持って進むので、何度も配列を見直さずに済みます。同じ長さの並びが複数あれば、`cur.len > best.len`（等号なし）によって先に出てきたほうが選ばれます。
- **ポインタの型変換をしない理由**: 関数冒頭のコメントは、16 バイトを `uint16_t` の配列として直接読む方法（ポインタの重ね合わせ）を使わなかった理由を説明しています。16 ビットの整数型がない計算機もあるからです。バイトから組み立てる方法は、バイト順（エンディアン）の違いにも左右されません。
- **最大の長さで一時領域を用意する**: 一時領域 `tmp` は、`sizeof "ffff:...:255.255.255.255"` という **最も長くなる文字列そのもの** で大きさを決めています。数字を手で数える必要がなく、読む人にも意図が伝わります。
- **途中で失敗しない組み立て**: 書き込みは必ず十分な大きさの `tmp` に行い、最後に一度だけ `dst` の大きさを調べます。途中で何度も残りの長さを確かめるより、コードが単純になります。

## まとめ

- 「今の並び」と「最長の並び」を持って 1 回走査すれば、最長の連続区間が見つかる。
- 長さ 1 の 0 は省略しない、末尾の並びは `::` で終わる、など境界の決まりを個別に処理する。
- バイトから整数を組み立てれば、エンディアンや型の大きさに依存しない。
- 一時領域の大きさは「最長の例の文字列」の `sizeof` で書くと、間違いにくく読みやすい。
