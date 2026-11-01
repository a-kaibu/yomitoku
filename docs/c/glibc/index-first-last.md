---
title: "「何バイト目か」を 1 命令で求める、先頭ゼロの数え方"
description: "8 バイトの判定結果から、印の付いたバイトの位置を割り出す glibc の小関数。末尾や先頭に続く 0 ビットの数を数える命令を使い、エンディアンの違いも定数の条件分岐で吸収する。"
language: c
project: glibc
repo: https://github.com/bminor/glibc
license: LGPL-2.1-or-later
copyright: "Copyright (C) 2023-2026 Free Software Foundation, Inc."
commit: "04e750e75b73957cf1c791535a3f4319534a52fc"
file: sysdeps/generic/string-fzi.h
lines: [44, 69]
format: 2
function: "index_first / index_last"
difficulty: 2
tags: [ビット演算, 移植性, 低レイヤ]
---

## ひとことで

`index_first` と `index_last` は、`strlen` や `memchr` が 8 バイトまとめて比較した結果（各バイトの最上位ビットに印が付いた整数）から、**印のあるバイトがメモリ上で何バイト目か** を求める関数です。
`index_first` は最初の印、`index_last` は最後の印の位置を返します。
ループで 1 バイトずつ調べずに、CPU の「0 ビットを数える命令」1 回で答えを出します。

## コード

::: code-group

```c:line-numbers=44 [日本語訳]
/* index_zero 系関数の下請け。判定語 C を受け取り、0 でない最初のバイト
   （メモリ上の順で）の、メモリ上の順での添字を返す。  */
   non-zero.  */
static __always_inline unsigned int
index_first (find_t c)
{
  int r;
  if (__BYTE_ORDER == __LITTLE_ENDIAN)
    r = ctz (c);
  else
    r = clz (c);
  return r / CHAR_BIT;
}

/* 同様に、0 でない最後のバイトの（メモリ上の順での）添字を
   返す。  */
static __always_inline unsigned int
index_last (find_t c)
{
  int r;
  if (__BYTE_ORDER == __LITTLE_ENDIAN)
    r = clz (c);
  else
    r = ctz (c);
  return sizeof (find_t) - 1 - (r / CHAR_BIT);
}
```

```c:line-numbers=44 [原文]
/* A subroutine for the index_zero functions.  Given a test word C, return
   the (memory order) index of the first byte (in memory order) that is
   non-zero.  */
static __always_inline unsigned int
index_first (find_t c)
{
  int r;
  if (__BYTE_ORDER == __LITTLE_ENDIAN)
    r = ctz (c);
  else
    r = clz (c);
  return r / CHAR_BIT;
}

/* Similarly, but return the (memory order) index of the last byte that is
   non-zero.  */
static __always_inline unsigned int
index_last (find_t c)
{
  int r;
  if (__BYTE_ORDER == __LITTLE_ENDIAN)
    r = clz (c);
  else
    r = ctz (c);
  return sizeof (find_t) - 1 - (r / CHAR_BIT);
}
```

:::

同じファイルで、`clz` と `ctz` は次のように定義されています。

```c:line-numbers=26
static __always_inline int
clz (find_t c)
{
  if (sizeof (find_t) == sizeof (unsigned long))
    return __builtin_clzl (c);
  else
    return __builtin_clzll (c);
}

static __always_inline int
ctz (find_t c)
{
  if (sizeof (find_t) == sizeof (unsigned long))
    return __builtin_ctzl (c);
  else
    return __builtin_ctzll (c);
}
```

## 前提知識

- **`find_t`**: glibc 内部の 8 バイトの符号なし整数型（64 ビット環境）で、判定結果を入れるのに使います。
- **ctz と clz**: ctz（count trailing zeros）は整数の **下位から** 続く 0 ビットの数、clz（count leading zeros）は **上位から** 続く 0 ビットの数です。たとえば 64 ビットの `0x80`（2 進数で `1000 0000`）なら ctz は 7、clz は 56 です。多くの CPU はこれを 1 命令で計算できます。
- **`__builtin_ctzl` など**: GCC や Clang が用意している組み込み関数で、使える CPU では専用命令に置き換わります。引数が 0 のときの結果は未定義（決まっていない）なので、呼ぶ側は 0 を渡さないようにします。
- **エンディアン**: 複数バイトの整数をメモリに並べる順番です。リトルエンディアン（x86 など）は下位バイトを小さいアドレスに、ビッグエンディアンは上位バイトを小さいアドレスに置きます。
- **`CHAR_BIT`**: 1 バイトのビット数で、ふつうは 8 です。
- **`__BYTE_ORDER == __LITTLE_ENDIAN`**: コンパイル時に決まる定数どうしの比較です。`if` で書いても、コンパイラは使わない側を取り除きます。

## 何をしているか

### 1. index_first

```c:line-numbers=47
static __always_inline unsigned int
index_first (find_t c)
{
  int r;
  if (__BYTE_ORDER == __LITTLE_ENDIAN)
    r = ctz (c);
  else
    r = clz (c);
  return r / CHAR_BIT;
}
```

リトルエンディアンでは、メモリ上の最初のバイトが整数の一番下に来ます。なので「最初の印」は「一番下の印」で、`ctz` で下から数えた 0 ビットの数を求め、8 で割ればバイトの番号になります。
例: 判定結果が `0x0000000000800000` なら、印は 23 ビット目です。`ctz` は 23、`23 / 8 = 2` なので、メモリ上で 2 バイト目（0 から数えて）です。
ビッグエンディアンでは逆に、メモリ上の最初のバイトが整数の一番上に来るので、`clz` を使います。

### 2. index_last

```c:line-numbers=60
static __always_inline unsigned int
index_last (find_t c)
{
  int r;
  if (__BYTE_ORDER == __LITTLE_ENDIAN)
    r = clz (c);
  else
    r = ctz (c);
  return sizeof (find_t) - 1 - (r / CHAR_BIT);
}
```

最後の印は、リトルエンディアンでは「一番上の印」です。`clz` で上から数えた 0 ビットの数を求め、8 で割ると「後ろから何バイト目か」が分かります。
最後の `sizeof (find_t) - 1 - (r / CHAR_BIT)` で、それを前からの番号に直します。
例: 判定結果が `0x0080000000008000` なら、`clz` は 8 です。`8 / 8 = 1` なので後ろから 1 バイト目、前からは `8 - 1 - 1 = 6` バイト目になります。実際、印 `0x80` は整数の 6 バイト目（下から数えて）にあります。

## ここがすごい

- **ループが要らない**: 素直に書くと「1 バイトずつシフトしながら印を探す」ループになり、最大 8 回の繰り返しと分岐が必要です。`ctz` / `clz` を使えば、ほとんどの CPU で 1 命令で済みます。
- **割り算がシフトになる**: `r / CHAR_BIT` は 8 での割り算ですが、`r` は 0 以上と分かっているので、コンパイラは右シフト 3 ビットに置き換えられます。印は各バイトの最上位ビット（7 ビット目）にありますが、7 の端数は割り算で切り捨てられるので、補正の計算も要りません。
- **エンディアンの違いを 1 か所に閉じ込める**: `strlen` や `memchr` 本体はエンディアンを気にせず `index_first` を呼ぶだけです。違いはこの小さな関数の中の、定数による `if` だけに閉じ込められています。`#if` を使わず普通の `if` で書いているので、両方の枝が常にコンパイルされ、片方だけ壊れていることに気づかない、という事故も防げます。
- **型の大きさで組み込み関数を選ぶ**: `clz` / `ctz` は `sizeof` で `unsigned long` 用か `unsigned long long` 用かを選んでいます。これも定数の比較なので、実行時のコストはありません。

## まとめ

- 下位から続く 0 の数（ctz）と上位から続く 0 の数（clz）は、ビット位置を求める基本の道具。
- 各バイトの最上位ビットに印を付けておけば、ビット位置を 8 で割るだけでバイト位置になる。
- エンディアンの違いは、小さな関数の中で定数の `if` によって吸収できる。
- 組み込み関数に 0 を渡さないように、呼ぶ側で「印がある」ことを確かめてから使う。
