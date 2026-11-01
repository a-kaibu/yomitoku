---
title: "先頭の「はみ出し」をシフトで消す、glibc の汎用 strlen"
description: "glibc の C で書かれた汎用 strlen。文字列の手前まで含めて 8 バイト単位で読み、余計なバイトの判定結果をシフトで捨てることで、1 バイトずつの前処理ループをなくしている。"
language: c
project: glibc
repo: https://github.com/bminor/glibc
license: LGPL-2.1-or-later
copyright: "Copyright (C) 1991-2026 Free Software Foundation, Inc."
commit: "04e750e75b73957cf1c791535a3f4319534a52fc"
file: string/strlen.c
lines: [29, 47]
format: 2
function: "__strlen"
difficulty: 3
tags: [ビット演算, 最適化, 文字列処理, 標準ライブラリ]
---

## ひとことで

`strlen` は C の文字列の長さ（終端の `0` までのバイト数）を返す標準関数です。`strlen("hello")` は `5` です。
glibc には CPU ごとに手書きのアセンブリ版がありますが、ここで読むのはどの CPU でも使える **C で書かれた汎用版** です。
8 バイト（64 ビット環境の場合）をまとめて調べる工夫に加えて、「文字列の先頭がそろっていない場合」の扱いがとてもすっきりしています。

## コード

::: code-group

```c:line-numbers=29 [日本語訳]
/* NUL で終わる文字列 STR の長さを返す。終端の NUL を、
   一度に 4 バイトずつ調べることで速く探す。  */
size_t
__strlen (const char *str)
{
  /* ポインタを sizeof op_t の倍数にそろえる。  */
  const uintptr_t s_int = (uintptr_t) str;
  const op_t *word_ptr = (const op_t*) PTR_ALIGN_DOWN (str, sizeof (op_t));

  op_t word = *word_ptr;
  find_t mask = shift_find (find_zero_all (word), s_int);
  if (mask != 0)
    return index_first (mask);

  do
    word = *++word_ptr;
  while (! has_zero (word));

  return ((const char *) word_ptr) + index_first_zero (word) - str;
```

```c:line-numbers=29 [原文]
/* Return the length of the null-terminated string STR.  Scan for
   the null terminator quickly by testing four bytes at a time.  */
size_t
__strlen (const char *str)
{
  /* Align pointer to sizeof op_t.  */
  const uintptr_t s_int = (uintptr_t) str;
  const op_t *word_ptr = (const op_t*) PTR_ALIGN_DOWN (str, sizeof (op_t));

  op_t word = *word_ptr;
  find_t mask = shift_find (find_zero_all (word), s_int);
  if (mask != 0)
    return index_first (mask);

  do
    word = *++word_ptr;
  while (! has_zero (word));

  return ((const char *) word_ptr) + index_first_zero (word) - str;
```

:::

このコードが使う型と補助関数です。`op_t` は 1 語ぶんの整数型、`PTR_ALIGN_DOWN` はアドレスの切り下げ、`shift_find` は判定結果のシフトです。

<!-- source: sysdeps/generic/string-optype.h -->
```c:line-numbers=22
typedef unsigned long int __attribute__ ((__may_alias__)) op_t;
```

<!-- source: include/libc-pointer-arith.h -->
```c:line-numbers=46
#define ALIGN_DOWN(base, size)	((base) & -((__typeof__ (base)) (size)))
```

<!-- source: sysdeps/generic/string-shift.h -->
```c:line-numbers=29
static __always_inline find_t
shift_find (find_t word, uintptr_t s)
{
  if (__BYTE_ORDER == __LITTLE_ENDIAN)
    return word >> (CHAR_BIT * (s % sizeof (op_t)));
  else
    return word << (CHAR_BIT * (s % sizeof (op_t)));
}
```

## 前提知識

- **C の文字列**: C には文字列型がなく、「値 `0` のバイト（ヌル文字）で終わるバイトの並び」を文字列として扱います。長さを知るには `0` を探すしかありません。
- **ポインタ**: メモリ上の場所（アドレス）を表す値です。`const char *str` は「文字の並びの先頭を指すポインタ」。`*p` でその場所の値を読み、`++p` で次の要素に進みます。ポインタ同士の引き算は「間にある要素の数」になります。
- **`op_t`**: glibc 内部の型で、CPU が一度に扱える整数（64 ビット環境なら 8 バイトの `unsigned long`）です。`unsigned` は符号なし（負の数を持たない）という意味です。
- **`uintptr_t`**: ポインタを整数として扱うための型です。アドレスを 8 で割った余りを計算するときなどに使います。
- **`static __always_inline`**: 呼び出し元に中身を埋め込む（インライン展開する）ことをコンパイラに強く指示する指定です。小さな補助関数を使っても関数呼び出しのコストがかかりません。
- **アラインメント（整列）**: 8 バイトの読み込みは、アドレスが 8 の倍数のときに安全かつ速く行えます。`PTR_ALIGN_DOWN(p, 8)` は「p 以下で最も近い 8 の倍数のアドレス」です。
- **リトルエンディアン**: x86 などで使われる、整数の下位バイトをメモリの小さいアドレスに置く並べ方です。8 バイトを整数として読むと、メモリ上で最初のバイトが整数の一番下の 8 ビットになります。
- **`do { ... } while (条件);`**: 本体を先に 1 回実行してから条件を調べるループです。

## 何をしているか

### 1. 文字列の手前から 8 バイトを読む

```c:line-numbers=35
  const uintptr_t s_int = (uintptr_t) str;
  const op_t *word_ptr = (const op_t*) PTR_ALIGN_DOWN (str, sizeof (op_t));

  op_t word = *word_ptr;
```

まず `str` のアドレスを整数 `s_int` として保存し、`str` を 8 の倍数に切り下げたアドレス `word_ptr` を作ります。
たとえば `str` が `0x1005` なら `word_ptr` は `0x1000` です。そこから 8 バイトを 1 つの整数 `word` として読みます。
このとき `0x1000`〜`0x1004` の 5 バイトは **文字列とは関係のない手前のデータ** です。

### 2. 手前の分をシフトで捨てる

```c:line-numbers=39
  find_t mask = shift_find (find_zero_all (word), s_int);
  if (mask != 0)
    return index_first (mask);
```

`find_zero_all(word)` は、`word` の各バイトのうち値が 0 のバイトだけに `0x80` が立った整数を返します（別記事で解説）。
`shift_find` はそれを `8 × (s_int % 8)` ビット右へずらします。`str = 0x1005` なら 40 ビット右シフトで、手前 5 バイトぶんの判定結果が消え、`str` の先頭バイトの判定が一番下に来ます。
結果が 0 でなければ、最初の 8 バイトの中に終端があります。`index_first(mask)` は「一番下から数えて何バイト目に印があるか」を返すので、それがそのまま長さになります。

### 3. 残りは 8 バイトずつ

```c:line-numbers=43
  do
    word = *++word_ptr;
  while (! has_zero (word));
```

見つからなければ `word = *++word_ptr` で次の 8 バイトへ進み、`has_zero(word)` が真になるまで繰り返します。
`has_zero` は「0 のバイトがあるかどうか」だけを答える、より安い判定です。

### 4. 位置を確定して長さを返す

```c:line-numbers=47
  return ((const char *) word_ptr) + index_first_zero (word) - str;
```

`index_first_zero(word)` で、見つかった 8 バイトのうち最初の 0 のバイトの位置を求めます。
`word_ptr` の先頭アドレスにその位置を足し、`str` を引けば長さです。
`"hi"` が `0x1005` から始まる場合なら、最初の 8 バイトの判定で 2 バイト目（0 から数えて）に印が見つかり、ループに入らずに `2` を返します。

## ここがすごい

- **前処理ループがない**: 素直な書き方では、アドレスが 8 の倍数になるまで 1 バイトずつ進む前処理ループが必要です。この実装は「そろった位置から読んで、余計な部分の結果をシフトで消す」ので、分岐の多いループがまるごと不要になっています。
- **手前を読んでも安全**: `0x1000`〜`0x1007` は同じ 8 バイトのかたまりなので、メモリのページ（OS がアクセス権を管理する単位）の境目をまたぎません。`str` が読めるなら、同じかたまりの手前も読めます。
- **判定の使い分け**: 最初の 1 語だけ正確な `find_zero_all` を使い、ループ内では安い `has_zero` を使っています。安い判定は「本物の 0 より上位のバイトに誤った印が出ることがある」性質を持ちます。最初の語では手前の無関係なバイトに 0 があると、その影響で文字列側のバイトに誤った印が出るおそれがあるため、正確な版が必要なのです。ループ内では「あるかないか」だけ分かれば十分です。
- **部品化**: ビット演算の部分は `string-fza.h` などの小さな関数に分かれていて、`memchr` や `strchrnul` でも同じ部品を使い回しています。CPU によっては、この部品だけを専用命令で置き換えることもできます。

## まとめ

- 8 バイト単位で読むと、ループ回数を約 8 分の 1 にできる。
- アドレスを切り下げて読み、余計なバイトの結果をシフトで捨てれば、そろえるための前処理ループが要らない。
- 同じ 8 バイトのかたまりの中なら、文字列の手前を読んでもページ境界をまたがない。
- 正確だが少し高い判定と、安いが大まかな判定を、場面に応じて使い分ける。
