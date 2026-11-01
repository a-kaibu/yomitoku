---
title: "いちばん上の 1 ビットの位置を、命令・表引き・ループで求め分ける"
description: "32 ビット整数で最も上位にある 1 のビット位置を返す関数。コンパイラ組み込み関数、MSVC の命令、256 要素の表を使う予備実装の 3 通りを #if で切り替えている。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 2019-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/include/port/pg_bitutils.h
lines: [35, 65]
function: "pg_leftmost_one_pos32"
difficulty: 2
format: 2
tags: [ビット演算, 移植性, 最適化, 低レイヤ]
---

## ひとことで

`pg_leftmost_one_pos32` は、32 ビットの整数の中で **いちばん上（左）にある 1 のビットが何番目か** を返します。番号は一番下のビットを 0 番として数えます。
たとえば `word = 20`（2 進数で `10100`）なら、いちばん上の 1 は 4 番目なので `4` を返します。
PostgreSQL ではハッシュ表の大きさを 2 のべき乗にそろえる計算などで使われる、小さいけれど重要な部品です。

## コード

::: code-group

```c:line-numbers=35 [日本語訳]
/*
 * pg_leftmost_one_pos32
 *	"word" の中で最上位の立っているビットの位置を、
 *	最下位ビットから数えて返す。word は 0 であってはならない。
 */
static inline int
pg_leftmost_one_pos32(uint32 word)
{
#ifdef HAVE__BUILTIN_CLZ
	Assert(word != 0);

	return 31 - __builtin_clz(word);
#elif defined(_MSC_VER)
	unsigned long result;
	bool		non_zero;

	Assert(word != 0);

	non_zero = _BitScanReverse(&result, word);
	return (int) result;
#else
	int			shift = 32 - 8;

	Assert(word != 0);

	while ((word >> shift) == 0)
		shift -= 8;

	return shift + pg_leftmost_one_pos[(word >> shift) & 255];
#endif							/* HAVE__BUILTIN_CLZ */
}
```

```c:line-numbers=35 [原文]
/*
 * pg_leftmost_one_pos32
 *		Returns the position of the most significant set bit in "word",
 *		measured from the least significant bit.  word must not be 0.
 */
static inline int
pg_leftmost_one_pos32(uint32 word)
{
#ifdef HAVE__BUILTIN_CLZ
	Assert(word != 0);

	return 31 - __builtin_clz(word);
#elif defined(_MSC_VER)
	unsigned long result;
	bool		non_zero;

	Assert(word != 0);

	non_zero = _BitScanReverse(&result, word);
	return (int) result;
#else
	int			shift = 32 - 8;

	Assert(word != 0);

	while ((word >> shift) == 0)
		shift -= 8;

	return shift + pg_leftmost_one_pos[(word >> shift) & 255];
#endif							/* HAVE__BUILTIN_CLZ */
}
```

:::

## 前提知識

- **ビットと位置**: 整数はコンピュータの中では 0 と 1 の並び（2 進数）です。`uint32` は「符号なし 32 ビット整数」で、0 番（一番右）から 31 番（一番左）までの 32 個のビットがあります。
- **`static inline`**: `static` は「このファイルの中だけで使う」、`inline` は「呼び出しの代わりに中身をその場に埋め込んでよい」という指示です。ヘッダファイルに小さな関数を書くときの定番の組み合わせです。
- **`#ifdef` / `#elif` / `#else` / `#endif`**: コンパイルの前に、条件によってコードの一部を残したり消したりする仕組み（プリプロセッサ）です。この関数では 3 つの実装のうち 1 つだけが実際にコンパイルされます。
- **`>>`（右シフト）**: ビットを右へずらします。`20 >> 2` は `10100` を 2 つずらして `101`（5）です。
- **`& 255`**: AND 演算で下位 8 ビットだけを取り出します。255 は 2 進数で `11111111` です。
- **`__builtin_clz`**: GCC や Clang が用意している組み込み関数で、上位から数えて 0 が何個続くか（count leading zeros）を返します。多くの CPU では 1 命令になります。
- **`Assert`**: 「ここでは必ずこの条件が成り立つはず」と確かめるマクロです。開発用ビルドで条件が偽なら停止します。
- **表引き**: あらかじめ計算した答えを配列に並べておき、添字で読むだけで答えを得る方法です。

## 何をしているか

### 1. 組み込み関数が使える場合

```c:line-numbers=42
{
#ifdef HAVE__BUILTIN_CLZ
	Assert(word != 0);

```

`__builtin_clz(word)` は上位の 0 の個数を返します。`word = 20` なら 32 ビットで `000...010100` で、上に 0 が 27 個あります。`31 - 27 = 4` が答えです。
`word` が 0 のときは `__builtin_clz` の結果が未定義なので、`Assert` で 0 を渡さない約束を確認しています。

### 2. MSVC の場合

```c:line-numbers=46
	return 31 - __builtin_clz(word);
#elif defined(_MSC_VER)
	unsigned long result;
	bool		non_zero;

	Assert(word != 0);

	non_zero = _BitScanReverse(&result, word);
```

Microsoft のコンパイラには `__builtin_clz` がありません。代わりに `_BitScanReverse` という組み込み関数があり、**最上位の 1 の位置そのもの** を `result` に書き込んでくれます。引き算は要りません。
戻り値（0 でなかったか）は `non_zero` に入れていますが使っていません。

### 3. どちらもない場合

```c:line-numbers=54
	return (int) result;
#else
	int			shift = 32 - 8;

	Assert(word != 0);

	while ((word >> shift) == 0)
		shift -= 8;

	return shift + pg_leftmost_one_pos[(word >> shift) & 255];
```

ここが一番おもしろい部分です。まず `shift = 24` から始め、`word >> shift` が 0 でない（＝その 8 ビットより上に 1 がある）まで `shift` を 8 ずつ減らします。
`word = 20` なら、`20 >> 24`、`20 >> 16`、`20 >> 8` はすべて 0 で、`shift = 0` で止まります。
次に `(word >> shift) & 255` で、1 が含まれる 8 ビットのかたまりを取り出し、`pg_leftmost_one_pos` という 256 要素の表で引きます。この表は「0〜255 の各値について最上位の 1 の位置」を前もって入れたものです。表の `20` 番目は `4` なので、`0 + 4 = 4` が答えになります。
`word = 0x12345678` なら最初の `shift = 24` で `0x12` が取り出され、表の値 `4` に 24 を足して `28` を返します。

## ここがすごい

- **3 段構えの移植性**: 素直に書くなら「1 ビットずつ上から調べる」ループで十分ですが、それだと最悪 32 回ループします。PostgreSQL は、使えるなら CPU の専用命令、使えなければ 8 ビット単位の表引き、という順で最も速い方法を選びます。どの環境でも同じ答えを返すので、呼ぶ側は違いを気にせずに済みます。
- **表引きの粒度がちょうどよい**: 表を 8 ビット単位にすると、表は 256 バイトで済み、ループは最大 4 回です。16 ビット単位にすればループは 2 回になりますが、表は 65536 要素に膨らみます。キャッシュに収まる大きさと手数のバランスが取れています。
- **前提条件を `Assert` で明示**: 「0 は渡さない」という約束をコメントだけでなくコードでも書いているので、間違った使い方を開発中に見つけられます。`word = 0` のとき予備実装のループは `shift` が負になるまで止まらず、組み込み関数も意味のない値を返すので、この約束は本当に重要です。
- **`static inline` でヘッダに置く**: 呼び出しのたびに関数呼び出しのコストを払わずに済み、組み込み関数版なら実質 1〜2 命令に展開されます。

## まとめ

- 「最上位の 1 の位置」は、上位の 0 の個数（clz）を 31 から引けば求まる。
- 専用命令がない環境では、8 ビットごとに区切って表を引くと少ない手数で求められる。
- `#if` で環境ごとに実装を切り替え、外から見た振る舞いは同じに保つのが移植性の基本。
- 0 のように答えが定義できない入力は、`Assert` で前提条件として明示する。
