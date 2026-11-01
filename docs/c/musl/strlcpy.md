---
title: "切り詰めても「本来の長さ」を返す安全なコピー strlcpy"
description: "バッファの大きさを超えないように文字列をコピーする BSD 由来の関数。必ず終端を付け、戻り値はコピー元の長さなので、切り詰めが起きたかを呼び出し側が判定できる。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/strlcpy.c
lines: [11, 34]
function: "strlcpy"
difficulty: 2
format: 2
tags: [文字列処理, 防御的プログラミング, API設計, ビット演算]
---

## ひとことで

`strlcpy(dst, src, size)` は、文字列 `src` を大きさ `size` のバッファ `dst` にコピーします。入りきらない分は切り捨て、**必ず最後に終端の 0 を付けます**。
戻り値は `src` の長さです。`strlcpy(buf, "hello", 4)` なら `buf` は `"hel"` になり、戻り値は `5` です。戻り値が `size` 以上なら「切り詰められた」とわかります。
musl の実装は、ここでも 8 バイトずつコピーする技を使っています。

## コード

```c:line-numbers=11
size_t strlcpy(char *d, const char *s, size_t n)
{
	char *d0 = d;
	size_t *wd;

	if (!n--) goto finish;
#ifdef __GNUC__
	typedef size_t __attribute__((__may_alias__)) word;
	const word *ws;
	if (((uintptr_t)s & ALIGN) == ((uintptr_t)d & ALIGN)) {
		for (; ((uintptr_t)s & ALIGN) && n && (*d=*s); n--, s++, d++);
		if (n && *s) {
			wd=(void *)d; ws=(const void *)s;
			for (; n>=sizeof(size_t) && !HASZERO(*ws);
			       n-=sizeof(size_t), ws++, wd++) *wd = *ws;
			d=(void *)wd; s=(const void *)ws;
		}
	}
#endif
	for (; n && (*d=*s); n--, s++, d++);
	*d = 0;
finish:
	return d-d0 + strlen(s);
}
```

同じファイルの先頭のマクロを使っています（`HASZERO(x)` は `x` に 0 のバイトがあれば 0 以外）。

```c:line-numbers=6
#define ALIGN (sizeof(size_t)-1)
#define ONES ((size_t)-1/UCHAR_MAX)
#define HIGHS (ONES * (UCHAR_MAX/2+1))
#define HASZERO(x) ((x)-ONES & ~(x) & HIGHS)
```

## 前提知識

- **C の文字列**: 文字の並びの最後に値 0 のバイトを置いたものです。終端がないと、どこまでが文字列かわからず、読む側がバッファの外まで読んでしまいます。
- **バッファ**: データを入れておくための、大きさの決まった配列です。`char buf[4]` は 4 バイトなので、文字は 3 文字と終端までしか入りません。
- **`!n--`**: `n--` は「`n` の値を使ってから 1 減らす」です。`!n--` は「`n` が 0 だったか」を調べ、同時に `n` を 1 減らします。
- **`goto finish`**: `finish:` というラベルの場所へ処理を飛ばします。
- **`(*d=*s)`**: コピーした文字の値を持つ式です。終端の 0 をコピーしたときに偽になり、ループが止まります。
- **ポインタの引き算**: `d-d0` は、コピーした文字数です。
- **`size_t`**: 大きさを表す符号なし整数です。

## 何をしているか

### 1. 終端の分を先に取っておく

```c:line-numbers=16
	if (!n--) goto finish;
```

`size` が 0 なら 1 バイトも書けないので、`finish` に飛んで `src` の長さだけを返します。0 でなければ `n--` で、`n` を「文字として書ける数」（終端の 1 バイトを除いた数）にします。`size = 4` なら `n = 3` です。

### 2. 8 バイトずつコピー

```c:line-numbers=20
	if (((uintptr_t)s & ALIGN) == ((uintptr_t)d & ALIGN)) {
		for (; ((uintptr_t)s & ALIGN) && n && (*d=*s); n--, s++, d++);
		if (n && *s) {
			wd=(void *)d; ws=(const void *)s;
			for (; n>=sizeof(size_t) && !HASZERO(*ws);
			       n-=sizeof(size_t), ws++, wd++) *wd = *ws;
			d=(void *)wd; s=(const void *)ws;
		}
	}
```

`src` と `dst` の整列のずれが同じなら、整列するまで 1 バイトずつコピーし、そのあと `HASZERO(*ws)` で「終端を含まない 8 バイト」を確認しながら、`n` が 8 以上ある間だけ 8 バイトずつコピーします。

### 3. 残りを 1 バイトずつ、最後に終端

```c:line-numbers=30
	for (; n && (*d=*s); n--, s++, d++);
	*d = 0;
```

`n` が尽きるか、終端の 0 をコピーするまで 1 バイトずつコピーします。そのあと `*d = 0` で必ず終端を書きます。切り詰めた場合はここで初めて終端が付き、そうでない場合は同じ位置に 0 を書き直すだけです。

### 4. 本来の長さを返す

```c:line-numbers=33
	return d-d0 + strlen(s);
```

`d-d0` はコピーした文字数、`strlen(s)` は **コピーしきれなかった残り** の長さです。`s` はコピーした分だけ進んでいるからです。足すと `src` 全体の長さになります。`"hello"` を `size = 4` でコピーした例では、`3 + strlen("lo") = 5` です。

## ここがすごい

- **`strncpy` の落とし穴を避ける API**: `strncpy` は入りきらないとき終端を付けず、短いときは残りを 0 で埋めます。`strlcpy` は必ず終端を付け、余分な 0 埋めもしません。
- **切り詰めの検出が簡単**: 戻り値が「本来の長さ」なので、`if (strlcpy(buf, s, sizeof buf) >= sizeof buf)` と書くだけで切り詰めを検出でき、必要なバッファの大きさ（戻り値 + 1）もわかります。
- **長さの計算を分割している**: 先に `strlen(src)` を呼んでからコピーすると、`src` を最後まで 2 回読むことになります。この実装は「コピーした分」と「残りの分」に分けて数えるので、入りきる場合は残りが 0 文字で、`strlen` はすぐ終わります。
- **`n--` 1 つで境界を管理**: 終端の分を最初に引いておくので、以降のループは「`n` が 0 になったら止まる」だけで、終端を書く場所が必ずバッファ内に残ります。

## まとめ

- 安全な文字列コピーは「必ず終端を付ける」「切り詰めを知らせる」の 2 点が大事。
- 戻り値を「必要だった長さ」にすると、呼び出し側が切り詰めを判断できる。
- 終端の 1 バイトを先に確保すれば、境界チェックが単純になる。
- 長さは「処理済み + 残り」に分けて数えると、読み込みの重複を避けられる。
