---
title: "「含まれない文字」の長さを数える strcspn と、使い回しの妙"
description: "指定した文字のどれかが現れるまでの長さを返す関数。ビット集合で判定しつつ、拒否する文字が 0〜1 個のときは strchrnul に丸ごと任せて、表の初期化さえ省く。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/strcspn.c
lines: [6, 17]
function: "strcspn"
difficulty: 2
format: 2
tags: [ビット演算, 文字列処理, 最適化, 標準ライブラリ]
---

## ひとことで

`strcspn(s, reject)` は、文字列 `s` の先頭から、`reject` のどの文字も現れない区間の長さを返します。言い換えると「`reject` の文字が最初に出てくる位置」です。
たとえば `strcspn("key=value", "=")` は `3`、`strcspn("hello", ",;")` は（区切りがないので）`5` です。
`strspn` と対になる関数で、同じビット集合の技を使いますが、近道の作り方が一段うまくなっています。

## コード

```c:line-numbers=6
size_t strcspn(const char *s, const char *c)
{
	const char *a = s;
	size_t byteset[32/sizeof(size_t)];

	if (!c[0] || !c[1]) return __strchrnul(s, *c)-a;

	memset(byteset, 0, sizeof byteset);
	for (; *c && BITOP(byteset, *(unsigned char *)c, |=); c++);
	for (; *s && !BITOP(byteset, *(unsigned char *)s, &); s++);
	return s-a;
}
```

同じファイルの先頭のマクロで、256 ビットの集合を操作します。

```c:line-numbers=3
#define BITOP(a,b,op) \
 ((a)[(size_t)(b)/(8*sizeof *(a))] op (size_t)1<<((size_t)(b)%(8*sizeof *(a))))
```

## 前提知識

- **C の文字列**: 文字の並びの最後に値 0 のバイトを置いたものです。`*c` が 0 なら空文字列です。
- **ビット集合**: 256 ビットを用意し、文字コード `b` 番目のビットを「その文字が集合に含まれるか」のフラグとして使うものです。`size_t` を 4 個（64 ビット環境）並べた配列で表します。
- **`BITOP(a, b, op)`**: 文字 `b` に対応するビットに演算 `op` を行うマクロです。`|=` なら立てる、`&` なら調べる、になります。
- **`!`（否定）**: 真偽を反転します。`!BITOP(...)` は「ビットが立っていない」です。
- **`__strchrnul(s, c)`**: 文字列 `s` の中で文字 `c` を探し、見つかればその場所、なければ終端（0）の場所を返す musl の内部関数です。
- **`memset(p, 0, n)`**: `p` から `n` バイトを 0 で埋める標準関数です。`sizeof byteset` は配列全体のバイト数（32）です。
- **ポインタの引き算**: 2 つのポインタの差で、間の文字数が求まります。

## 何をしているか

### 1. 拒否する文字が 0 個か 1 個なら strchrnul

```c:line-numbers=11
	if (!c[0] || !c[1]) return __strchrnul(s, *c)-a;
```

`!c[0] || !c[1]` は「`reject` が空、または 1 文字だけ」です。

- 1 文字なら、その文字を探して最初の位置を返せばよいので、`__strchrnul(s, *c) - a` がそのまま答えです。`strcspn("key=value", "=")` は `=` の位置 3 を返します。
- 空なら `*c` は 0 です。`__strchrnul(s, 0)` は終端の位置を返すので、答えは文字列全体の長さになります。「何も拒否しない」なら全部数える、という仕様どおりです。

1 行で 2 つのケースが処理できています。

### 2. 表を 0 で埋める

```c:line-numbers=13
	memset(byteset, 0, sizeof byteset);
```

`size_t byteset[32/sizeof(size_t)];` では配列を宣言するだけで、初期化していません。近道で抜けなかった場合だけ、ここで `memset` して 0 にします。

### 3. 表を作る

```c:line-numbers=14
	for (; *c && BITOP(byteset, *(unsigned char *)c, |=); c++);
```

`reject` の文字ごとにビットを立てます。`strcspn(s, ",;")` なら `','`（44）と `';'`（59）のビットが立ちます。

### 4. 拒否する文字に出会うまで進む

```c:line-numbers=15
	for (; *s && !BITOP(byteset, *(unsigned char *)s, &); s++);
```

`s` の各文字について、ビットが **立っていない** 間だけ進みます。`strspn` の対応するループとは `!` が付くかどうかだけが違います。終端か拒否文字で止まり、`s-a` を返します。

## ここがすごい

- **空集合のケースを特別扱いしない**: 「空なら全体の長さ」という例外を、`__strchrnul(s, 0)` が終端を返す性質で自然に吸収しています。条件分岐が 1 つ減り、最初の近道が 1 行で済んでいます。
- **初期化を必要なときだけ**: 対になる `strspn` は宣言と同時に `= { 0 }` で初期化しますが、`strcspn` は近道の後に `memset` しています。1 文字の区切りを探すというよくある使い方では、32 バイトのゼロ埋めすら行いません。
- **速い部品の再利用**: 1 文字を探す処理は `__strchrnul` が 8 バイトずつ調べる高速版なので、近道は単に分岐を減らすだけでなく、ループそのものも速くなります。
- **表引きで比較回数が一定**: 拒否文字が 20 個あっても、1 文字あたりの判定はビット 1 つの確認です。二重ループで毎回 20 回比べる素直な実装と比べ、拒否文字の数に左右されません。

## まとめ

- `strcspn` は「区切り文字までの長さ」を求める関数で、`strspn` の裏返し。
- 1 文字の検索は専用の速い関数に任せ、一般の場合だけビット集合を使う。
- 既存関数の「境界での振る舞い」（終端を返す）を利用すると、例外処理が消える。
- 初期化のコストも、必要になるまで先送りできる。
