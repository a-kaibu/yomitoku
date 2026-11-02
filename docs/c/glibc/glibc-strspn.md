---
title: "256 バイトの表と 4 文字ずつの読み込みで速くする strspn"
description: "文字列の先頭から、指定した文字だけが続く長さを返す strspn。文字の集合を 256 要素の表に変え、終端の NUL を表の 0 で自然に止めるなど、比較を極限まで減らす工夫が詰まっている。"
language: c
project: glibc
repo: https://github.com/bminor/glibc
license: LGPL-2.1-or-later
copyright: "Copyright (C) 1991-2026 Free Software Foundation, Inc."
commit: "04e750e75b73957cf1c791535a3f4319534a52fc"
file: string/strspn.c
lines: [27, 75]
format: 2
function: "strspn"
difficulty: 2
tags: [文字列処理, 最適化, 探索, 標準ライブラリ]
---

## ひとことで

`strspn(str, accept)` は、`str` の先頭から **`accept` に含まれる文字だけが続く長さ** を返す標準関数です。
たとえば `strspn("123abc", "0123456789")` は、先頭の数字 3 文字ぶんで `3` を返します。
glibc の汎用版は、文字の集合を表に変えておき、1 文字あたり「表を 1 回引くだけ」で判定します。

## コード

::: code-group

```c:line-numbers=27 [日本語訳]
/* S の先頭部分のうち、ACCEPT に含まれる文字だけでできた
   最長の部分の長さを返す。  */
size_t
STRSPN (const char *str, const char *accept)
{
  if (accept[0] == '\0')
    return 0;
  if (__glibc_unlikely (accept[1] == '\0'))
    {
      const char *a = str;
      for (; *str == *accept; str++);
      return str - a;
    }

  /* 小さな memset を複数回使い、多くのターゲットでインライン化できるようにする。  */
  unsigned char table[256];
  unsigned char *p = memset (table, 0, 64);
  memset (p + 64, 0, 64);
  memset (p + 128, 0, 64);
  memset (p + 192, 0, 64);

  unsigned char *s = (unsigned char*) accept;
  /* strcspn と違い、表に NUL を加えない。そのため str[i] が NUL かどうかの
     確認を省ける。table['\0'] は 0 なので、そこでループの条件が
     止まるからだ。  */
  do
    p[*s++] = 1;
  while (*s);

  s = (unsigned char*) str;
  if (!p[s[0]]) return 0;
  if (!p[s[1]]) return 1;
  if (!p[s[2]]) return 2;
  if (!p[s[3]]) return 3;

  s = (unsigned char *) PTR_ALIGN_DOWN (s, 4);

  unsigned int c0, c1, c2, c3;
  do {
      s += 4;
      c0 = p[s[0]];
      c1 = p[s[1]];
      c2 = p[s[2]];
      c3 = p[s[3]];
  } while ((c0 & c1 & c2 & c3) != 0);

  size_t count = s - (unsigned char *) str;
  return (c0 & c1) == 0 ? count + c0 : count + c2 + 2;
}
```

```c:line-numbers=27 [原文]
/* Return the length of the maximum initial segment
   of S which contains only characters in ACCEPT.  */
size_t
STRSPN (const char *str, const char *accept)
{
  if (accept[0] == '\0')
    return 0;
  if (__glibc_unlikely (accept[1] == '\0'))
    {
      const char *a = str;
      for (; *str == *accept; str++);
      return str - a;
    }

  /* Use multiple small memsets to enable inlining on most targets.  */
  unsigned char table[256];
  unsigned char *p = memset (table, 0, 64);
  memset (p + 64, 0, 64);
  memset (p + 128, 0, 64);
  memset (p + 192, 0, 64);

  unsigned char *s = (unsigned char*) accept;
  /* Different from strcspn it does not add the NULL on the table
     so can avoid check if str[i] is NULL, since table['\0'] will
     be 0 and thus stopping the loop check.  */
  do
    p[*s++] = 1;
  while (*s);

  s = (unsigned char*) str;
  if (!p[s[0]]) return 0;
  if (!p[s[1]]) return 1;
  if (!p[s[2]]) return 2;
  if (!p[s[3]]) return 3;

  s = (unsigned char *) PTR_ALIGN_DOWN (s, 4);

  unsigned int c0, c1, c2, c3;
  do {
      s += 4;
      c0 = p[s[0]];
      c1 = p[s[1]];
      c2 = p[s[2]];
      c3 = p[s[3]];
  } while ((c0 & c1 & c2 & c3) != 0);

  size_t count = s - (unsigned char *) str;
  return (c0 & c1) == 0 ? count + c0 : count + c2 + 2;
}
```

:::

## 前提知識

- **C の文字列**: 文字の並びの最後に、値 `0` のバイト（`'\0'`、NUL）が置かれたものです。
- **ポインタと添字**: `s[1]` は「`s` の 1 つ先の文字」です。`*s++` は「今の文字を使ってから次へ進む」です。ポインタ同士の引き算は、その間の要素数です。
- **`unsigned char`**: 0〜255 の値を持つ 1 バイトの型です。`char` は環境によって負の値になることがあるので、配列の添字に使うときは `unsigned char` に変えます。
- **表（ルックアップテーブル）**: `unsigned char table[256]` は、各バイト値に対して 1 バイトの情報を持つ配列です。`p[c]` で「文字 `c` が集合に入っているか」がすぐ分かります。
- **`memset(p, 0, 64)`**: `p` から 64 バイトを 0 で埋める標準関数です。戻り値は `p` です。
- **`__glibc_unlikely`**: 「この条件はめったに真にならない」というコンパイラへのヒントです。
- **`PTR_ALIGN_DOWN(s, 4)`**: アドレスを 4 の倍数に切り下げるマクロです。
- **`do { ... } while (条件);`**: 本体を先に 1 回実行してから条件を調べるループです。

## 何をしているか

### 1. 簡単な場合を先に片づける

```c:line-numbers=32
  if (accept[0] == '\0')
    return 0;
  if (__glibc_unlikely (accept[1] == '\0'))
    {
      const char *a = str;
      for (; *str == *accept; str++);
      return str - a;
    }
```

`accept` が空なら答えは 0 です。`accept` が 1 文字だけなら、表を作るまでもなく「その文字と等しい間進む」だけで済みます。
`for (; *str == *accept; str++);` は本体が空のループで、条件式だけで仕事をしています。`str` が `'\0'` に来れば `*accept`（0 ではない）と等しくないので止まります。

### 2. 表を作る

```c:line-numbers=42
  unsigned char table[256];
  unsigned char *p = memset (table, 0, 64);
  memset (p + 64, 0, 64);
  memset (p + 128, 0, 64);
  memset (p + 192, 0, 64);

  unsigned char *s = (unsigned char*) accept;
  /* strcspn と違い、表に NUL を加えない。そのため str[i] が NUL かどうかの
     確認を省ける。table['\0'] は 0 なので、そこでループの条件が
     止まるからだ。  */
  do
    p[*s++] = 1;
  while (*s);
```

256 バイトの表を 64 バイトずつ 4 回に分けて 0 で埋め、`accept` の各文字の位置に 1 を書きます。
たとえば `accept = "ab"` なら `p['a'] = p['b'] = 1` で、ほかは 0 です。
**`'\0'` の位置には 1 を書かない** のがポイントです。こうしておくと、`str` の終端に来たとき `p['\0']` が 0 なので、終端の確認を別にしなくても自然に止まります。

### 3. 最初の 4 文字

```c:line-numbers=56
  s = (unsigned char*) str;
  if (!p[s[0]]) return 0;
  if (!p[s[1]]) return 1;
  if (!p[s[2]]) return 2;
  if (!p[s[3]]) return 3;
```

先頭の 4 文字を 1 文字ずつ調べます。短い答え（0〜3）なら、ここで即座に返ります。

### 4. 4 文字ずつまとめて調べる

```c:line-numbers=62
  s = (unsigned char *) PTR_ALIGN_DOWN (s, 4);

  unsigned int c0, c1, c2, c3;
  do {
      s += 4;
      c0 = p[s[0]];
      c1 = p[s[1]];
      c2 = p[s[2]];
      c3 = p[s[3]];
  } while ((c0 & c1 & c2 & c3) != 0);
```

`s` を 4 の倍数に切り下げてから、4 文字ずつ表を引きます。4 つの結果 `c0`〜`c3` は 0 か 1 なので、`c0 & c1 & c2 & c3` が 1 である間は「4 文字とも集合に入っている」と分かります。
切り下げた位置から始めても、`s += 4` を先に行うので、すでに調べた先頭 4 文字の後ろから続きを調べることになります。

### 5. どこで止まったかを計算する

```c:line-numbers=73
  size_t count = s - (unsigned char *) str;
  return (c0 & c1) == 0 ? count + c0 : count + c2 + 2;
```

`count` は 4 文字のかたまりの先頭までの長さです。止まった場所は、かたまりの中の 0〜3 文字目のどれかです。

- `c0 = 0` なら `count + 0`
- `c0 = 1, c1 = 0` なら `count + 1`（`c0` の値 1 を足す）
- `c0 = c1 = 1` で `c2 = 0` なら `count + 0 + 2`
- `c2 = 1`（つまり `c3 = 0`）なら `count + 1 + 2`

と、`if` を重ねずに 1 つの式で位置を出しています。

## ここがすごい

- **集合の判定を表引き 1 回に**: 素直に書くと、`str` の 1 文字ごとに `accept` の全文字と比べるので、`accept` が長いほど遅くなります。表を作れば、1 文字の判定は `accept` の長さに関係なく 1 回の配列アクセスです。
- **終端の確認を表に任せる**: 表の `'\0'` の位置を 0 のままにしておくだけで、「終端か？」という比較をループから取り除いています。コメントにあるとおり、`strcspn`（逆に「含まれない文字」が続く長さ）では NUL を表に入れる必要があり、この 2 つは鏡写しの関係です。
- **4 文字ずつの展開**: ループ 1 周で 4 文字ぶん表を引き、AND 1 回で判定するので、分岐の回数が 4 分の 1 になります。終わりの位置は 0/1 の値を足し算に使う式で求め、ここでも分岐を減らしています。
- **はみ出しても安全な読み方**: 4 の倍数にそろえたかたまりの中は、メモリのページ境界をまたぎません。終端の後ろを数バイト読んでも、読めない領域には触れないのです。
- **memset の分割**: コメントによれば、64 バイトずつ 4 回に分けるのは、コンパイラが `memset` を関数呼び出しではなく数個の命令に置き換え（インライン化し）やすくするためです。

## まとめ

- 「この文字は集合に入っているか」は、256 要素の表で 1 回の配列アクセスにできる。
- 表の `'\0'` の位置を 0 にしておけば、終端の確認を省ける。
- 0 と 1 の値は、そのまま足し算や AND に使うと分岐を減らせる。
- そろえたアドレスからまとめて読めば、ページ境界をまたがずに速く読める。
