---
title: "重なりの判定を 1 回の符号なし比較で済ませる memmove"
description: "重なっているかもしれない領域どうしでもメモリを正しくコピーする関数。重ならない場合は memcpy に任せる判定を、引き算と比較 1 回で行う巧妙な式が見どころ。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/memmove.c
lines: [9, 42]
function: "memmove"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, メモリ管理, 標準ライブラリ]
---

## ひとことで

`memmove(dest, src, n)` は、`src` から `n` バイトを `dest` へコピーします。`memcpy` と違い、**2 つの領域が重なっていても** 正しく動くのが特徴です。
たとえば配列 `"abcdef"` の先頭 4 バイトを 1 つ後ろへずらす（`memmove(a+1, a, 4)` → `"aabcdf"`）ような処理で使います。
musl は「重なっていなければ memcpy」の判定を、たった 1 つの式で書いています。

## コード

```c:line-numbers=9
void *memmove(void *dest, const void *src, size_t n)
{
	char *d = dest;
	const char *s = src;

	if (d==s) return d;
	if ((uintptr_t)s-(uintptr_t)d-n <= -2*n) return memcpy(d, s, n);

	if (d<s) {
#ifdef __GNUC__
		if ((uintptr_t)s % WS == (uintptr_t)d % WS) {
			while ((uintptr_t)d % WS) {
				if (!n--) return dest;
				*d++ = *s++;
			}
			for (; n>=WS; n-=WS, d+=WS, s+=WS) *(WT *)d = *(WT *)s;
		}
#endif
		for (; n; n--) *d++ = *s++;
	} else {
#ifdef __GNUC__
		if ((uintptr_t)s % WS == (uintptr_t)d % WS) {
			while ((uintptr_t)(d+n) % WS) {
				if (!n--) return dest;
				d[n] = s[n];
			}
			while (n>=WS) n-=WS, *(WT *)(d+n) = *(WT *)(s+n);
		}
#endif
		while (n) n--, d[n] = s[n];
	}

	return dest;
}
```

関数の前で、8 バイトずつコピーするための型 `WT` と、その大きさ `WS` が定義されています。

```c:line-numbers=4
#ifdef __GNUC__
typedef __attribute__((__may_alias__)) size_t WT;
#define WS (sizeof(WT))
#endif
```

## 前提知識

- **ポインタ**: `char *d` は 1 バイト単位でメモリを指す場所です。`*d++ = *s++` は「`s` の 1 バイトを `d` に書いて、両方を 1 つ進める」です。`d[n]` は `d` から `n` バイト先です。
- **`void *`**: 型を決めないポインタです。`memmove` はどんなデータでもコピーできるよう `void *` で受け取ります。
- **`uintptr_t`**: アドレスを符号なし整数として扱う型です。
- **符号なし整数の引き算**: 符号なし整数で `3 - 5` を計算すると、負にならず「一周して」とても大きな数になります（64 ビットなら 2⁶⁴ − 2）。`-2*n` も同様に、2⁶⁴ − 2n という大きな数を表します。
- **重なりの問題**: 前から順にコピーすると、`dest` が `src` より後ろで重なっているとき、まだ読んでいない `src` の部分を先に上書きしてしまいます。そのときは後ろからコピーする必要があります。
- **`(WT *)d`**: `d` の場所を 8 バイトの整数として読み書きする型変換です。

## 何をしているか

### 1. 同じ場所なら何もしない

```c:line-numbers=14
	if (d==s) return d;
```

`d==s` なら、コピーしても結果は変わらないので、すぐに返します。

### 2. 重なっていなければ memcpy

```c:line-numbers=15
	if ((uintptr_t)s-(uintptr_t)d-n <= -2*n) return memcpy(d, s, n);
```

`(uintptr_t)s-(uintptr_t)d-n <= -2*n` が成り立つのは、**2 つの領域が重ならないとき** です。
`x = s - d`（符号なし）とおくと、重なるのは `s` と `d` の距離が `n` 未満のとき、つまり `x` が `0〜n-1` か、「一周して」`2⁶⁴-n+1〜2⁶⁴-1` のときです。この範囲から `n` を引くと、ちょうど `2⁶⁴-2n+1` 以上の範囲にまとまります。だから「`x - n` が `-2n`（＝ 2⁶⁴−2n）以下」なら重ならない、と 1 回の比較で判定できます。

`n = 4` で確かめます。`d = 100, s = 102` なら `x - n = -2` で、これは 2⁶⁴−2 という大きな数なので条件は偽（重なる）です。`s = 110` なら `x - n = 6` で、条件は真（重ならない）になり、`memcpy` に任せます。

### 3. dest が前にあるなら前からコピー

```c:line-numbers=17
	if (d<s) {
#ifdef __GNUC__
		if ((uintptr_t)s % WS == (uintptr_t)d % WS) {
			while ((uintptr_t)d % WS) {
				if (!n--) return dest;
				*d++ = *s++;
			}
			for (; n>=WS; n-=WS, d+=WS, s+=WS) *(WT *)d = *(WT *)s;
		}
#endif
		for (; n; n--) *d++ = *s++;
```

`d<s` のときは、前から順に書いても未読の `src` を上書きしません。2 つのアドレスの「8 で割った余り」が同じなら、まず余りが 0 になるまで 1 バイトずつコピーし、そのあと 8 バイトずつコピーします。残りは 1 バイトずつです。

### 4. dest が後ろにあるなら後ろからコピー

```c:line-numbers=28
	} else {
#ifdef __GNUC__
		if ((uintptr_t)s % WS == (uintptr_t)d % WS) {
			while ((uintptr_t)(d+n) % WS) {
				if (!n--) return dest;
				d[n] = s[n];
			}
			while (n>=WS) n-=WS, *(WT *)(d+n) = *(WT *)(s+n);
		}
#endif
		while (n) n--, d[n] = s[n];
	}
```

`d[n] = s[n]` の形で、末尾から先頭へ向かってコピーします。まず「`d+n`（末尾）が 8 の倍数になるまで」1 バイトずつ、次に 8 バイトずつ、最後に残りを処理します。`n--` を先に行ってからコピーしているので、`d[n]` は常に未コピーの最後のバイトです。

## ここがすごい

- **場合分けが式 1 つに**: 素直に書くと `s + n <= d || d + n <= s` の 2 回の比較になり、さらにアドレスの足し算があふれる心配もあります。符号なし整数の「一周する」性質を使うと、引き算 2 回と比較 1 回で済み、あふれも問題になりません。
- **よくある場合は memcpy へ**: 実際の呼び出しの多くは重ならない領域どうしです。それを最初に見分けて、環境ごとに最適化された `memcpy` に任せることで、`memmove` 自身は重なる場合の処理だけに集中できます。
- **向きを変えるだけで安全**: 重なるときは、`dest` が前なら前から、後ろなら後ろからコピーすれば、まだ読んでいないバイトを壊しません。8 バイトずつのコピーでも同じ順序を守っているので安全です。
- **整列できるときだけまとめる**: 余りが違うと、片方を整列させてももう片方がずれたままになります。`(uintptr_t)s % WS == (uintptr_t)d % WS` の条件で、まとめ読みが効く場合だけ使っています。

## まとめ

- 重なる領域のコピーは、向き（前から / 後ろから）を選べば安全にできる。
- 符号なし整数の引き算は「距離」と「向き」を 1 つの数にまとめられる。
- 一般的なケースは専用の速い関数に任せ、特殊なケースだけを自前で処理する。
