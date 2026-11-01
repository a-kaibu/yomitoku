---
title: "バッファの「後ろ n バイトだけ残す」を memmove 1 回で"
description: "dynbuf の末尾だけを残して前を捨てる関数。範囲外、全部残す、全部捨てる、の境界を先に片付けてから、重なりに強い memmove で詰める。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/dynbuf.c
lines: [135, 157]
function: "curlx_dyn_tail"
difficulty: 1
format: 2
tags: [メモリ管理, データ構造, エラー処理]
---

## ひとことで

`curlx_dyn_tail` は、可変長バッファ `dynbuf` の中身のうち、**末尾の `trail` バイトだけを残して**前を捨てます。中身が `"HTTP/1.1 200 OK\r\n"` で `trail = 4` なら、`"OK\r\n"` だけが残ります。確保済みの領域はそのまま使い回します。

## コード

::: code-group

```c:line-numbers=135 [日本語訳]
/*
 * 残す末尾の大きさ（バッファの終わりから数えたバイト数）を
 * 指定する。それ以外は捨てる。
 */
CURLcode curlx_dyn_tail(struct dynbuf *s, size_t trail)
{
  DEBUGASSERT(s);
  DEBUGASSERT(s->init == DYNINIT);
  DEBUGASSERT(!s->leng || s->bufr);
  if(trail > s->leng)
    return CURLE_BAD_FUNCTION_ARGUMENT;
  else if(trail == s->leng)
    return CURLE_OK;
  else if(!trail) {
    curlx_dyn_reset(s);
  }
  else {
    memmove(&s->bufr[0], &s->bufr[s->leng - trail], trail);
    s->leng = trail;
    s->bufr[s->leng] = 0;
  }
  return CURLE_OK;
}
```

```c:line-numbers=135 [原文]
/*
 * Specify the size of the tail to keep (number of bytes from the end of the
 * buffer). The rest is dropped.
 */
CURLcode curlx_dyn_tail(struct dynbuf *s, size_t trail)
{
  DEBUGASSERT(s);
  DEBUGASSERT(s->init == DYNINIT);
  DEBUGASSERT(!s->leng || s->bufr);
  if(trail > s->leng)
    return CURLE_BAD_FUNCTION_ARGUMENT;
  else if(trail == s->leng)
    return CURLE_OK;
  else if(!trail) {
    curlx_dyn_reset(s);
  }
  else {
    memmove(&s->bufr[0], &s->bufr[s->leng - trail], trail);
    s->leng = trail;
    s->bufr[s->leng] = 0;
  }
  return CURLE_OK;
}
```

:::

`struct dynbuf` の主なメンバーは、領域の先頭 `bufr`、ヌル文字を除いた長さ `leng`、確保量 `allc` です。空にするときに呼ぶ `curlx_dyn_reset` は同じファイルにあり、長さを 0 にして先頭にヌル文字を書くだけです。

```c:line-numbers=125
void curlx_dyn_reset(struct dynbuf *s)
{
  DEBUGASSERT(s);
  DEBUGASSERT(s->init == DYNINIT);
  DEBUGASSERT(!s->leng || s->bufr);
  if(s->leng)
    s->bufr[0] = 0;
  s->leng = 0;
}
```

## 前提知識

- **`struct` と `->`**: `s->leng` は「`s` が指す構造体の `leng` メンバー」です。
- **`&s->bufr[i]`**: 領域の `i` 番目の場所のアドレスです。`&s->bufr[0]` は先頭、`&s->bufr[s->leng - trail]` は「後ろから `trail` バイトの位置」です。
- **`memmove(dst, src, n)`**: `n` バイトを `src` から `dst` へコピーします。`memcpy` と違い、**コピー元とコピー先が重なっていても正しく動く**ことが保証されています。
- **`size_t`**: 長さを表す負にならない整数型です。
- **`CURLcode`**: curl の結果コードです。`CURLE_OK` は成功、`CURLE_BAD_FUNCTION_ARGUMENT` は「引数がおかしい」です。
- **`DEBUGASSERT`**: デバッグビルドでだけ条件を確かめるマクロです。

## 何をしているか

### 1. 使い方の誤りを検出

```c:line-numbers=141
  DEBUGASSERT(s);
  DEBUGASSERT(s->init == DYNINIT);
  DEBUGASSERT(!s->leng || s->bufr);
```

構造体が初期化済みか（`init` が決まった値か）、長さが 0 でないなら領域があるか、を確かめます。

### 2. 残す量が長さより多い

```c:line-numbers=144
  if(trail > s->leng)
    return CURLE_BAD_FUNCTION_ARGUMENT;
```

10 バイトしかないのに 20 バイト残せ、と言われたら、引数の誤りとして失敗を返します。中身は変えません。

### 3. 全部残す

```c:line-numbers=146
  else if(trail == s->leng)
    return CURLE_OK;
```

`trail` と長さが同じなら、何もしなくてよいのですぐ成功を返します。

### 4. 何も残さない

```c:line-numbers=148
  else if(!trail) {
    curlx_dyn_reset(s);
  }
```

`trail` が 0 なら `curlx_dyn_reset` で空にします。

### 5. 後ろを先頭に詰める

```c:line-numbers=151
  else {
    memmove(&s->bufr[0], &s->bufr[s->leng - trail], trail);
    s->leng = trail;
    s->bufr[s->leng] = 0;
  }
```

`memmove` で、後ろから `trail` バイトを先頭へ移します。長さを `trail` にして、その直後にヌル文字を置きます。

`"HTTP/1.1 200 OK\r\n"`（長さ 17）、`trail = 4` なら、13 番目から始まる `"OK\r\n"` を先頭に移し、長さを 4 にして 4 番目にヌル文字を置きます。

## ここがすごい

- **境界の場合を先に片付ける**: 「多すぎる」「ちょうど全部」「0」を最初に `if` で処理しているので、最後の `else` では「1 以上で長さ未満」という場合だけを考えればよくなります。`memmove` に長さ 0 や範囲外の値が渡ることがありません。
- **memmove を選ぶ理由**: 同じ領域の中で後ろから前へ写すので、コピー元とコピー先が重なることがあります（上の例でも、長さ 17 のうち 13〜16 番目を 0〜3 番目に写します。`trail` が長さの半分を超えると実際に重なります）。`memcpy` は重なりを想定していないので、結果が壊れる可能性があります。`memmove` ならその心配がありません。
- **確保し直さない**: 中身が短くなっても領域は縮めません。このあとまた追記されることが多いので、同じ領域を使い回した方が `malloc` / `free` の回数が減ります。
- **何もしないで済むときは本当に何もしない**: `trail == leng` のときにコピーを省くのは小さな最適化ですが、「自分自身を自分自身に写す」無駄を避けています。

## まとめ

- 関数の最初に境界の場合（多すぎる・全部・0）を片付けると、本体が単純になる。
- 同じバッファの中でデータを移すときは、重なりに強い `memmove` を使う。
- 短くするときは確保量を変えず、長さとヌル文字だけを書き換えると速い。
- 引数が範囲外なら、中身を変えずにエラーを返す。
