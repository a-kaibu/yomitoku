---
title: "後ろから引き算しながら入れ替える、ループ変数のいらない swap"
description: "2 つのメモリ領域を 8 バイトずつ入れ替える関数。残りサイズ n をそのまま添字として使い、カウンタを 1 つに減らしている。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/sort.c
lines: [65, 99]
function: "swap_words_64"
difficulty: 2
format: 2
tags: [最適化, 低レイヤ, 移植性, メモリ管理]
---

## ひとことで

`swap_words_64` は、メモリ上の 2 つの要素 `a` と `b`（どちらも `n` バイト）の中身を、8 バイトずつ入れ替える関数です。
カーネルの `sort()` が要素を並べ替えるときに使います。ループ用の変数を別に持たず、**残りのバイト数 `n` を減らしながら、それをそのまま位置として使う**のが特徴です。

## コード

::: code-group

```c:line-numbers=65 [日本語訳]
/**
 * swap_words_64 - 2 つの要素を 64 ビット単位で入れ替える
 * @a: 入れ替える 1 つ目の要素へのポインタ
 * @b: 入れ替える 2 つ目の要素へのポインタ
 * @n: 要素の大きさ（8 の倍数でなければならない）
 *
 * メモリ上の 2 つのオブジェクトを交換する。ほぼすべての CPU にある
 * ベース＋インデックスのアドレス指定を利用して、ループの余分な
 * 計算を最小にしている。
 *
 * できれば 64 ビットの読み込みを使いたい。使えない場合にそれを模倣するには
 * ベース＋インデックス＋4 のアドレス指定が必要で、x86 にはあるが他の多くの
 * プロセッサにはない。CONFIG_64BIT なら 64 ビットの読み込みは確実にあるが、
 * 64 ビットのポインタなしで 64 ビットの読み込みを持つこともありうる（例:
 * x32 ABI）。カーネルが気にすべきケースはあるだろうか？
 */
static void swap_words_64(void *a, void *b, size_t n)
{
	do {
#ifdef CONFIG_64BIT
		u64 t = *(u64 *)(a + (n -= 8));
		*(u64 *)(a + n) = *(u64 *)(b + n);
		*(u64 *)(b + n) = t;
#else
		/* ベース＋インデックス＋4 のアドレス指定を避けるため、32 ビットの転送を 2 回行う */
		u32 t = *(u32 *)(a + (n -= 4));
		*(u32 *)(a + n) = *(u32 *)(b + n);
		*(u32 *)(b + n) = t;

		t = *(u32 *)(a + (n -= 4));
		*(u32 *)(a + n) = *(u32 *)(b + n);
		*(u32 *)(b + n) = t;
#endif
	} while (n);
}
```

```c:line-numbers=65 [原文]
/**
 * swap_words_64 - swap two elements in 64-bit chunks
 * @a: pointer to the first element to swap
 * @b: pointer to the second element to swap
 * @n: element size (must be a multiple of 8)
 *
 * Exchange the two objects in memory.  This exploits base+index
 * addressing, which basically all CPUs have, to minimize loop overhead
 * computations.
 *
 * We'd like to use 64-bit loads if possible.  If they're not, emulating
 * one requires base+index+4 addressing which x86 has but most other
 * processors do not.  If CONFIG_64BIT, we definitely have 64-bit loads,
 * but it's possible to have 64-bit loads without 64-bit pointers (e.g.
 * x32 ABI).  Are there any cases the kernel needs to worry about?
 */
static void swap_words_64(void *a, void *b, size_t n)
{
	do {
#ifdef CONFIG_64BIT
		u64 t = *(u64 *)(a + (n -= 8));
		*(u64 *)(a + n) = *(u64 *)(b + n);
		*(u64 *)(b + n) = t;
#else
		/* Use two 32-bit transfers to avoid base+index+4 addressing */
		u32 t = *(u32 *)(a + (n -= 4));
		*(u32 *)(a + n) = *(u32 *)(b + n);
		*(u32 *)(b + n) = t;

		t = *(u32 *)(a + (n -= 4));
		*(u32 *)(a + n) = *(u32 *)(b + n);
		*(u32 *)(b + n) = t;
#endif
	} while (n);
}
```

:::

## 前提知識

- **`void *` のポインタ**: 型の決まっていないアドレスです。`a + n` は（GCC の拡張で）「`a` から `n` バイト先」を意味します。
- **キャストと `*`**: `(u64 *)(a + n)` は「そのアドレスを 64 ビット整数のある場所として扱う」という変換で、先頭に `*` を付けると、その場所の値を読み書きできます。
- **`u64` / `u32`**: カーネルで使う「64 ビット / 32 ビットの符号なし整数」の型名です。
- **`do { ... } while (n);`**: 中身を最低 1 回実行し、`n` が 0 でない間くり返すループです。
- **`(n -= 8)`**: `n` から 8 を引き、その**引いた後の値**が式の値になります。代入しながら値として使える C の特徴です。
- **`#ifdef CONFIG_64BIT`**: 64 ビット向けにビルドするときだけ、その部分を使います。`#else` から `#endif` までは 32 ビット向けです。

## 何をしているか

### 64 ビット環境

```c:line-numbers=85
		u64 t = *(u64 *)(a + (n -= 8));
		*(u64 *)(a + n) = *(u64 *)(b + n);
		*(u64 *)(b + n) = t;
```

1 周目、たとえば `n = 24` なら、`u64 t = *(u64 *)(a + (n -= 8));`の `(n -= 8)` で `n` が `16` になり、`a + 16` から 8 バイトを `t` に退避します。
`*(u64 *)(a + n) = *(u64 *)(b + n);`で `b + 16` の 8 バイトを `a + 16` に写し、`*(u64 *)(b + n) = t;`で `t` を `b + 16` に書きます。これで最後の 8 バイトが入れ替わりました。
2 周目は `n = 8`、3 周目は `n = 0` の位置を入れ替え、`n` が 0 になったところで `} while (n);`の条件が偽になり終わります。

つまり、**後ろから前へ**入れ替えていきます。

### 32 ビット環境

```c:line-numbers=89
		/* Use two 32-bit transfers to avoid base+index+4 addressing */
		u32 t = *(u32 *)(a + (n -= 4));
		*(u32 *)(a + n) = *(u32 *)(b + n);
		*(u32 *)(b + n) = t;

		t = *(u32 *)(a + (n -= 4));
		*(u32 *)(a + n) = *(u32 *)(b + n);
		*(u32 *)(b + n) = t;
```

64 ビットの読み書きが使えないときは、32 ビットの読み書きを 2 回行います。
32 ビット版のコメントにあるとおり、「`a + n` と `a + n + 4`」のように同じ `n` に 4 を足した位置を使うのではなく、`n -= 4` を 2 回くり返して位置を作り直しています。

## ここがすごい

- **カウンタが 1 つで済む**: ふつうは `for (i = 0; i < n; i += 8)` のように、位置 `i` と終わり `n` の 2 つを使います。この関数は `n` を位置と残り回数の両方に使うので、毎周の比較は「`n` が 0 か」だけです。しかも引き算の結果で CPU のゼロフラグ（直前の計算結果が 0 かを記録する印）が立つので、比較命令すら要りません。`swap_words_32` の説明コメントは、古い GCC がわざわざ余分な比較を入れてしまうと嘆いています。
- **ベース＋インデックスのアドレス指定を活かす**: `a + n` と `b + n` は、「レジスタ＋レジスタ」でアドレスを作る命令でそのまま表せます。関数の直前のコメントのとおり、これはほぼすべての CPU にあるので、ポインタを 2 つ進めるより計算が少なくなります。
- **32 ビット版の気配り**: `a + n + 4` のような「ベース＋インデックス＋定数」の形は x86 にはありますが、多くの CPU にはありません。`n -= 4` を 2 回にすると、どの CPU でも単純なアドレス計算で済みます。
- **前提条件を呼び出し側で保証**: `n` が 8 の倍数でないと、`n` が 0 を飛び越えて無限ループになります。この関数自身は確認せず、呼び出し側の `is_aligned` で 8 の倍数であることを保証してから使います。速さのために責任を分担しています。

## まとめ

- 残り数を減らしながら、そのまま添字として使うと、ループ変数を 1 つにできる。
- 引き算の結果で 0 判定をすると、比較命令を省ける。
- アドレス計算の形（ベース＋インデックス）を意識すると、多くの CPU で効率が良くなる。
- 前提条件（サイズが 8 の倍数）は、呼び出し側でまとめて確認している。
