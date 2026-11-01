---
title: "割り算を使わずにヒープの「親」の位置を求める 3 行"
description: "カーネルのヒープソートで、子要素のバイト位置から親要素のバイト位置を求める関数。要素サイズで割らずに、最下位ビット 1 つだけで偶奇を判定する。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-only
copyright: "Copyright (C) Linus Torvalds and contributors"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: lib/sort.c
lines: [163, 187]
function: "parent"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, ソート, データ構造]
---

## ひとことで

`parent` は、Linux カーネルの汎用ソート `sort()`（ヒープソート）の中で使われる小さな関数です。
ヒープ（親が子より大きいという規則を持つ木を、配列に詰めて表したデータ構造）では、`j` 番目の要素の親は `(j-1)/2` 番目です。
ところがこのソートは要素を「番号」ではなく「先頭からのバイト数（オフセット）」で扱っています。この関数は、バイト単位のまま、重い割り算なしで親の位置を求めます。

## コード

::: code-group

```c:line-numbers=163 [日本語訳]
/**
 * parent - 子のオフセットから、親のオフセットを求める。
 * @i: 親を求めたいヒープ要素のオフセット。0 ではない。
 * @lsbit: 事前に計算した 1 ビットのマスク。"size & -size" に等しい
 * @size: 各要素の大きさ
 *
 * 配列の添字で言えば、要素 j = @i/@size の親は単に
 * (j-1)/2 だ。しかしバイトオフセットで扱うときは、整数の割り算による
 * 暗黙の切り捨てが使えない。
 *
 * 幸い、必要なのは商の 1 ビットだけで、割り算全体ではない。
 * @size には最下位の 1 のビットがある。そのビットは @i が @size の
 * 偶数倍なら 0、奇数倍なら 1 になる。
 *
 * 論理的には "if (i & lsbit) i -= size;" をしているが、
 * 分岐が予測できないので、分岐のない巧妙な
 * コードで代わりに行っている。
 */
__attribute_const__ __always_inline
static size_t parent(size_t i, unsigned int lsbit, size_t size)
{
	i -= size;
	i -= size & -(i & lsbit);
	return i / 2;
}
```

```c:line-numbers=163 [原文]
/**
 * parent - given the offset of the child, find the offset of the parent.
 * @i: the offset of the heap element whose parent is sought.  Non-zero.
 * @lsbit: a precomputed 1-bit mask, equal to "size & -size"
 * @size: size of each element
 *
 * In terms of array indexes, the parent of element j = @i/@size is simply
 * (j-1)/2.  But when working in byte offsets, we can't use implicit
 * truncation of integer divides.
 *
 * Fortunately, we only need one bit of the quotient, not the full divide.
 * @size has a least significant bit.  That bit will be clear if @i is
 * an even multiple of @size, and set if it's an odd multiple.
 *
 * Logically, we're doing "if (i & lsbit) i -= size;", but since the
 * branch is unpredictable, it's done with a bit of clever branch-free
 * code instead.
 */
__attribute_const__ __always_inline
static size_t parent(size_t i, unsigned int lsbit, size_t size)
{
	i -= size;
	i -= size & -(i & lsbit);
	return i / 2;
}
```

:::

## 前提知識

- **`size_t`**: 大きさや位置を表す符号なし（マイナスがない）整数型です。64 ビット環境では 64 ビットです。
- **`unsigned int`**: 符号なしの整数型です。ここでは 1 ビットだけ立った「マスク」を入れています。
- **符号なし整数のマイナス**: C では符号なし整数に `-` を付けると、「2 の補数」と呼ばれる表現で計算されます。`-x` は「`x` のビットを反転して 1 を足したもの」です。たとえば 8 ビットで `-4` は `11111100` です。
- **`&`（ビットごとの AND）**: 両方のビットが 1 の桁だけを 1 にします。
- **`size & -size`**: 数の「いちばん下に立っている 1 のビット」だけを取り出す定番の式です。`12`（`1100`）なら `4`（`0100`）になります。この関数では引数 `lsbit` として事前に計算されて渡されます。
- **`static`**: 関数に付けると「このファイルの中だけで使う」という意味になります。
- **`__always_inline` / `__attribute_const__`**: コンパイラへのヒントです。前者は「必ず呼び出し元に埋め込め」、後者は「引数だけで結果が決まる純粋な関数だ」という意味です。

## 何をしているか

### 番号とバイト位置の関係

要素の大きさを `size` バイトとすると、`j` 番目の要素は先頭から `i = j * size` バイトの位置にあります。
求めたい親の位置は `((j-1)/2) * size` です。素直に書くなら `((i/size - 1) / 2) * size` ですが、これには割り算と掛け算が必要です。
`size` が 12 のように 2 のべき乗でないと、割り算はシフトに置き換えられず遅い命令になります。

### ひとつ前に戻る

```c:line-numbers=184
	i -= size;
```

`i -= size;` で `(j-1) * size` になります。あとはこれを「`j-1` を 2 で割って切り捨てたもの」に直せばよいわけです。
もし `j-1` が偶数なら、そのまま 2 で割れば `((j-1)/2) * size` になります。奇数なら、さらに `size` を 1 つ引いて偶数にしてから 2 で割ります。

### 偶奇を 1 ビットで判定して、分岐なしで引く

```c:line-numbers=185
	i -= size & -(i & lsbit);
```

ここが核心です。`size` は「`lsbit` × 奇数」と書けます。`12 = 4 × 3` です。
すると `(j-1) * size` の `lsbit` のビットは、`j-1` が奇数のときだけ 1 になります。偶奇の判定にビット 1 つ見るだけで済むのです。

そして `size & -(i & lsbit)` という式で、「奇数なら `size`、偶数なら `0`」を if 文なしで作ります。

- `i & lsbit` が `0` なら、`-0` は `0` で、`size & 0` は `0` です。
- `i & lsbit` が `lsbit` なら、`-lsbit` は「`lsbit` の桁から上が全部 1」のビット列です。`size` には `lsbit` より下の桁に 1 がないので、`size & -lsbit` はちょうど `size` になります。

### 2 で割る

```c:line-numbers=186
	return i / 2;
```

最後の `i / 2` は 2 で割るだけなので、コンパイラは 1 ビットの右シフトにします。

### 具体例

`size = 12`、`lsbit = 4` で考えます。

- 子が 5 番（`i = 60`）: `i -= size;`で `48`。`48 & 4 = 0` なので何も引かず、`48 / 2 = 24`。24 バイト目は 2 番で、`(5-1)/2 = 2` と一致します。
- 子が 4 番（`i = 48`）: `i -= size;`で `36`。`36 & 4 = 4` なので `12` を引いて `24`。`24 / 2 = 12`、つまり 1 番で、`(4-1)/2 = 1` と一致します。

## ここがすごい

- **割り算を消した**: コメントにあるとおり、知りたいのは商の全体ではなく「奇数か偶数か」の 1 ビットだけです。そこに気づくと、任意の要素サイズに対して割り算なしで親を求められます。
- **分岐をなくした**: 論理的には `if (i & lsbit) i -= size;` ですが、この条件はデータ次第で毎回変わるので、CPU の分岐予測（次にどちらへ進むかを先読みする仕組み）が外れやすくなります。`&` と `-` だけの式にすると、予測ミスによる待ち時間が生まれません。
- **呼び出し側の工夫と組み合わさっている**: `lsbit` はソートの最初に一度だけ `size & -size` で計算され、何度も呼ばれる `parent` には定数として渡されます。重い計算をループの外へ追い出す、基本に忠実な設計です。
- **トレードオフ**: 読みやすさは素直な書き方に劣ります。そのため 関数の直前の長いコメントで、何をしているかを丁寧に説明しています。トリッキーな最適化には説明を添える、という良い見本でもあります。

## まとめ

- `x & -x` で「最下位の 1 のビット」を取り出せる。
- 「`size` の倍数が偶数倍か奇数倍か」は、`size` の最下位ビットの位置を見るだけでわかる。
- `mask & -(cond_bit)` の形で、if 文を使わずに「条件付きで値を選ぶ」ことができる。
- 予測しにくい分岐は、ビット演算に置き換えると速くなることがある。
- トリッキーなコードには、なぜそうしたかのコメントを残す。
