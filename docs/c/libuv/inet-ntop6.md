---
title: "いちばん長いゼロの連続を「::」に縮める IPv6 アドレスの文字列化"
description: "16 バイトの IPv6 アドレスを「2001:db8::1」のような文字列にする関数。最長のゼロの並びを 1 回の走査で見つけ、IPv4 埋め込み形式も見分ける。"
language: c
project: libuv
repo: https://github.com/libuv/libuv
license: ISC
copyright: "Copyright (c) 2004 by Internet Systems Consortium, Inc. (ISC); Copyright (c) 1996-1999 by Internet Software Consortium; Copyright (c) 2012-2026 by libuv project contributors."
commit: "7228e05f3e407ed3fa59edba920b8cd825b5d83d"
file: src/inet.c
lines: [81, 154]
function: "inet_ntop6"
difficulty: 2
format: 2
tags: [ネットワーク, 文字列処理, アルゴリズム]
---

## ひとことで

`inet_ntop6` は、16 バイトの IPv6 アドレスを、人が読める `2001:db8::1` のような文字列に変換する関数です（ntop は network to presentation の略）。
IPv6 では、0 が続く部分を `::` で 1 回だけ省略できます。この関数は **いちばん長い 0 の連続** を探して、そこを `::` にします。
`::ffff:192.0.2.1` のように IPv4 アドレスを含む形式も見分けて出力します。ファイルの先頭に ISC（Internet Systems Consortium）の 1990 年代からの著作権表示が残る、歴史あるコードです。

## コード

::: code-group

```c:line-numbers=81 [日本語訳]
  char tmp[UV__INET6_ADDRSTRLEN], *tp;
  struct { int base, len; } best, cur;
  unsigned int words[sizeof(struct in6_addr) / sizeof(uint16_t)];
  int i;

  /*
   * 前処理:
   * 入力の（バイト単位の）配列を、ワード単位の配列にコピーする。
   * :: で省略するために、src[] の中で最も長い 0x00 の連続を探す。
   */
  memset(words, '\0', sizeof(words));
  for (i = 0; i < (int) sizeof(struct in6_addr); i++)
    words[i / 2] |= (src[i] << ((1 - (i % 2)) << 3));
  best.base = -1;
  best.len = 0;
  cur.base = -1;
  cur.len = 0;
  for (i = 0; i < (int) ARRAY_SIZE(words); i++) {
    if (words[i] == 0) {
      if (cur.base == -1)
        cur.base = i, cur.len = 1;
      else
        cur.len++;
    } else {
      if (cur.base != -1) {
        if (best.base == -1 || cur.len > best.len)
          best = cur;
        cur.base = -1;
      }
    }
  }
  if (cur.base != -1) {
    if (best.base == -1 || cur.len > best.len)
      best = cur;
  }
  if (best.base != -1 && best.len < 2)
    best.base = -1;

  /*
   * 結果を整形する。
   */
  tp = tmp;
  for (i = 0; i < (int) ARRAY_SIZE(words); i++) {
    /* 最長の 0x00 の連続の中にいるか？ */
    if (best.base != -1 && i >= best.base &&
        i < (best.base + best.len)) {
      if (i == best.base)
        *tp++ = ':';
      continue;
    }
    /* 先頭の 0x00 の連続か、実際の 16 進数の後ろにいるか？ */
    if (i != 0)
      *tp++ = ':';
    /* このアドレスは IPv4 を埋め込んだものか？ */
    if (i == 6 && best.base == 0 && (best.len == 6 ||
        (best.len == 7 && words[7] != 0x0001) ||
        (best.len == 5 && words[5] == 0xffff))) {
      int err = inet_ntop4(src+12, tp, sizeof(tmp) - (tp - tmp));
      if (err)
        return err;
      tp += strlen(tp);
      break;
    }
    tp += snprintf(tp, sizeof(tmp) - (tp - tmp), "%x", words[i]);
  }
  /* 末尾が 0x00 の連続だったか？ */
  if (best.base != -1 && (best.base + best.len) == ARRAY_SIZE(words))
    *tp++ = ':';
  *tp++ = '\0';
  if ((size_t) (tp - tmp) > size)
    return UV_ENOSPC;
  uv__strscpy(dst, tmp, size);
  return 0;
}
```

```c:line-numbers=81 [原文]
  char tmp[UV__INET6_ADDRSTRLEN], *tp;
  struct { int base, len; } best, cur;
  unsigned int words[sizeof(struct in6_addr) / sizeof(uint16_t)];
  int i;

  /*
   * Preprocess:
   *  Copy the input (bytewise) array into a wordwise array.
   *  Find the longest run of 0x00's in src[] for :: shorthanding.
   */
  memset(words, '\0', sizeof(words));
  for (i = 0; i < (int) sizeof(struct in6_addr); i++)
    words[i / 2] |= (src[i] << ((1 - (i % 2)) << 3));
  best.base = -1;
  best.len = 0;
  cur.base = -1;
  cur.len = 0;
  for (i = 0; i < (int) ARRAY_SIZE(words); i++) {
    if (words[i] == 0) {
      if (cur.base == -1)
        cur.base = i, cur.len = 1;
      else
        cur.len++;
    } else {
      if (cur.base != -1) {
        if (best.base == -1 || cur.len > best.len)
          best = cur;
        cur.base = -1;
      }
    }
  }
  if (cur.base != -1) {
    if (best.base == -1 || cur.len > best.len)
      best = cur;
  }
  if (best.base != -1 && best.len < 2)
    best.base = -1;

  /*
   * Format the result.
   */
  tp = tmp;
  for (i = 0; i < (int) ARRAY_SIZE(words); i++) {
    /* Are we inside the best run of 0x00's? */
    if (best.base != -1 && i >= best.base &&
        i < (best.base + best.len)) {
      if (i == best.base)
        *tp++ = ':';
      continue;
    }
    /* Are we following an initial run of 0x00s or any real hex? */
    if (i != 0)
      *tp++ = ':';
    /* Is this address an encapsulated IPv4? */
    if (i == 6 && best.base == 0 && (best.len == 6 ||
        (best.len == 7 && words[7] != 0x0001) ||
        (best.len == 5 && words[5] == 0xffff))) {
      int err = inet_ntop4(src+12, tp, sizeof(tmp) - (tp - tmp));
      if (err)
        return err;
      tp += strlen(tp);
      break;
    }
    tp += snprintf(tp, sizeof(tmp) - (tp - tmp), "%x", words[i]);
  }
  /* Was it a trailing run of 0x00's? */
  if (best.base != -1 && (best.base + best.len) == ARRAY_SIZE(words))
    *tp++ = ':';
  *tp++ = '\0';
  if ((size_t) (tp - tmp) > size)
    return UV_ENOSPC;
  uv__strscpy(dst, tmp, size);
  return 0;
}
```

:::

引用は関数の途中（変数宣言）から始まります。その直前には、関数の見出しと、「16 ビットちょうどの型が無い機械もあるので、メモリを型で読み替える書き方はしない」という趣旨のコメントがあります。

```c:line-numbers=73
static int inet_ntop6(const unsigned char *src, char *dst, size_t size) {
  /*
   * Note that int32_t and int16_t need only be "at least" large enough
   * to contain a value of the specified size.  On some systems, like
   * Crays, there is no such thing as an integer variable with 16 bits.
   * Keep this in mind if you think this function should have been coded
   * to use pointer overlays.  All the world's not a VAX.
   */
```

## 前提知識

- **IPv6 アドレス**: 128 ビット（16 バイト）の番号です。16 ビットずつ 8 つの「ワード」に分け、16 進数で `2001:0db8:0000:0000:0000:0000:0000:0001` のように書きます。各ワードの先頭の 0 は省略でき、0 のワードが続く部分は 1 か所だけ `::` に縮められます。
- **`struct { int base, len; } best, cur;`**: 名前のない構造体を、その場で 2 つの変数 `best`・`cur` として作っています。`base` は 0 の連続の開始位置、`len` はその長さです。`best = cur;` で中身をまるごとコピーできます。
- **`ARRAY_SIZE(words)`**: 配列の要素数を求める libuv のマクロです（ここでは 8）。
- **`snprintf(バッファ, 大きさ, 書式, 値)`**: 書式に従って文字列を作り、書いた文字数を返します。`"%x"` は 16 進数で、先頭の 0 は付きません。
- **カンマ演算子**: `cur.base = i, cur.len = 1;` は 2 つの代入を 1 文として並べたものです。
- **ポインタ `tp`**: 作業用バッファ `tmp` の中の「次に書く位置」です。`*tp++ = ':'` は書いて 1 つ進めます。

## 何をしているか

### 1. バイトをワードにまとめる

```c:line-numbers=91
  memset(words, '\0', sizeof(words));
  for (i = 0; i < (int) sizeof(struct in6_addr); i++)
    words[i / 2] |= (src[i] << ((1 - (i % 2)) << 3));
```

16 バイトを 8 つのワードにまとめます。`(1 - (i % 2)) << 3` は、`i` が偶数なら 8、奇数なら 0 です。偶数番目のバイトを上位 8 ビットに、奇数番目を下位 8 ビットに置くので、ネットワークの並び（上位が先）のままワードになります。

### 2. 最長の 0 の連続を探す

```c:line-numbers=94
  best.base = -1;
  best.len = 0;
  cur.base = -1;
  cur.len = 0;
  for (i = 0; i < (int) ARRAY_SIZE(words); i++) {
    if (words[i] == 0) {
      if (cur.base == -1)
        cur.base = i, cur.len = 1;
      else
        cur.len++;
    } else {
      if (cur.base != -1) {
        if (best.base == -1 || cur.len > best.len)
          best = cur;
        cur.base = -1;
      }
    }
  }
  if (cur.base != -1) {
    if (best.base == -1 || cur.len > best.len)
      best = cur;
  }
  if (best.base != -1 && best.len < 2)
    best.base = -1;
```

`cur` が「今数えている 0 の連続」、`best` が「これまでで最長のもの」です。0 のワードが来たら `cur` を始めるか伸ばし、0 以外が来たら `cur` が `best` より長いか比べて更新します。ループの最後に、末尾まで続いていた連続も比べます。
`cur.len > best.len` と「より大きい」で比べるので、同じ長さなら先に見つかったほうが残ります。長さ 1 の連続は縮めません（`best.len < 2` なら取り消す）。

`2001:db8:0:0:1:0:0:0` なら、2〜3 番（長さ 2）と 5〜7 番（長さ 3）があり、後者が選ばれます。

### 3. 書き出す

```c:line-numbers=122
  tp = tmp;
  for (i = 0; i < (int) ARRAY_SIZE(words); i++) {
    /* Are we inside the best run of 0x00's? */
    if (best.base != -1 && i >= best.base &&
        i < (best.base + best.len)) {
      if (i == best.base)
        *tp++ = ':';
      continue;
    }
    /* Are we following an initial run of 0x00s or any real hex? */
    if (i != 0)
      *tp++ = ':';
    /* Is this address an encapsulated IPv4? */
    if (i == 6 && best.base == 0 && (best.len == 6 ||
        (best.len == 7 && words[7] != 0x0001) ||
        (best.len == 5 && words[5] == 0xffff))) {
      int err = inet_ntop4(src+12, tp, sizeof(tmp) - (tp - tmp));
      if (err)
        return err;
      tp += strlen(tp);
      break;
    }
    tp += snprintf(tp, sizeof(tmp) - (tp - tmp), "%x", words[i]);
  }
```

各ワードについて、最長の連続の中なら、その最初の位置でだけ `:` を書いて飛ばします。それ以外では、先頭でなければ区切りの `:` を書き、`%x` でワードを書きます。
先の例なら `2001` `:db8` `:0` `:0` `:1` と書き、5 番目で `:` を 1 つ足して `2001:db8:0:0:1:` となります。

### 4. IPv4 埋め込み形式

```c:line-numbers=135
    if (i == 6 && best.base == 0 && (best.len == 6 ||
        (best.len == 7 && words[7] != 0x0001) ||
        (best.len == 5 && words[5] == 0xffff))) {
      int err = inet_ntop4(src+12, tp, sizeof(tmp) - (tp - tmp));
      if (err)
        return err;
      tp += strlen(tp);
      break;
    }
```

先頭から 0 が続き、6 番目のワードまで来たとき、次のどれかなら最後の 4 バイトを `inet_ntop4` で `a.b.c.d` 形式にします。

- 0 が 6 ワード続く（`::192.0.2.1` の形）
- 0 が 7 ワード続き、最後が 1 ではない（`::1` はループバックなので普通に書く）
- 0 が 5 ワード続き、次が `ffff`（`::ffff:192.0.2.1`、IPv4 射影アドレス）

### 5. 末尾の処理

```c:line-numbers=147
  if (best.base != -1 && (best.base + best.len) == ARRAY_SIZE(words))
    *tp++ = ':';
  *tp++ = '\0';
  if ((size_t) (tp - tmp) > size)
    return UV_ENOSPC;
  uv__strscpy(dst, tmp, size);
  return 0;
```

0 の連続が末尾まで続いていたら、もう 1 つ `:` を足して `::` にします。先の例は `2001:db8:0:0:1::` になります。最後に、出力先 `dst` に収まるかを確かめてからコピーします。

## ここがすごい

- **1 回の走査で最長区間を求める**: 「今の区間」と「最良の区間」を持って 1 回なめるだけで、最長の 0 の連続が求まります。配列の最長区間を探す問題の、お手本のような書き方です。
- **作業用バッファを経由する**: いきなり `dst` に書かず、十分な大きさの `tmp` で組み立ててから、最後に長さを確かめてコピーしています。途中の `snprintf` で毎回の残量計算を気にせずに済み、`dst` が小さいときも中途半端な文字列を書かずに `UV_ENOSPC` を返せます。
- **移植性への配慮**: 関数冒頭のコメントは、「16 ビットちょうどの整数型がない機械もある。だからメモリを型で読み替える手抜きをしない」と述べています。`words[i / 2] |= ...` でバイトを 1 つずつシフトして組み立てているのはそのためで、CPU のバイト順（エンディアン）にも左右されません。

## まとめ

- IPv6 の文字列化では、最長の 0 の連続を `::` にし、長さ 1 の連続は縮めない。
- 「今の区間」と「最良の区間」の 2 つを持てば、最長区間は 1 回の走査で見つかる。
- 作業用バッファで組み立ててから最後にコピーすると、出力先のあふれを一度の確認で防げる。
- バイトをシフトで組み立てると、エンディアンや型の大きさに依存しない。
