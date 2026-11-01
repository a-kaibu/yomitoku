---
title: "後ろから 8 バイトずつさかのぼる memrchr"
description: "メモリの範囲を後ろから調べ、指定した値の最後の出現位置を返す memrchr。切り上げたアドレスから逆向きに読み、範囲外のバイトをマスクで消してから先頭位置ではなく末尾位置を求める。"
language: c
project: glibc
repo: https://github.com/bminor/glibc
license: LGPL-2.1-or-later
copyright: "Copyright (C) 1991-2026 Free Software Foundation, Inc."
commit: "04e750e75b73957cf1c791535a3f4319534a52fc"
file: string/memrchr.c
lines: [33, 76]
format: 2
function: "__memrchr"
difficulty: 3
tags: [ビット演算, 最適化, 探索, 標準ライブラリ]
---

## ひとことで

`memrchr(s, c, n)` は、アドレス `s` から `n` バイトの範囲で、値が `c` のバイトが **最後に** 現れる場所を返す関数です（GNU 拡張）。
たとえば `memrchr("a/b/c", '/', 5)` は 2 つ目の `/`（4 バイト目）を指します。ファイルパスの最後の区切りを探すときなどに便利です。
`memchr` の逆向き版で、8 バイト（64 ビット環境）ずつ **後ろから前へ** 調べます。

## コード

::: code-group

```c:line-numbers=33 [日本語訳]
void *
__memrchr (const void *s, int c_in, size_t n)
{
  if (__glibc_unlikely (n == 0))
    return NULL;

  const op_t *word_ptr = (const op_t *) PTR_ALIGN_UP (s + n, sizeof (op_t));
  uintptr_t s_int = (uintptr_t) s + n;

  op_t word = *--word_ptr;
  op_t repeated_c = repeat_bytes (c_in);

  /* 先頭のバイトを含む語のアドレスを求める。 */
  const op_t *sword = (const op_t *) PTR_ALIGN_DOWN (s, sizeof (op_t));

  /* バッファの終わりが op_t の境界にそろっていなければ、最後のバイト位置を
     求める前に、不要なビットをマスクで消す。  */
  find_t mask = shift_find_last (find_eq_all (word, repeated_c), s_int);
  if (mask != 0)
    {
      char *ret = (char *) word_ptr + index_last (mask);
      return ret >= (char *) s ? ret : NULL;
    }
  if (word_ptr == sword)
    return NULL;
  word = *--word_ptr;

  while (word_ptr != sword)
    {
      if (has_eq (word, repeated_c))
	return (char *) word_ptr + index_last_eq (word, repeated_c);
      word = *--word_ptr;
    }

  if (has_eq (word, repeated_c))
    {
      /* 一致は見つかったが、配列の範囲の外のバイトかも
	 しれない。  */
      char *ret = (char *) word_ptr + index_last_eq (word, repeated_c);
      if (ret >= (char *) s)
	return ret;
    }
  return NULL;
}
```

```c:line-numbers=33 [原文]
void *
__memrchr (const void *s, int c_in, size_t n)
{
  if (__glibc_unlikely (n == 0))
    return NULL;

  const op_t *word_ptr = (const op_t *) PTR_ALIGN_UP (s + n, sizeof (op_t));
  uintptr_t s_int = (uintptr_t) s + n;

  op_t word = *--word_ptr;
  op_t repeated_c = repeat_bytes (c_in);

  /* Compute the address of the word containing the initial byte. */
  const op_t *sword = (const op_t *) PTR_ALIGN_DOWN (s, sizeof (op_t));

  /* If the end of buffer is not op_t aligned, mask off the undesirable bits
     before find the last byte position.  */
  find_t mask = shift_find_last (find_eq_all (word, repeated_c), s_int);
  if (mask != 0)
    {
      char *ret = (char *) word_ptr + index_last (mask);
      return ret >= (char *) s ? ret : NULL;
    }
  if (word_ptr == sword)
    return NULL;
  word = *--word_ptr;

  while (word_ptr != sword)
    {
      if (has_eq (word, repeated_c))
	return (char *) word_ptr + index_last_eq (word, repeated_c);
      word = *--word_ptr;
    }

  if (has_eq (word, repeated_c))
    {
      /* We found a match, but it might be in a byte past the end of the
	 array.  */
      char *ret = (char *) word_ptr + index_last_eq (word, repeated_c);
      if (ret >= (char *) s)
	return ret;
    }
  return NULL;
}
```

:::

`shift_find_last`（`sysdeps/generic/string-shift.h`）です。`s` は 8 で割った余りで、リトルエンディアンでは下位 `s` バイトだけを残すマスクを掛けます。

<!-- source: sysdeps/generic/string-shift.h -->
```c:line-numbers=38
/* Mask off the bits defined for the S alignment value, or return WORD if
   S is 0.  */
static __always_inline find_t
shift_find_last (find_t word, uintptr_t s)
{
  s = s % sizeof (op_t);
  if (s == 0)
    return word;
  if (__BYTE_ORDER == __LITTLE_ENDIAN)
    return word & ~(((op_t)-1) << (s * CHAR_BIT));
  else
    return word & ~(((op_t)-1) >> (s * CHAR_BIT));
}
```

## 前提知識

- **ポインタの算術**: `s + n` は「`s` から `n` バイト先」のアドレスです。`*--word_ptr` は「ポインタを 1 つ前に戻してから、その場所を読む」という意味です（`--` を前に書くと、先に減らしてから値を使います）。
- **`op_t`**: glibc 内部の 8 バイトの符号なし整数型です（64 ビット環境）。`(op_t)-1` は全ビットが 1 の値になります。
- **アラインメント**: `PTR_ALIGN_UP(p, 8)` は p 以上で最も近い 8 の倍数、`PTR_ALIGN_DOWN(p, 8)` は p 以下で最も近い 8 の倍数です。
- **シフトとマスク**: `x << k` は左に k ビットずらします。`~` で反転した値と `&` を取ると、特定の範囲のビットだけを残せます（マスク）。
- **リトルエンディアン**: 8 バイトを整数として読むと、メモリ上で先頭のバイトが整数の一番下の 8 ビットになる並べ方です。
- **`NULL`**: 「見つからない」ことを表す特別なポインタです。

## 何をしているか

### 1. 末尾のかたまりを読む

```c:line-numbers=39
  const op_t *word_ptr = (const op_t *) PTR_ALIGN_UP (s + n, sizeof (op_t));
  uintptr_t s_int = (uintptr_t) s + n;

  op_t word = *--word_ptr;
  op_t repeated_c = repeat_bytes (c_in);
```

範囲の終わり `s + n` を 8 の倍数に **切り上げ** ます。`*--word_ptr` で 1 つ戻ってから読むので、読み込むのは「範囲の最後のバイトを含む 8 バイト」です。
たとえば `s = 0x1000, n = 13` なら、`s + n = 0x100d` を切り上げて `0x1010`、1 つ戻って `0x1008`〜`0x100f` を読みます。範囲の内側は `0x1008`〜`0x100c` の 5 バイトです。

### 2. 範囲外の印を消す

```c:line-numbers=50
  find_t mask = shift_find_last (find_eq_all (word, repeated_c), s_int);
  if (mask != 0)
    {
      char *ret = (char *) word_ptr + index_last (mask);
      return ret >= (char *) s ? ret : NULL;
    }
```

`find_eq_all` で `c` と等しいバイトすべてに印を付け、`shift_find_last` で範囲の外の印を消します。
上の例では `s_int % 8 = 0x100d % 8 = 5` なので、下位 5 バイト（メモリ上の前の 5 バイト）だけを残すマスクを掛けます。
印が残れば `index_last` で **一番後ろの印** の位置を求めます。それでも範囲の先頭 `s` より前なら `NULL` です。

### 3. 逆向きのループ

```c:line-numbers=56
  if (word_ptr == sword)
    return NULL;
  word = *--word_ptr;

  while (word_ptr != sword)
    {
      if (has_eq (word, repeated_c))
	return (char *) word_ptr + index_last_eq (word, repeated_c);
      word = *--word_ptr;
    }
```

`sword` は範囲の先頭バイトを含むかたまりです。そこに達するまで、`*--word_ptr` で 8 バイトずつ前へ戻りながら `has_eq` を調べます。途中のかたまりは全部が範囲内なので、端の確認はいりません。

### 4. 先頭のかたまり

```c:line-numbers=67
  if (has_eq (word, repeated_c))
    {
      /* 一致は見つかったが、配列の範囲の外のバイトかも
	 しれない。  */
      char *ret = (char *) word_ptr + index_last_eq (word, repeated_c);
      if (ret >= (char *) s)
	return ret;
    }
  return NULL;
```

先頭のかたまりには、範囲より前のバイトが含まれることがあります。見つかった位置が `s` 以上のときだけ返します。

## ここがすごい

- **前向き版との対称性**: `memchr` は「切り下げて読み、手前をシフトで捨て、最初の印を探す」ですが、`memrchr` は「切り上げて読み、後ろをマスクで消し、最後の印を探す」です。同じ部品（`find_eq_all`、`has_eq`）を使い、向きに関わる部分だけを `shift_find_last` と `index_last` に差し替えています。
- **余りが 0 のときの扱い**: `s + n` がもともと 8 の倍数なら、末尾のかたまりは丸ごと範囲内です。`shift_find_last` は余りが 0 のとき何もせずに返します。もし `<< 0` のまま計算すると、マスクが 0 になってすべての印が消えてしまいます。この特別扱いが欠かせない理由です。
- **ページ境界をまたがない**: 末尾・先頭のかたまりは範囲の外まで読みますが、どちらも 8 の倍数にそろえた 8 バイトなので、読めない領域には触れません。
- **端の確認はループの外**: 範囲の確認は最初と最後のかたまりだけで行い、途中のループは比較と移動だけに絞っています。

## まとめ

- 後ろから探すときは、終端を切り上げてから 1 つ戻って読む。
- 範囲外のバイトの判定結果は、シフトやマスクで消してから位置を求める。
- 「最初の印」の代わりに「最後の印」を求めれば、同じ部品で逆向きの探索になる。
- シフト量が 0 になる場合のような境界は、特別扱いが必要になることがある。
