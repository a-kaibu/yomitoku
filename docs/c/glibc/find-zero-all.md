---
title: "0x7f を足して「0 のバイト」を誤判定なしで見つけるビット演算"
description: "glibc の find_zero_all は、8 バイトの整数のうち値が 0 のバイトすべてに印を付ける。足し算の繰り上がりを各バイトの中に閉じ込めることで、有名な判定式の誤判定をなくしている。"
language: c
project: glibc
repo: https://github.com/bminor/glibc
license: LGPL-2.1-or-later
copyright: "Copyright (C) 2023-2026 Free Software Foundation, Inc."
commit: "04e750e75b73957cf1c791535a3f4319534a52fc"
file: sysdeps/generic/string-fza.h
lines: [43, 57]
function: "find_zero_all"
difficulty: 3
format: 2
tags: [ビット演算, 最適化, 文字列処理]
---

## ひとことで

`find_zero_all` は、整数 1 個（64 ビット環境なら 8 バイト）を「8 個のバイトの箱」とみなし、**値が 0 の箱すべてに `0x80` の印を付けた整数** を返す関数です。
`strlen` や `memchr` が 8 バイトずつまとめて調べるための部品です。
同じファイルにはもっと安い判定 `find_zero_low` もありますが、こちらは **すべてのバイトについて正確** なのが特徴です。

## コード

::: code-group

```c:line-numbers=43 [日本語訳]
/* この関数は、X の中で 0 だったすべてのバイトについて、その中の少なくとも
   1 ビットが立った値を返す。find_zero_low と違い、結果はすべてのバイトで確定
   している（不定なバイトがない）。主に、0 だった最上位のバイトの位置を
   求めるのに使う。  */
static __always_inline find_t
find_zero_all (op_t x)
{
  /* 各バイトについて、次の手順で「0 でない」ことを調べる:
     (0) 0x7f と AND して、バイト間で繰り上がりが起きないようにする
     (1) 0x7f を足して、0 でなければ 0x80 へ繰り上がるようにする
     (2) 元のバイトを OR する（元から 0x80 が立っていたかもしれないので）
     最後に反転してマスクすると、そのバイトが 0 だったときだけ 0x80 が立つ。  */
  op_t m = repeat_bytes (0x7f);
  return ~(((x & m) + m) | x | m);
}
```

```c:line-numbers=43 [原文]
/* This function returns at least one bit set within every byte of X that
   is zero.  The result is exact in that, unlike find_zero_low, all bytes
   are determinate.  This is usually used for finding the index of the
   most significant byte that was zero.  */
static __always_inline find_t
find_zero_all (op_t x)
{
  /* For each byte, find not-zero by
     (0) And 0x7f so that we cannot carry between bytes,
     (1) Add 0x7f so that non-zero carries into 0x80,
     (2) Or in the original byte (which might have had 0x80 set).
     Then invert and mask such that 0x80 is set iff that byte was zero.  */
  op_t m = repeat_bytes (0x7f);
  return ~(((x & m) + m) | x | m);
}
```

:::

`repeat_bytes`（`sysdeps/generic/string-misc.h`）は、バイト `c` を全バイトに並べた値を作ります。比較用に、同じファイルにある安い判定 `find_zero_low` も載せます。

<!-- source: sysdeps/generic/string-misc.h -->
```c:line-numbers=38
   machine with input as 0xce the functions returns 0xcececececececece.  */
static __always_inline op_t
repeat_bytes (unsigned char c_in)
{
  return ((op_t)-1 / 0xff) * c_in;
}
```

```c:line-numbers=31
static __always_inline find_t
find_zero_low (op_t x)
{
  /* This expression comes from
       https://graphics.stanford.edu/~seander/bithacks.html#ZeroInWord
     Subtracting 1 sets 0x80 in a byte that was 0; anding ~x clears
     0x80 in a byte that was >= 128; anding 0x80 isolates that test bit.  */
  op_t lsb = repeat_bytes (0x01);
  op_t msb = repeat_bytes (0x80);
  return (x - lsb) & ~x & msb;
}
```

## 前提知識

- **`op_t` / `find_t`**: glibc 内部の型で、CPU が一度に扱える符号なし整数（64 ビット環境なら 8 バイト）です。`find_t` は判定結果を入れるための同じ型の別名（`typedef`）です。
- **ビット演算**: `&` は桁ごとの AND（両方 1 なら 1）、`|` は OR（どちらか 1 なら 1）、`~` は全ビットの反転です。
- **16 進数**: `0x7f` は 2 進数で `0111 1111`、`0x80` は `1000 0000` です。1 バイトの最上位ビットが `0x80` にあたります。
- **SWAR**: 1 個の整数を小さな箱の集まりとして扱い、1 回の演算で全部の箱を同時に処理する技法です（SIMD Within A Register）。
- **繰り上がり・繰り下がり**: 足し算や引き算で桁があふれると、となりの桁に 1 が移ります。SWAR では、これが **となりのバイトにまで伝わってしまう** ことが問題になります。
- **`static __always_inline`**: 呼び出し元に埋め込まれる小さな関数であることを示します。

## 何をしているか

### 1. 定数を用意する

```c:line-numbers=55
  op_t m = repeat_bytes (0x7f);
```

`m` は全バイトが `0x7f` の値です。各バイトで「最上位ビット以外の 7 ビットがすべて 1」という意味になります。

### 2. 1 バイトずつ考える

```c:line-numbers=56
  return ~(((x & m) + m) | x | m);
```

この式を、1 バイト `b` について順に追います。

- `(b & 0x7f)` で最上位ビットを落とし、0〜127 にします。
- そこに `0x7f`（127）を足します。最大でも `127 + 127 = 254` なので、**結果は必ず 1 バイトに収まり、となりへ繰り上がりません**。そして元の下位 7 ビットが 1 つでも 1 なら、合計は 128 以上になり最上位ビットが立ちます。
- `| b` で、もともと最上位ビットが立っていたバイト（`0x80` 以上）も最上位ビットを立てます。
- `| 0x7f` で下位 7 ビットを全部 1 にします。

この時点で、`b` が 0 以外ならそのバイトは `0xff`、`b` が 0 なら `0x7f` です。最後に `~` で反転すると、それぞれ `0x00` と `0x80` になります。

### 3. 具体例

`b = 0x00`: `0x00 + 0x7f = 0x7f`、OR しても `0x7f`、反転して `0x80`（印あり）。
`b = 0x01`: `0x01 + 0x7f = 0x80`、OR して `0xff`、反転して `0x00`。
`b = 0x80`: `0x00 + 0x7f = 0x7f`、`| 0x80` で `0xff`、反転して `0x00`。
8 個のバイトすべてで、この計算が同時に行われます。

## ここがすごい

- **安い式の弱点を知ったうえでの使い分け**: コード補足の `find_zero_low` は有名な式ですが、引き算の繰り下がりがとなりのバイトに伝わるため、「本物の 0 より上位のバイトに偽の印が出る」ことがあります。たとえばリトルエンディアンで下位バイトが `0x00`、その上が `0x01` だと、`0x01` の方にも印が出ます。「0 があるか」だけなら問題ありませんが、「どのバイトが 0 か」をすべて知りたいときや、印をシフトして一部を捨てるときには困ります。
- **繰り上がりを箱の中に閉じ込める**: `& 0x7f` で先に最上位ビットを落としておくことで、足し算の結果がバイトからあふれないようにしています。演算は AND・足し算・OR 2 回・反転の 5 回程度で、比較命令も分岐もありません。
- **コメントが式の意味を説明している**: 関数の中のコメントは、(0)〜(2) の手順として式を分解しています。読めば読むほど、各演算が欠かせないことが分かります。
- **部品として再利用される**: 同じファイルの `find_eq_all` は `find_zero_all(x1 ^ x2)` と書かれています。XOR は同じ値どうしで 0 になるので、「0 のバイトを探す」部品が「特定の文字を探す」部品にそのまま化けます。

## まとめ

- 8 バイトを 1 個の整数として扱えば、8 個のバイトを同時に判定できる。
- 引き算を使う有名な判定式は速いが、繰り下がりのせいで上位バイトに誤判定が出る。
- 最上位ビットを先に落としてから足すと、繰り上がりがとなりのバイトへ漏れず、全バイトで正確になる。
- `x ^ y` で「等しいか」を「0 か」に変換すれば、同じ部品で文字探しもできる。
