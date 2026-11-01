---
title: "コピーした末尾を返す stpcpy と、8 バイトずつの複写"
description: "文字列をコピーし、コピー先の終端の位置を返す関数。戻り値のおかげで連結が速く書ける。0 のバイトを含まない 8 バイトはまとめて書き写す。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/stpcpy.c
lines: [10, 27]
function: "__stpcpy"
difficulty: 2
format: 2
tags: [ビット演算, 最適化, 文字列処理, API設計]
---

## ひとことで

`stpcpy(d, s)` は、文字列 `s` を `d` にコピーし、**コピー先の終端（0 のバイト）の位置** を返します。
`strcpy` は `d` の先頭を返しますが、`stpcpy` は末尾を返すので、`p = stpcpy(p, "foo"); p = stpcpy(p, "bar");` のように連結を続けて書けます。
musl の実装は、終端を含まない 8 バイトを丸ごとコピーして高速化しています。

## コード

```c:line-numbers=10
char *__stpcpy(char *restrict d, const char *restrict s)
{
#ifdef __GNUC__
	typedef size_t __attribute__((__may_alias__)) word;
	word *wd;
	const word *ws;
	if ((uintptr_t)s % ALIGN == (uintptr_t)d % ALIGN) {
		for (; (uintptr_t)s % ALIGN; s++, d++)
			if (!(*d=*s)) return d;
		wd=(void *)d; ws=(const void *)s;
		for (; !HASZERO(*ws); *wd++ = *ws++);
		d=(void *)wd; s=(const void *)ws;
	}
#endif
	for (; (*d=*s); s++, d++);

	return d;
}
```

同じファイルの先頭のマクロを使っています（`HASZERO(x)` は `x` に 0 のバイトがあれば 0 以外）。ファイル末尾の `weak_alias` で、`__stpcpy` が `stpcpy` という名前でも使えます。

```c:line-numbers=5
#define ALIGN (sizeof(size_t))
#define ONES ((size_t)-1/UCHAR_MAX)
#define HIGHS (ONES * (UCHAR_MAX/2+1))
#define HASZERO(x) ((x)-ONES & ~(x) & HIGHS)
```

## 前提知識

- **C の文字列**: 文字の並びの最後に値 0 のバイトを置いたものです。コピーするときは、この終端も一緒にコピーします。
- **ポインタ**: `char *d` はコピー先、`const char *s` はコピー元の場所です。`*d=*s` で 1 文字コピーします。
- **代入式の値**: `(*d=*s)` は、コピーした文字そのものを値として持ちます。終端の 0 をコピーしたときに偽になります。
- **`*wd++ = *ws++`**: `ws` が指す 8 バイトを `wd` が指す場所に書き、両方を 8 バイト進めます。
- **`restrict`**: コピー元とコピー先が重ならないという約束です。
- **`#ifdef __GNUC__` と `__may_alias__`**: GCC 系コンパイラのときだけ有効な部分と、「別の型として重ねて読み書きしてよい」という指定です。
- **アドレスの余り**: `(uintptr_t)s % ALIGN` は、アドレスを 8 で割った余りです。

## 何をしているか

### 1. 両方を同時に整列できるか

```c:line-numbers=16
	if ((uintptr_t)s % ALIGN == (uintptr_t)d % ALIGN) {
```

`s` と `d` の「8 で割った余り」が同じなら、両方を同時に 8 の倍数の位置にそろえられます。

### 2. 整列まで 1 文字ずつ

```c:line-numbers=17
		for (; (uintptr_t)s % ALIGN; s++, d++)
			if (!(*d=*s)) return d;
```

余りが 0 になるまで 1 文字ずつコピーします。途中で終端をコピーしたら、その場所 `d` を返します。

### 3. 8 バイトずつ

```c:line-numbers=19
		wd=(void *)d; ws=(const void *)s;
		for (; !HASZERO(*ws); *wd++ = *ws++);
		d=(void *)wd; s=(const void *)ws;
```

`HASZERO(*ws)` が 0、つまり **この 8 バイトに終端が含まれない** 間は、8 バイトまるごとをコピーして進みます。たとえば `"Hello, world!"` なら、整列した位置からの 8 バイトに終端がなければ一度にコピーされます。

終端を含む 8 バイトに当たったら止め、ポインタを 1 バイト単位に戻します。

### 4. 残りを 1 文字ずつ

```c:line-numbers=24
	for (; (*d=*s); s++, d++);

	return d;
```

`(*d=*s)` が 0 になる（終端をコピーする）まで進み、終端を書いた位置 `d` を返します。ここでは `d` を進める前にループが止まるので、`d` はちょうど終端の場所を指しています。

## ここがすごい

- **連結が線形時間になる API**: `strcat` で文字列を 3 つつなぐと、毎回コピー先の先頭から終端を探し直します。`stpcpy` は終端の位置を返すので、次のコピーをそこから始めるだけで済みます。長い文字列を何十回もつなぐ処理で差が大きくなります。
- **8 バイトに終端がないなら、丸ごと書いてよい**: 終端を含む 8 バイトは、終端より後ろのゴミまで書いてしまうので、まとめて書けません。`HASZERO` で事前に確かめているので、書いてよい 8 バイトだけを一度に書いています。
- **戻り値が 3 か所で一致する**: 整列中のループと最後のループのどちらから抜けても、`d` は終端を書いた場所を指します。返す値の意味を全経路でそろえているので、呼び出し側は場合分けを気にする必要がありません。
- **素直な版が常に残っている**: GCC 以外では `#ifdef __GNUC__` の部分が消え、`for (; (*d=*s); s++, d++);` の 1 行だけの実装になります。高速化は「あれば使う」追加分として書かれています。

## まとめ

- `stpcpy` は「終端の位置」を返すので、連結を繰り返す処理が速く書ける。
- 0 を含まない 8 バイトは、そのまま丸ごとコピーしてよい。
- どの経路で抜けても戻り値の意味が同じになるよう書くと、使う側が楽になる。
