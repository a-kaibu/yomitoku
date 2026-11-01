---
title: "「この文字まで」コピーする memccpy を 8 バイトずつ"
description: "指定した文字が出てくるまで、または指定バイト数までコピーする関数。コピーと検索を同時に行い、XOR と HASZERO で 8 バイト単位にまとめて処理する。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/memccpy.c
lines: [10, 34]
function: "memccpy"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, メモリ管理, 標準ライブラリ]
---

## ひとことで

`memccpy(dest, src, c, n)` は、`src` から `dest` へバイトをコピーしていき、値 `c` のバイトをコピーした時点で止まります。`c` が見つからなければ `n` バイトで止まります。
戻り値は、`c` が見つかったなら `dest` の中で **`c` の直後** の位置、見つからなければ `NULL` です。
たとえば `memccpy(buf, "ab:cd", ':', 5)` は `buf` に `"ab:"` をコピーし、`buf+3` を返します。

## コード

```c:line-numbers=10
void *memccpy(void *restrict dest, const void *restrict src, int c, size_t n)
{
	unsigned char *d = dest;
	const unsigned char *s = src;

	c = (unsigned char)c;
#ifdef __GNUC__
	typedef size_t __attribute__((__may_alias__)) word;
	word *wd;
	const word *ws;
	if (((uintptr_t)s & ALIGN) == ((uintptr_t)d & ALIGN)) {
		for (; ((uintptr_t)s & ALIGN) && n && (*d=*s)!=c; n--, s++, d++);
		if ((uintptr_t)s & ALIGN) goto tail;
		size_t k = ONES * c;
		wd=(void *)d; ws=(const void *)s;
		for (; n>=sizeof(size_t) && !HASZERO(*ws^k);
		       n-=sizeof(size_t), ws++, wd++) *wd = *ws;
		d=(void *)wd; s=(const void *)ws;
	}
#endif
	for (; n && (*d=*s)!=c; n--, s++, d++);
tail:
	if (n) return d+1;
	return 0;
}
```

同じファイルの先頭で定義されているマクロを使っています（`HASZERO(x)` は `x` に 0 のバイトがあれば 0 以外）。

```c:line-numbers=5
#define ALIGN (sizeof(size_t)-1)
#define ONES ((size_t)-1/UCHAR_MAX)
#define HIGHS (ONES * (UCHAR_MAX/2+1))
#define HASZERO(x) ((x)-ONES & ~(x) & HIGHS)
```

## 前提知識

- **ポインタ**: `unsigned char *d` は 1 バイト単位でメモリを指します。`*d=*s` は「`s` の場所の値を `d` の場所に書く」です。
- **代入式の値**: `(*d=*s)!=c` は、コピーしたあと、コピーした値が `c` と違うかを調べています。コピーと判定を 1 つの式で行えます。
- **`restrict`**: `dest` と `src` が重ならないという約束です（重なる場合の動作は保証されません）。
- **`goto`**: 指定したラベル（ここでは `tail:`）へ処理を飛ばす文です。
- **XOR**: 同じ値どうしを XOR すると 0 になります。`*ws^k` は、`c` と同じバイトを 0 に変えます。
- **`ONES * c`**: 全バイトに `c` を並べた整数を作ります。`c = ':'`（0x3a）なら `0x3a3a3a3a3a3a3a3a` です。
- **`word *wd`**: 8 バイトの整数を指すポインタです。`*wd = *ws` で 8 バイトを一度にコピーします。

## 何をしているか

### 1. 整列できるか調べる

```c:line-numbers=20
	if (((uintptr_t)s & ALIGN) == ((uintptr_t)d & ALIGN)) {
```

`src` と `dest` のアドレスの「8 で割った余り」が同じなら、両方を同時に 8 の倍数の位置にそろえられます。違うときは 8 バイトずつの処理を諦め、最後の 1 バイトずつのループだけを使います。

### 2. 整列まで 1 バイトずつ

```c:line-numbers=21
		for (; ((uintptr_t)s & ALIGN) && n && (*d=*s)!=c; n--, s++, d++);
		if ((uintptr_t)s & ALIGN) goto tail;
```

余りが 0 になるか、`n` が尽きるか、`c` をコピーするまで 1 バイトずつコピーします。ループの後もまだ整列していなければ、`n` が尽きたか `c` が見つかったかのどちらかなので、`goto tail` で結果を返す処理へ飛びます。

### 3. 8 バイトずつコピー

```c:line-numbers=23
		size_t k = ONES * c;
		wd=(void *)d; ws=(const void *)s;
		for (; n>=sizeof(size_t) && !HASZERO(*ws^k);
		       n-=sizeof(size_t), ws++, wd++) *wd = *ws;
		d=(void *)wd; s=(const void *)ws;
```

`k = ONES * c` を作り、`HASZERO(*ws^k)` で「この 8 バイトに `c` が含まれるか」を調べます。含まれない間は、8 バイトまるごとをコピーしてよいので `*wd = *ws` でコピーし、`n` を 8 減らします。`c` を含む 8 バイトに当たったら止め、その先は 1 バイトずつに任せます。

### 4. 残りを 1 バイトずつ

```c:line-numbers=30
	for (; n && (*d=*s)!=c; n--, s++, d++);
```

`c` をコピーするか `n` が尽きるまでコピーします。

### 5. 結果を返す

```c:line-numbers=31
tail:
	if (n) return d+1;
	return 0;
```

ループが `c` で止まった場合、`n` はまだ 0 ではなく、`d` はコピーした `c` を指しています。だから `n` が残っていれば `d+1`（`c` の直後）を返し、`n` が 0 なら見つからなかったので `NULL` を返します。

## ここがすごい

- **探しながらコピーする**: `memchr` で探してから `memcpy` でコピーすると、データを 2 回読むことになります。ここでは、読んだ 8 バイトに `c` がなければその場で書き込むので、1 回の読み込みで済みます。
- **「止まった理由」を n で判別**: 最後の 1 バイトずつのループは「`n` が尽きた」と「`c` を見つけた」の 2 つの理由で止まりますが、`if (n) return d+1;` では `n` を見るだけで区別できます。`c` で止まったときは `n--` が実行されないためです。フラグ変数が要りません。
- **整列できないときは素直に**: アドレスの余りが違うと、両方を同時に整列させられません。無理に工夫せず 1 バイトずつに切り替える判断で、コードを単純に保っています。
- **strlen と同じ道具の使い回し**: 0 を探す `HASZERO` と XOR の組み合わせは、musl の `memchr`、`strchrnul`、`strlcpy` などでも使われている共通の技です。

## まとめ

- `memccpy` は「区切り文字までコピーして、続きの位置を返す」関数。文字列の連結に便利。
- 検索とコピーを同じループで行うと、データを読むのが 1 回で済む。
- XOR で目的の値を 0 に変えれば、0 検出の技で任意の値を探せる。
- ループの終了理由は、カウンタの残りで判別できることが多い。
