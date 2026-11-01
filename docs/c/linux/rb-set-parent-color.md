---
title: "親へのポインタの「使われない下位ビット」に赤黒の色を隠す"
description: "赤黒木のノードで、親ノードへのポインタと色（赤か黒か）を 1 つの整数にまとめて持つためのマクロと関数。アラインメントで必ず 0 になる下位ビットを再利用する。"
language: c
project: Linux
repo: https://github.com/torvalds/linux
license: GPL-2.0-or-later
copyright: "(C) 1999  Andrea Arcangeli <andrea@suse.de>; (C) 2002  David Woodhouse <dwmw2@infradead.org>; (C) 2012  Michel Lespinasse <walken@google.com>"
commit: "46fec1c3029b552ec63b2d01af9d43a386f043ea"
file: include/linux/rbtree_augmented.h
lines: [277, 298]
function: "rb_set_parent_color"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, メモリ管理, ハック]
---

## ひとことで

Linux カーネルの赤黒木（バランスを自動で保つ二分探索木。各ノードが「赤」か「黒」の色を持つ）では、ノードが「親へのポインタ」と「色」を持ちます。
ふつうなら 2 つの欄を作りますが、カーネルはこれを **`__rb_parent_color` という 1 つの整数** にまとめています。
ここで取り上げるマクロと関数は、そのまとめた値から親や色を取り出したり、設定したりするための道具です。

## コード

```c:line-numbers=277
#define	RB_RED		0
#define	RB_BLACK	1

#define __rb_parent(pc)    ((struct rb_node *)(pc & ~3))

#define __rb_color(pc)     ((pc) & 1)
#define __rb_is_black(pc)  __rb_color(pc)
#define __rb_is_red(pc)    (!__rb_color(pc))
#define rb_color(rb)       __rb_color((rb)->__rb_parent_color)
#define rb_is_red(rb)      __rb_is_red((rb)->__rb_parent_color)
#define rb_is_black(rb)    __rb_is_black((rb)->__rb_parent_color)

static inline void rb_set_parent(struct rb_node *rb, struct rb_node *p)
{
	rb->__rb_parent_color = rb_color(rb) + (unsigned long)p;
}

static inline void rb_set_parent_color(struct rb_node *rb,
				       struct rb_node *p, int color)
{
	rb->__rb_parent_color = (unsigned long)p + color;
}
```

ノードの構造体は `include/linux/rbtree_types.h` で定義されています。

<!-- source: include/linux/rbtree_types.h -->
```c:line-numbers=5
struct rb_node {
	unsigned long  __rb_parent_color;
	struct rb_node *rb_right;
	struct rb_node *rb_left;
} __attribute__((aligned(sizeof(long))));
```

## 前提知識

- **ポインタ**: メモリ上の場所（アドレス）を表す値です。`struct rb_node *p` は「ノードがある場所」です。
- **`unsigned long` とポインタの変換**: カーネルが対象とする環境では、`unsigned long` はポインタと同じ大きさです。`(unsigned long)p` でアドレスを整数に、`(struct rb_node *)x` で整数をアドレスに戻せます。
- **アラインメント（整列）**: 構造体は、大きさに応じて「4 の倍数」「8 の倍数」のアドレスに置かれます。`__attribute__((aligned(sizeof(long))))` は「少なくとも `long` の大きさ（4 か 8）の倍数に置け」という指定です。4 の倍数のアドレスは、2 進数で下位 2 ビットが必ず `00` です。
- **`#define`（マクロ）**: コンパイル前の文字の置き換えです。引数つきのマクロは関数のように使えます。
- **ビット演算**: `& 1` は最下位ビットだけを取り出し、`& ~3` は下位 2 ビットを 0 にします（`~` はビットの反転）。
- **`static inline`**: 呼び出し元に中身を埋め込む小さな関数です。
- **`->`**: 構造体を指すポインタから中身を取り出す書き方です。

## 何をしているか

### 色の値

```c:line-numbers=277
#define	RB_RED		0
#define	RB_BLACK	1
```

赤を `0`、黒を `1` とします。色は最下位ビットに入ります。

### 親を取り出す

```c:line-numbers=280
#define __rb_parent(pc)    ((struct rb_node *)(pc & ~3))
```

`__rb_parent(pc)` は、まとめた値 `pc` の下位 2 ビットを 0 にして、ポインタに戻します。
たとえば親のアドレスが `0x1000` で色が黒なら、`pc` は `0x1001` です。`0x1001 & ~3` は `0x1000` で、元のアドレスが戻ります。

### 色を取り出す

```c:line-numbers=282
#define __rb_color(pc)     ((pc) & 1)
#define __rb_is_black(pc)  __rb_color(pc)
#define __rb_is_red(pc)    (!__rb_color(pc))
#define rb_color(rb)       __rb_color((rb)->__rb_parent_color)
#define rb_is_red(rb)      __rb_is_red((rb)->__rb_parent_color)
#define rb_is_black(rb)    __rb_is_black((rb)->__rb_parent_color)
```

`__rb_color(pc)` は `pc & 1`、つまり最下位ビットです。`0x1001` なら `1`（黒）です。
`rb_is_red` などは、ノードを渡すと中の `__rb_parent_color` を見て判定するように包んだものです。

### 色を保ったまま親だけ変える

```c:line-numbers=289
static inline void rb_set_parent(struct rb_node *rb, struct rb_node *p)
{
	rb->__rb_parent_color = rb_color(rb) + (unsigned long)p;
}
```

`rb_set_parent` は、今の色（`rb_color(rb)`、0 か 1）に新しい親のアドレスを**足し算**して書き込みます。アドレスの下位ビットは 0 なので、足し算は OR と同じ結果になります。

### 親と色を同時に設定

```c:line-numbers=294
static inline void rb_set_parent_color(struct rb_node *rb,
				       struct rb_node *p, int color)
{
	rb->__rb_parent_color = (unsigned long)p + color;
}
```

`rb_set_parent_color` は、アドレスに色を足して書き込みます。親が `0x2000` で赤（0）なら `0x2000`、黒（1）なら `0x2001` です。

## ここがすごい

- **ノード 1 つあたり 1 語ぶん節約**: 色のためだけに欄を作ると、アラインメントのせいで実際には 4〜8 バイトを使ってしまいます。カーネルには赤黒木のノードを持つ構造体が大量にあるので（プロセスのスケジューリングやメモリ領域の管理など）、この節約は効きます。ノードは 3 語ぴったりになっています。
- **アラインメントの「おまけ」を使う**: アドレスの下位ビットが必ず 0 になるという事実は、ふつうは誰も気にしません。そこに情報を詰め込むのは、「ポインタタグ」と呼ばれる低レイヤでよく使われるハックです。構造体定義の `aligned` 指定は、この前提をコンパイラに保証させるためのものです。
- **黒を 1 にした理由が見える**: `lib/rbtree.c` にある `rb_set_black` は、赤（0）のノードの値に `RB_BLACK` を足すだけで黒にします。また同じファイルの `rb_red_parent` は、赤いノードなら色のビットが 0 なので、`& ~3` すら省いてそのままポインタとして使っています。色の値の割り当ても、よく使う操作が速くなるように選ばれています。
- **トレードオフ**: 値を直接 `->__rb_parent_color` で読むと、ポインタとしては壊れた値になります。そのため欄の名前を `__` で始めて「直接触るな」と示し、必ずこれらのマクロを通して使う約束にしています。

## まとめ

- アラインされたアドレスの下位ビットは常に 0 なので、小さな情報を隠して持てる（ポインタタグ）。
- 取り出すときは `& ~mask` でアドレス、`& mask` で隠した情報に分ける。
- 下位ビットが 0 なので、アドレスへの「足し算」は OR と同じように使える。
- よく使う操作が一番速くなるように、値の割り当て（赤 = 0、黒 = 1）まで考えられている。
