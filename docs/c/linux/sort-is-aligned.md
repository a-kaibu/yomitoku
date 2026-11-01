---
title: "2 つの「そろっているか」チェックを OR 1 回にまとめる"
description: "ソートで要素を 8 バイト単位でコピーしてよいかを判定する関数。アドレスとサイズの下位ビットを OR でまとめ、1 回の AND で判定する。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/sort.c
lines: [17, 40]
function: "is_aligned"
difficulty: 2
format: 2
tags: [ビット演算, 最適化, 移植性]
---

## ひとことで

`is_aligned` は、カーネルの `sort()` が「要素の入れ替えを 8 バイト（または 4 バイト）ずつまとめて行ってよいか」を決めるための判定関数です。
条件は「要素のサイズが 8 の倍数」かつ「配列の先頭アドレスが 8 の倍数」です。この関数は 2 つの条件を、ビットの OR と AND 1 回ずつで判定します。

## コード

::: code-group

```c:line-numbers=17 [日本語訳]
/**
 * is_aligned - このポインタとサイズで、語単位のコピーをしてよいか？
 * @base: データへのポインタ
 * @size: 各要素の大きさ
 * @align: 必要なアラインメント（ふつうは 4 か 8）
 *
 * 語単位の読み書きで要素をコピーできるなら true を返す。
 * サイズはアラインメントの倍数でなければならず、ベースアドレスも
 * CONFIG_HAVE_EFFICIENT_UNALIGNED_ACCESS がない場合は倍数でなければならない。
 *
 * なぜか gcc は "if (a & mask || b & mask)" を
 * "if ((a | b) & mask)" に最適化できないので、手で書いている。
 */
__attribute_const__ __always_inline
static bool is_aligned(const void *base, size_t size, unsigned char align)
{
	unsigned char lsbits = (unsigned char)size;

	(void)base;
#ifndef CONFIG_HAVE_EFFICIENT_UNALIGNED_ACCESS
	lsbits |= (unsigned char)(uintptr_t)base;
#endif
	return (lsbits & (align - 1)) == 0;
}
```

```c:line-numbers=17 [原文]
/**
 * is_aligned - is this pointer & size okay for word-wide copying?
 * @base: pointer to data
 * @size: size of each element
 * @align: required alignment (typically 4 or 8)
 *
 * Returns true if elements can be copied using word loads and stores.
 * The size must be a multiple of the alignment, and the base address must
 * be if we do not have CONFIG_HAVE_EFFICIENT_UNALIGNED_ACCESS.
 *
 * For some reason, gcc doesn't know to optimize "if (a & mask || b & mask)"
 * to "if ((a | b) & mask)", so we do that by hand.
 */
__attribute_const__ __always_inline
static bool is_aligned(const void *base, size_t size, unsigned char align)
{
	unsigned char lsbits = (unsigned char)size;

	(void)base;
#ifndef CONFIG_HAVE_EFFICIENT_UNALIGNED_ACCESS
	lsbits |= (unsigned char)(uintptr_t)base;
#endif
	return (lsbits & (align - 1)) == 0;
}
```

:::

## 前提知識

- **ポインタと `const void *`**: ポインタはメモリ上の場所（アドレス）を表す値です。`void *` は「何を指しているか決めていない」汎用のポインタで、`const` は中身を書き換えないという約束です。
- **`uintptr_t`**: ポインタを整数として扱うための整数型です。`(uintptr_t)base` でアドレスを数値に変換できます。
- **キャスト `(unsigned char)x`**: 値を別の型に変換します。`unsigned char` は 8 ビットの符号なし整数なので、下位 8 ビットだけが残ります。
- **`|` と `&`**: ビットごとの OR（どちらかが 1 なら 1）と AND（両方 1 なら 1）です。
- **`align - 1` のマスク**: `align` が 2 のべき乗（4 や 8）のとき、`align - 1` は下位のビットが全部 1 の数（8 なら `0b111`）になります。`x & 7 == 0` は「`x` が 8 の倍数」という意味です。
- **`#ifndef CONFIG_...`**: カーネルのビルド設定で、そのオプションが**有効でない**ときだけ `#endif` までを残す命令です。
- **`(void)base;`**: 引数を使わない設定のときに「未使用の引数」という警告が出ないようにするおまじないです。
- **`bool`**: 真（true）か偽（false）を表す型です。

## 何をしているか

### サイズの下位 8 ビットを取る

```c:line-numbers=33
	unsigned char lsbits = (unsigned char)size;
```

`size` を `unsigned char` に変換して `lsbits` に入れます。調べたいのは下位 3 ビットだけなので、8 ビットあれば十分です。小さい型にしておくと、比較命令も小さくなります。

### アドレスの下位ビットを OR で混ぜる

```c:line-numbers=36
#ifndef CONFIG_HAVE_EFFICIENT_UNALIGNED_ACCESS
	lsbits |= (unsigned char)(uintptr_t)base;
#endif
```

`CONFIG_HAVE_EFFICIENT_UNALIGNED_ACCESS` は「この CPU は、そろっていない（アラインされていない）アドレスからでも速く読み書きできる」という設定です。
x86 などではこれが有効なので、アドレスは調べなくてよく、この 3 行は消えます。そうでない CPU では、アドレスの下位 8 ビットを `lsbits` に OR で混ぜます。

### 1 回の AND で判定

```c:line-numbers=39
	return (lsbits & (align - 1)) == 0;
```

`(lsbits & (align - 1)) == 0` で、混ぜたものの下位ビットがすべて 0 かを調べます。

たとえば `align = 8` で、`size = 24`（`0b11000`）、アドレスが `0x1000`（下位が `0b000`）なら、OR しても下位 3 ビットは `000` なので真です。
アドレスが `0x1004` なら下位が `0b100` で、OR すると下位 3 ビットに 1 が残り、偽になります。

## ここがすごい

- **`a & m || b & m` を `(a | b) & m` に**: 「どちらかの下位ビットに 1 があるか」は、両方を OR してからまとめて調べても同じです。関数の直前のコメントの最後の 2 行は、GCC がこの変形を自動ではしてくれないので手で書いた、と説明しています。比較と分岐が 1 つ減ります。
- **CPU の性質に合わせて条件そのものを変える**: そろっていないアクセスが速い CPU では、アドレスの条件を丸ごと外しています。判定を緩めることで、より多くの配列が 8 バイト単位の高速な入れ替えを使えるようになります。
- **呼び出し側との組み合わせ**: `__sort_r` はこの関数で 8 → 4 → 1 バイトの順に試し、使える最大の単位を選びます。`__always_inline` なので、呼び出しのコストもかかりません。

## まとめ

- 2 のべき乗 `n` の倍数かどうかは `x & (n - 1)` が 0 かで調べられる。
- 複数の値が「全部そろっているか」は、OR でまとめてから 1 回のマスクで判定できる。
- コンパイラが思いつかない変形は、コメント付きで手で書くことがある。
- ハードウェアの性質（アラインされていないアクセスの速さ）に応じて、ビルド設定で条件を切り替えている。
