---
title: "「0 か、探す文字か」を 8 バイト同時に見張る strchrnul"
description: "文字列から文字を探し、なければ終端を返す関数。終端の 0 と目的の文字という 2 種類の「止まる理由」を、HASZERO を 2 回使って 8 バイトずつ同時に調べる。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/strchrnul.c
lines: [10, 26]
function: "__strchrnul"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 文字列処理, 標準ライブラリ]
---

## ひとことで

`strchrnul(s, c)` は、文字列 `s` の中から文字 `c` を探し、見つかればその場所を、見つからなければ **文字列の終端（0 のバイト）の場所** を返します。
`strchr` は見つからないとき `NULL` を返しますが、`strchrnul` は必ず有効な場所を返すので、「ここから先は区切りまで」といった処理に便利です。
musl では `strchr` もこの関数を使って実装されています。

## コード

```c:line-numbers=10
char *__strchrnul(const char *s, int c)
{
	c = (unsigned char)c;
	if (!c) return (char *)s + strlen(s);

#ifdef __GNUC__
	typedef size_t __attribute__((__may_alias__)) word;
	const word *w;
	for (; (uintptr_t)s % ALIGN; s++)
		if (!*s || *(unsigned char *)s == c) return (char *)s;
	size_t k = ONES * c;
	for (w = (void *)s; !HASZERO(*w) && !HASZERO(*w^k); w++);
	s = (void *)w;
#endif
	for (; *s && *(unsigned char *)s != c; s++);
	return (char *)s;
}
```

同じファイルの先頭のマクロを使っています。

```c:line-numbers=5
#define ALIGN (sizeof(size_t))
#define ONES ((size_t)-1/UCHAR_MAX)
#define HIGHS (ONES * (UCHAR_MAX/2+1))
#define HASZERO(x) ((x)-ONES & ~(x) & HIGHS)
```

ファイル末尾の `weak_alias(__strchrnul, strchrnul);` で、内部名 `__strchrnul` が公開名 `strchrnul` としても使えるようになっています。

## 前提知識

- **C の文字列**: 文字（1 バイト）の並びの最後に値 0 のバイトを置いたものです。`"ab"` は `a b \0` の 3 バイトです。
- **ポインタ**: `const char *s` は文字の並びを指す場所です。`*s` で 1 文字読み、`s++` で次へ進みます。`(char *)s` は `const` を外す型変換で、標準関数の戻り値の型に合わせるためのものです。
- **`HASZERO(x)`**: 8 バイトの整数 `x` に 0 のバイトが含まれていれば 0 以外になるマクロです。
- **XOR（`^`）**: 同じ値どうしを XOR すると 0 になります。`*w ^ k` は、`c` と一致したバイトを 0 に変えます。
- **`uintptr_t`**: アドレスを整数として扱うための型です。`(uintptr_t)s % ALIGN` で「8 の倍数の位置か」を調べます。
- **`&&`（かつ）**: 左が偽ならば右は評価しません。8 バイトずつのループの条件はこれを利用しています。
- **`#ifdef __GNUC__`**: GCC 系コンパイラのときだけ有効になる部分です。

## 何をしているか

### 1. 0 を探す場合は strlen に任せる

```c:line-numbers=12
	c = (unsigned char)c;
	if (!c) return (char *)s + strlen(s);
```

`c` を 0〜255 に収めたあと、`c` が 0（終端そのもの）なら、答えは「終端の場所」なので `s + strlen(s)` を返します。この特別扱いのおかげで、後の処理では `c` が 0 でないと仮定できます。

### 2. 整列まで 1 文字ずつ

```c:line-numbers=18
	for (; (uintptr_t)s % ALIGN; s++)
		if (!*s || *(unsigned char *)s == c) return (char *)s;
```

アドレスが 8 の倍数になるまで 1 バイトずつ進み、途中で終端か `c` に出会えば、その場所を返します。`*(unsigned char *)s` と書いて、バイトを 0〜255 として比較しています。

### 3. 2 種類の 0 を同時に探す

```c:line-numbers=20
	size_t k = ONES * c;
	for (w = (void *)s; !HASZERO(*w) && !HASZERO(*w^k); w++);
```

`k = ONES * c` で `c` を 8 バイトに並べます。`c = '/'`（0x2f）なら `k = 0x2f2f2f2f2f2f2f2f` です。次のループは、

- `!HASZERO(*w)`: この 8 バイトに終端の 0 がない
- `!HASZERO(*w^k)`: この 8 バイトに `c` がない

の **両方が成り立つ間だけ** 8 バイトずつ進みます。どちらかが崩れたら、その 8 バイトのどこかで止まるべきだとわかります。

### 4. 最後は 1 文字ずつ

```c:line-numbers=24
	for (; *s && *(unsigned char *)s != c; s++);
	return (char *)s;
```

止まった 8 バイトの先頭から、終端でも `c` でもない間だけ進み、止まった場所を返します。たとえば `"usr/bin"` で `c = '/'` なら、`'/'` の位置を返します。`"usr"` なら終端の位置を返すので、呼び出し側は `*p == '/'` かどうかで見つかったかを判断できます。

## ここがすごい

- **止まる理由が 2 つでも 1 ループ**: 素直に書くと 1 文字ごとに「0 か」「c か」の 2 回の比較が要ります。ここでは 8 バイトに対して 2 回の判定で済みます。
- **`c == 0` を先に分けるのが効いている**: `c` が 0 だと `k` も 0 になり、2 つの判定が同じ意味になってしまいます。最初の `if (!c)` で取り除いておくことで、ループの条件をシンプルに保てます。しかも 0 を探すのは strlen そのものなので、既存の高速な関数を再利用できます。
- **NULL を返さない設計**: 戻り値が必ず文字列の中を指すので、呼び出し側で NULL チェックが要りません。`strcspn` や `getenv` など、musl の中のいくつもの関数がこの性質を利用して短く書かれています。
- **読みすぎても安全**: 整列したアドレスから 8 バイトずつ読むので、まとめ読みがメモリのページ境界をまたがず、読んではいけない領域に触れません。

## まとめ

- 「見つからなければ終端を返す」という API は、呼び出し側の分岐を減らす。
- XOR で「c と一致 → 0」に変えれば、0 検出の技を 2 回使って 2 種類の文字を同時に探せる。
- 特殊なケース（c == 0）を先に処理すると、メインのループが単純になる。
- 別の標準関数（strlen）を部品として再利用するのは、コードを小さく保つ定石。
