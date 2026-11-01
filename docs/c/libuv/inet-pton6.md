---
title: "「::」の位置を覚えておき、最後にまとめて後ろへずらす IPv6 の読み取り"
description: "「2001:db8::1」のような文字列を 16 バイトの IPv6 アドレスに変換する関数の本体。省略部分の位置だけ記録して読み進め、最後に後半を末尾へ移して 0 を埋める。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright (c) 2004 by Internet Systems Consortium, Inc. (ISC); Copyright (c) 1996-1999 by Internet Software Consortium; Copyright (c) 2012-2026 by libuv project contributors."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/inet.c
lines: [233, 309]
function: "inet_pton6"
difficulty: 3
format: 2
tags: [ネットワーク, パース, 状態機械]
---

## ひとことで

`inet_pton6` は、`"2001:db8::1"` のような IPv6 アドレスの文字列を、16 バイトのデータに変換する関数です。
難しいのは `::`（0 が続く部分の省略）です。読んでいる途中では、省略された 0 が何個なのかわかりません。
そこでこの関数は、**`::` の位置だけを覚えて前に詰めて書いていき、最後に後半を末尾まで移動する** という方法で解決しています。

## コード

::: code-group

```c:line-numbers=233 [日本語訳]
  memset((tp = tmp), '\0', sizeof(tmp));
  endp = tp + sizeof(tmp);
  colonp = NULL;
  /* 先頭の :: には特別な扱いが必要。 */
  if (*src == ':')
    if (*++src != ':')
      return UV_EINVAL;
  curtok = src;
  seen_xdigits = 0;
  val = 0;
  while ((ch = *src++) != '\0') {
    const char *pch;

    if ((pch = strchr((xdigits = xdigits_l), ch)) == NULL)
      pch = strchr((xdigits = xdigits_u), ch);
    if (pch != NULL) {
      val <<= 4;
      val |= (pch - xdigits);
      if (++seen_xdigits > 4)
        return UV_EINVAL;
      continue;
    }
    if (ch == ':') {
      curtok = src;
      if (!seen_xdigits) {
        if (colonp)
          return UV_EINVAL;
        colonp = tp;
        continue;
      } else if (*src == '\0') {
        return UV_EINVAL;
      }
      if (tp + sizeof(uint16_t) > endp)
        return UV_EINVAL;
      *tp++ = (unsigned char) (val >> 8) & 0xff;
      *tp++ = (unsigned char) val & 0xff;
      seen_xdigits = 0;
      val = 0;
      continue;
    }
    if (ch == '.' && ((tp + sizeof(struct in_addr)) <= endp)) {
      int err = inet_pton4(curtok, tp);
      if (err == 0) {
        tp += sizeof(struct in_addr);
        seen_xdigits = 0;
        break;  /*%< '\\0' は inet_pton4() が読み終えている。 */
      }
    }
    return UV_EINVAL;
  }
  if (seen_xdigits) {
    if (tp + sizeof(uint16_t) > endp)
      return UV_EINVAL;
    *tp++ = (unsigned char) (val >> 8) & 0xff;
    *tp++ = (unsigned char) val & 0xff;
  }
  if (colonp != NULL) {
    /*
     * 重なった領域を正しく扱えない memmove() が
     * 一部にあるので、ずらす処理は自前で行う。
     */
    const int n = tp - colonp;
    int i;

    if (tp == endp)
      return UV_EINVAL;
    for (i = 1; i <= n; i++) {
      endp[- i] = colonp[n - i];
      colonp[n - i] = 0;
    }
    tp = endp;
  }
  if (tp != endp)
    return UV_EINVAL;
  memcpy(dst, tmp, sizeof(tmp));
  return 0;
}
```

```c:line-numbers=233 [原文]
  memset((tp = tmp), '\0', sizeof(tmp));
  endp = tp + sizeof(tmp);
  colonp = NULL;
  /* Leading :: requires some special handling. */
  if (*src == ':')
    if (*++src != ':')
      return UV_EINVAL;
  curtok = src;
  seen_xdigits = 0;
  val = 0;
  while ((ch = *src++) != '\0') {
    const char *pch;

    if ((pch = strchr((xdigits = xdigits_l), ch)) == NULL)
      pch = strchr((xdigits = xdigits_u), ch);
    if (pch != NULL) {
      val <<= 4;
      val |= (pch - xdigits);
      if (++seen_xdigits > 4)
        return UV_EINVAL;
      continue;
    }
    if (ch == ':') {
      curtok = src;
      if (!seen_xdigits) {
        if (colonp)
          return UV_EINVAL;
        colonp = tp;
        continue;
      } else if (*src == '\0') {
        return UV_EINVAL;
      }
      if (tp + sizeof(uint16_t) > endp)
        return UV_EINVAL;
      *tp++ = (unsigned char) (val >> 8) & 0xff;
      *tp++ = (unsigned char) val & 0xff;
      seen_xdigits = 0;
      val = 0;
      continue;
    }
    if (ch == '.' && ((tp + sizeof(struct in_addr)) <= endp)) {
      int err = inet_pton4(curtok, tp);
      if (err == 0) {
        tp += sizeof(struct in_addr);
        seen_xdigits = 0;
        break;  /*%< '\\0' was seen by inet_pton4(). */
      }
    }
    return UV_EINVAL;
  }
  if (seen_xdigits) {
    if (tp + sizeof(uint16_t) > endp)
      return UV_EINVAL;
    *tp++ = (unsigned char) (val >> 8) & 0xff;
    *tp++ = (unsigned char) val & 0xff;
  }
  if (colonp != NULL) {
    /*
     * Since some memmove()'s erroneously fail to handle
     * overlapping regions, we'll do the shift by hand.
     */
    const int n = tp - colonp;
    int i;

    if (tp == endp)
      return UV_EINVAL;
    for (i = 1; i <= n; i++) {
      endp[- i] = colonp[n - i];
      colonp[n - i] = 0;
    }
    tp = endp;
  }
  if (tp != endp)
    return UV_EINVAL;
  memcpy(dst, tmp, sizeof(tmp));
  return 0;
}
```

:::

引用は関数の本体から始まります。直前で、次の変数が宣言されています。

```c:line-numbers=225
static int inet_pton6(const char *src, unsigned char *dst) {
  static const char xdigits_l[] = "0123456789abcdef",
                    xdigits_u[] = "0123456789ABCDEF";
  unsigned char tmp[sizeof(struct in6_addr)], *tp, *endp, *colonp;
  const char *xdigits, *curtok;
  int ch, seen_xdigits;
  unsigned int val;
```

## 前提知識

- **IPv6 アドレス**: 16 バイトの番号を、16 ビットずつ 8 つの 16 進数で `2001:db8:0:0:0:0:0:1` のように書きます。0 が続く部分は 1 か所だけ `::` に縮められ、`2001:db8::1` と書けます。末尾に `192.0.2.1` のような IPv4 形式を付けることもできます。
- **`unsigned char tmp[16]`**: 結果を組み立てる 16 バイトの作業領域です。`tp` が「次に書く位置」、`endp` が「終わりの次」、`colonp` が「`::` があった位置」を指すポインタです。
- **`strchr(文字列, 文字)`**: 文字列から文字を探し、見つかった位置か `NULL` を返します。`pch - xdigits` で、その文字が表す値（0〜15）がわかります。
- **ビット演算**: `val <<= 4` は 4 ビット左にずらす（16 倍する）、`val |= x` は下位に x を入れる操作です。`val >> 8` で上位 8 ビット、`val & 0xff` で下位 8 ビットを取り出せます。
- **`endp[- i]`**: 配列の添字に負の数を使うと、そのポインタより前の要素を指します。`endp[-1]` は最後のバイトです。
- **`continue` / `break`**: ループの次の周回へ進む／ループを抜けるための文です。

## 何をしているか

### 1. 準備と先頭の `::`

```c:line-numbers=233
  memset((tp = tmp), '\0', sizeof(tmp));
  endp = tp + sizeof(tmp);
  colonp = NULL;
  /* Leading :: requires some special handling. */
  if (*src == ':')
    if (*++src != ':')
      return UV_EINVAL;
  curtok = src;
  seen_xdigits = 0;
  val = 0;
```

作業領域を 0 で埋め、`colonp` を「まだ `::` は無い」という意味の `NULL` にします。
先頭が `:` なら、次も `:` でなければエラーです（`:1` のような形を弾く）。先頭の 1 つ目の `:` は読み飛ばし、2 つ目を通常の処理に任せます。

### 2. 16 進数の桁

```c:line-numbers=246
    if ((pch = strchr((xdigits = xdigits_l), ch)) == NULL)
      pch = strchr((xdigits = xdigits_u), ch);
    if (pch != NULL) {
      val <<= 4;
      val |= (pch - xdigits);
      if (++seen_xdigits > 4)
        return UV_EINVAL;
      continue;
    }
```

小文字の表、次に大文字の表で文字を探し、見つかれば `val` に 4 ビットずつ足し込みます。1 区切りに 5 桁以上あればエラーです。

### 3. `:` が来たとき

```c:line-numbers=255
    if (ch == ':') {
      curtok = src;
      if (!seen_xdigits) {
        if (colonp)
          return UV_EINVAL;
        colonp = tp;
        continue;
      } else if (*src == '\0') {
        return UV_EINVAL;
      }
      if (tp + sizeof(uint16_t) > endp)
        return UV_EINVAL;
      *tp++ = (unsigned char) (val >> 8) & 0xff;
      *tp++ = (unsigned char) val & 0xff;
      seen_xdigits = 0;
      val = 0;
      continue;
    }
```

数字を読んでいない状態で `:` が来たら、それは `::` の 2 つ目です。すでに `::` があればエラー、なければ今の位置を `colonp` に覚えます。
数字を読んだ後の `:` なら、`val` を上位・下位の 2 バイトに分けて `tmp` に書きます。`:` で文字列が終わる（`1:` のような形）のはエラーです。

### 4. IPv4 形式

```c:line-numbers=273
    if (ch == '.' && ((tp + sizeof(struct in_addr)) <= endp)) {
      int err = inet_pton4(curtok, tp);
      if (err == 0) {
        tp += sizeof(struct in_addr);
        seen_xdigits = 0;
        break;  /*%< '\\0' was seen by inet_pton4(). */
      }
    }
    return UV_EINVAL;
```

`.` が来て、まだ 4 バイト分の空きがあれば、今の区切りの先頭 `curtok` から `inet_pton4` に解析を任せます。成功すれば 4 バイト進めてループを抜けます。それ以外の文字はすべてエラーです。

### 5. 最後の区切りを書く

```c:line-numbers=283
  if (seen_xdigits) {
    if (tp + sizeof(uint16_t) > endp)
      return UV_EINVAL;
    *tp++ = (unsigned char) (val >> 8) & 0xff;
    *tp++ = (unsigned char) val & 0xff;
  }
```

文字列の終わりで読みかけの数字があれば、それも 2 バイトで書きます。

### 6. `::` を展開する

```c:line-numbers=289
  if (colonp != NULL) {
    /*
     * Since some memmove()'s erroneously fail to handle
     * overlapping regions, we'll do the shift by hand.
     */
    const int n = tp - colonp;
    int i;

    if (tp == endp)
      return UV_EINVAL;
    for (i = 1; i <= n; i++) {
      endp[- i] = colonp[n - i];
      colonp[n - i] = 0;
    }
    tp = endp;
  }
```

`colonp` があれば、`colonp` から `tp` までに書いた後半のバイトを、**作業領域の末尾へずらし**、元の場所を 0 にします。すでに 16 バイト全部が埋まっていたら、`::` が 0 個の 0 を表すことになるのでエラーです（`if (tp == endp)`）。
最後に、ちょうど 16 バイトになっているかを確かめ、`dst` にコピーします。

### 例で追う

`"2001:db8::1"` の場合:

- `2001` → `20 01` を書く（`tp` は 2）
- `db8` → `0d b8` を書く（`tp` は 4）
- `::` の 2 つ目 → `colonp` = 4
- `1` → 文字列の終わりで `00 01` を書く（`tp` は 6）
- 展開: `n = 6 - 4 = 2`。4〜5 番の `00 01` を 14〜15 番へ移し、4〜5 番を 0 にする

結果は `20 01 0d b8 00 00 … 00 00 01` の 16 バイトです。

## ここがすごい

- **省略の長さを後から決める**: `::` が何ワードぶんかは、文字列を最後まで読まないとわかりません。2 回読む方法もありますが、この関数は「位置を覚えて前に詰めて書き、最後にずらす」ことで 1 回の走査で済ませています。後半のバイト数 `n = tp - colonp` さえわかれば、移動先は `endp` から逆算できます。
- **重なりに強い手作業の移動**: 展開部分のコメントは、「重なる領域を正しく扱えない `memmove` があるので、自分でずらす」と述べています。移動元と移動先は重なることがありますが、後ろの要素から順に移しているので、まだ移していないデータを上書きしません。
- **境界を何度も確かめる**: 2 バイト書く前や IPv4 を読む前に、必ず `endp` を越えないかを確かめています。不正な長い入力でも、16 バイトの作業領域の外には書きません。
- **IPv4 部分は既存の関数に任せる**: `::ffff:192.0.2.1` の IPv4 部分は、IPv4 用の厳しい解析関数をそのまま呼んでいます。同じ規則を 2 回書かずに済み、先頭の 0 の禁止なども自動的に引き継がれます。

## まとめ

- `::` のような「長さが後でわかる省略」は、位置を記録しておいて最後に展開できる。
- 後半を末尾へずらすときは、後ろから移すと重なっていても安全。
- 書き込みの前に必ず残りの領域を確かめると、不正な入力でもあふれない。
- 似た規則の解析は、既存の関数を呼び出して再利用する。
