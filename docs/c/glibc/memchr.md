---
title: "最初と最後の 8 バイトだけ特別扱いする memchr"
description: "メモリの中から 1 バイトの値を探す memchr の glibc 汎用 C 実装。8 バイト単位の高速な探索に、範囲の端を正しく扱うための工夫と、アドレスのあふれ対策を組み合わせている。"
language: c
project: glibc
repo: https://github.com/bminor/glibc
license: LGPL-2.1-or-later
copyright: "Copyright (C) 1991-2026 Free Software Foundation, Inc."
commit: "04e750e75b73957cf1c791535a3f4319534a52fc"
file: string/memchr.c
lines: [32, 84]
format: 2
function: "__memchr"
difficulty: 3
tags: [ビット演算, 最適化, 探索, 標準ライブラリ]
---

## ひとことで

`memchr(s, c, n)` は、アドレス `s` から `n` バイトの範囲で、値が `c` のバイトを最初に見つけた場所を返す標準関数です。見つからなければ `NULL` を返します。
たとえば `memchr("hello", 'l', 5)` は 3 文字目の `l` を指すポインタを返します。
glibc の汎用版は、8 バイト（64 ビット環境の場合）をまとめて比較し、範囲の **最初と最後のかたまりだけ** をていねいに扱います。

## コード

::: code-group

```c:line-numbers=32 [日本語訳]
static __always_inline const char *
sadd (uintptr_t x, uintptr_t y)
{
  return (const char *)(y > UINTPTR_MAX - x ? UINTPTR_MAX : x + y);
}

/* S の先頭から最大 N バイトの中で C を探す。  */
void *
__memchr (void const *s, int c_in, size_t n)
{
  if (__glibc_unlikely (n == 0))
    return NULL;

  /* 最初の語を読む。ただし配列より手前のバイトが目的の値に一致しない
     ように加工する。  */
  const op_t *word_ptr = PTR_ALIGN_DOWN (s, sizeof (op_t));
  uintptr_t s_int = (uintptr_t) s;

  op_t word = *word_ptr;
  op_t repeated_c = repeat_bytes (c_in);
  /* あふれる可能性を考えに入れて、最後のバイトのアドレスを
     計算する。  */
  const char *lbyte = sadd (s_int, n - 1);
  /* 最後のバイトを含む語のアドレスも求める。 */
  const op_t *lword = (const op_t *) PTR_ALIGN_DOWN (lbyte, sizeof (op_t));

  find_t mask = shift_find (find_eq_all (word, repeated_c), s_int);
  if (mask != 0)
    {
      char *ret = (char *) s + index_first (mask);
      return (ret <= lbyte) ? ret : NULL;
    }
  if (word_ptr == lword)
    return NULL;

  word = *++word_ptr;
  while (word_ptr != lword)
    {
      if (has_eq (word, repeated_c))
	return (char *) word_ptr + index_first_eq (word, repeated_c);
      word = *++word_ptr;
    }

  if (has_eq (word, repeated_c))
    {
      /* 一致は見つかったが、配列の終わりより後ろのバイトかも
	 しれない。  */
      char *ret = (char *) word_ptr + index_first_eq (word, repeated_c);
      if (ret <= lbyte)
	return ret;
    }
  return NULL;
}
```

```c:line-numbers=32 [原文]
static __always_inline const char *
sadd (uintptr_t x, uintptr_t y)
{
  return (const char *)(y > UINTPTR_MAX - x ? UINTPTR_MAX : x + y);
}

/* Search no more than N bytes of S for C.  */
void *
__memchr (void const *s, int c_in, size_t n)
{
  if (__glibc_unlikely (n == 0))
    return NULL;

  /* Read the first word, but munge it so that bytes before the array
     will not match goal.  */
  const op_t *word_ptr = PTR_ALIGN_DOWN (s, sizeof (op_t));
  uintptr_t s_int = (uintptr_t) s;

  op_t word = *word_ptr;
  op_t repeated_c = repeat_bytes (c_in);
  /* Compute the address of the last byte taking in consideration possible
     overflow.  */
  const char *lbyte = sadd (s_int, n - 1);
  /* And also the address of the word containing the last byte. */
  const op_t *lword = (const op_t *) PTR_ALIGN_DOWN (lbyte, sizeof (op_t));

  find_t mask = shift_find (find_eq_all (word, repeated_c), s_int);
  if (mask != 0)
    {
      char *ret = (char *) s + index_first (mask);
      return (ret <= lbyte) ? ret : NULL;
    }
  if (word_ptr == lword)
    return NULL;

  word = *++word_ptr;
  while (word_ptr != lword)
    {
      if (has_eq (word, repeated_c))
	return (char *) word_ptr + index_first_eq (word, repeated_c);
      word = *++word_ptr;
    }

  if (has_eq (word, repeated_c))
    {
      /* We found a match, but it might be in a byte past the end of the
	 array.  */
      char *ret = (char *) word_ptr + index_first_eq (word, repeated_c);
      if (ret <= lbyte)
	return ret;
    }
  return NULL;
}
```

:::

`repeat_bytes`（`sysdeps/generic/string-misc.h`）は、1 バイトの値を全バイトに並べた値を作ります。`c_in = 'l'`（`0x6c`）なら `0x6c6c6c6c6c6c6c6c` です。

<!-- source: sysdeps/generic/string-misc.h -->
```c:line-numbers=38
   machine with input as 0xce the functions returns 0xcececececececece.  */
static __always_inline op_t
repeat_bytes (unsigned char c_in)
{
  return ((op_t)-1 / 0xff) * c_in;
}
```

## 前提知識

- **ポインタと `void *`**: ポインタはメモリ上の場所を表す値です。`void *` は「型を決めていない場所」で、どんなデータの場所でも受け取れます。`const` は「書き換えない」という約束です。
- **`NULL`**: 「どこも指していない」ことを表す特別なポインタです。
- **`size_t` と `uintptr_t`**: どちらも符号なし整数の型です。`size_t` は長さ、`uintptr_t` はアドレスを整数として扱うときに使います。`UINTPTR_MAX` はその最大値です。
- **`op_t`**: glibc 内部の型で、8 バイトの符号なし整数（64 ビット環境）です。
- **`static __always_inline`**: 小さな補助関数を呼び出し元に埋め込む指定です。`sadd` はこのファイルの中だけで使われます。
- **`__glibc_unlikely(式)`**: 「この条件はめったに真にならない」とコンパイラに伝える目印で、意味は `式` と同じです。
- **アラインメント**: `PTR_ALIGN_DOWN(p, 8)` は p 以下で最も近い 8 の倍数のアドレスです。8 の倍数から 8 バイト読むと、メモリのページ境界をまたぎません。
- **XOR（`^`）**: 同じ値どうしを XOR すると 0 になります。これを使うと「`c` と等しいバイト」を「0 のバイト」探しに変えられます。

## 何をしているか

### 1. あふれない足し算

```c:line-numbers=32
static __always_inline const char *
sadd (uintptr_t x, uintptr_t y)
{
  return (const char *)(y > UINTPTR_MAX - x ? UINTPTR_MAX : x + y);
}
```

`sadd(x, y)` は `x + y` を計算しますが、結果が `UINTPTR_MAX` を超えるときは `UINTPTR_MAX` で止めます（飽和加算）。
`memchr` には「どこかに必ずあると分かっているので `n` に最大値を渡す」という使い方があり、`s + n - 1` をそのまま計算するとアドレスが一周して小さな値になってしまうからです。

### 2. 準備

```c:line-numbers=42
  if (__glibc_unlikely (n == 0))
    return NULL;

  /* 最初の語を読む。ただし配列より手前のバイトが目的の値に一致しない
     ように加工する。  */
  const op_t *word_ptr = PTR_ALIGN_DOWN (s, sizeof (op_t));
  uintptr_t s_int = (uintptr_t) s;

  op_t word = *word_ptr;
  op_t repeated_c = repeat_bytes (c_in);
  /* あふれる可能性を考えに入れて、最後のバイトのアドレスを
     計算する。  */
  const char *lbyte = sadd (s_int, n - 1);
  /* 最後のバイトを含む語のアドレスも求める。 */
  const op_t *lword = (const op_t *) PTR_ALIGN_DOWN (lbyte, sizeof (op_t));
```

`n == 0` なら探す範囲がないので `NULL` です。
次に `s` を 8 の倍数に切り下げた `word_ptr` を作り、最初の 8 バイトを読みます。`repeated_c` は探す値を 8 個並べた整数です。
`lbyte` は範囲の最後のバイトのアドレス、`lword` はそのバイトを含む 8 バイトのかたまりの先頭です。

### 3. 最初のかたまり

```c:line-numbers=58
  find_t mask = shift_find (find_eq_all (word, repeated_c), s_int);
  if (mask != 0)
    {
      char *ret = (char *) s + index_first (mask);
      return (ret <= lbyte) ? ret : NULL;
    }
  if (word_ptr == lword)
    return NULL;
```

`find_eq_all(word, repeated_c)` は、`c` と等しいバイトすべてに印を付けます。`shift_find` は `s` より手前のバイトの印をシフトで捨てます。
印が残っていれば `index_first` でその位置を求め、`lbyte` を超えていないか確認して返します。
`s = 0x1003, n = 2` のように範囲が 1 つのかたまりに収まる場合は、`word_ptr == lword` の判定でここで終わります。

### 4. 途中のかたまり

```c:line-numbers=67
  word = *++word_ptr;
  while (word_ptr != lword)
    {
      if (has_eq (word, repeated_c))
	return (char *) word_ptr + index_first_eq (word, repeated_c);
      word = *++word_ptr;
    }
```

途中のかたまりはすべて範囲の内側なので、端の確認なしで `has_eq` だけを調べて進みます。見つかれば `index_first_eq` で位置を出して返します。

### 5. 最後のかたまり

```c:line-numbers=75
  if (has_eq (word, repeated_c))
    {
      /* 一致は見つかったが、配列の終わりより後ろのバイトかも
	 しれない。  */
      char *ret = (char *) word_ptr + index_first_eq (word, repeated_c);
      if (ret <= lbyte)
	return ret;
    }
  return NULL;
```

最後のかたまりは範囲の外のバイトを含むかもしれません。見つかった位置が `lbyte` 以下のときだけ返し、それ以外は `NULL` です。

## ここがすごい

- **チェックをループの外に出している**: 「範囲を超えていないか」の確認は最初と最後のかたまりでしか必要ありません。素直に書くとループの中で毎回確認しますが、この実装では途中のループは「比較して進む」だけの最小限の仕事になっています。
- **範囲の外を読んでも安全**: 最初と最後のかたまりは範囲の外のバイトを含みますが、8 の倍数にそろえた 8 バイトなのでページ境界をまたがず、読んではいけないメモリに触れません。そのうえで、見つかった位置を範囲と照らし合わせて結果を正しくしています。
- **極端な `n` にも備える**: `sadd` による飽和加算は、`n` に巨大な値が渡されたときにアドレスの計算が一周する事故を防ぎます。こうした境界の考慮が、標準ライブラリらしい慎重さです。
- **XOR で問題を変換**: `word ^ repeated_c` は、`c` と等しいバイトだけを 0 にします。その結果、`strlen` と同じ「0 のバイトを探す」部品を使い回せます。

## まとめ

- 8 バイトずつ比較すると、1 バイトずつより大幅にループ回数が減る。
- 範囲の端の確認は最初と最後のかたまりだけで行い、途中のループを軽くする。
- アドレスの計算はあふれる可能性があるので、飽和加算でふさぐ。
- XOR で「等しいか」を「0 か」に変えると、同じ部品で別の探索ができる。
