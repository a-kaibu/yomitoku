---
title: "倍々に伸びて上限で止まる ― 安全な可変長バッファへの追記"
description: "curl の文字列バッファ dynbuf の心臓部。最初は 32 バイト、足りなければ 2 倍ずつ広げ、決めた上限を超えそうなら中身を捨てて失敗する。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/dynbuf.c
lines: [64, 119]
function: "dyn_nappend"
difficulty: 2
format: 2
tags: [メモリ管理, データ構造, 防御的プログラミング]
---

## ひとことで

`dyn_nappend` は、curl の可変長バッファ `dynbuf` の末尾にデータを追加します。領域が足りなければ 2 倍ずつ広げ、つねに最後にヌル文字を置いておきます。バッファごとに上限 `toobig` があり、それを超える追加は失敗します。HTTP ヘッダの組み立てなど、curl のあちこちで使われる部品です。

## コード

::: code-group

```c:line-numbers=64 [日本語訳]
/*
 * dynbuf にメモリのかたまりを格納・追記する。
 */
static CURLcode dyn_nappend(struct dynbuf *s,
                            const unsigned char *mem, size_t len)
{
  size_t idx = s->leng;
  size_t a = s->allc;
  size_t fit = len + idx + 1; /* 新しい文字列 + 古い文字列 + ゼロのバイト */

  /* 構造体にゴミが入っていないかを検出してみる */
  DEBUGASSERT(s->init == DYNINIT);
  DEBUGASSERT(s->toobig);
  DEBUGASSERT(idx < s->toobig);
  DEBUGASSERT(!s->leng || s->bufr);
  DEBUGASSERT(a <= s->toobig);
  DEBUGASSERT(!len || mem);

  if(fit > s->toobig) {
    curlx_dyn_free(s);
    return CURLE_TOO_LARGE;
  }
  else if(!a) {
    DEBUGASSERT(!idx);
    /* 初めての呼び出し */
    if(MIN_FIRST_ALLOC > s->toobig)
      a = s->toobig;
    else if(fit < MIN_FIRST_ALLOC)
      a = MIN_FIRST_ALLOC;
    else
      a = fit;
  }
  else {
    while(a < fit)
      a *= 2;
    if(a > s->toobig)
      /* 使ってよい量より大きいバッファを確保しても意味がない */
      a = s->toobig;
  }

  if(a != s->allc) {
    void *p = curlx_realloc(s->bufr, a);
    if(!p) {
      curlx_dyn_free(s);
      return CURLE_OUT_OF_MEMORY;
    }
    s->bufr = p;
    s->allc = a;
  }

  if(len)
    memcpy(&s->bufr[idx], mem, len);
  s->leng = idx + len;
  s->bufr[s->leng] = 0;
  return CURLE_OK;
}
```

```c:line-numbers=64 [原文]
/*
 * Store/append an chunk of memory to the dynbuf.
 */
static CURLcode dyn_nappend(struct dynbuf *s,
                            const unsigned char *mem, size_t len)
{
  size_t idx = s->leng;
  size_t a = s->allc;
  size_t fit = len + idx + 1; /* new string + old string + zero byte */

  /* try to detect if there is rubbish in the struct */
  DEBUGASSERT(s->init == DYNINIT);
  DEBUGASSERT(s->toobig);
  DEBUGASSERT(idx < s->toobig);
  DEBUGASSERT(!s->leng || s->bufr);
  DEBUGASSERT(a <= s->toobig);
  DEBUGASSERT(!len || mem);

  if(fit > s->toobig) {
    curlx_dyn_free(s);
    return CURLE_TOO_LARGE;
  }
  else if(!a) {
    DEBUGASSERT(!idx);
    /* first invoke */
    if(MIN_FIRST_ALLOC > s->toobig)
      a = s->toobig;
    else if(fit < MIN_FIRST_ALLOC)
      a = MIN_FIRST_ALLOC;
    else
      a = fit;
  }
  else {
    while(a < fit)
      a *= 2;
    if(a > s->toobig)
      /* no point in allocating a larger buffer than this is allowed to use */
      a = s->toobig;
  }

  if(a != s->allc) {
    void *p = curlx_realloc(s->bufr, a);
    if(!p) {
      curlx_dyn_free(s);
      return CURLE_OUT_OF_MEMORY;
    }
    s->bufr = p;
    s->allc = a;
  }

  if(len)
    memcpy(&s->bufr[idx], mem, len);
  s->leng = idx + len;
  s->bufr[s->leng] = 0;
  return CURLE_OK;
}
```

:::

`struct dynbuf` は `lib/curlx/dynbuf.h` で定義されています。最初に確保する最小量 `MIN_FIRST_ALLOC` は同じファイルの先頭で 32 と決められています。

<!-- source: lib/curlx/dynbuf.h -->
```c:line-numbers=27
struct dynbuf {
  char *bufr;    /* point to a null-terminated allocated buffer */
  size_t leng;   /* number of bytes *EXCLUDING* the null-terminator */
  size_t allc;   /* size of the current allocation */
  size_t toobig; /* size limit for the buffer */
#ifdef DEBUGBUILD
  int init;      /* detect API usage mistakes */
#endif
};
```

```c:line-numbers=29
#define MIN_FIRST_ALLOC 32
```

## 前提知識

- **`struct` と `->`**: `struct dynbuf` は「領域の先頭 `bufr`」「使っている長さ `leng`」「確保した大きさ `allc`」「上限 `toobig`」をまとめた型です。`s->leng` は「`s` が指す構造体の `leng`」です。
- **`static`**: このファイルの中だけで使う関数という印です。外からは `curlx_dyn_addn` などを通して呼ばれます。
- **`realloc(p, n)`**: すでに確保した領域 `p` を `n` バイトに広げ（必要なら別の場所に移し）、新しい先頭を返します。失敗すると `NULL` を返し、元の領域はそのまま残ります。`curlx_realloc` はその curl 版です。
- **`memcpy(dst, src, n)`**: `n` バイトをコピーします。`&s->bufr[idx]` は「領域の `idx` 番目の場所」です。
- **`size_t`**: 長さを表す負にならない整数型です。
- **`DEBUGASSERT`**: デバッグビルドでだけ条件を確かめ、偽なら止めるマクロです。
- **`CURLE_TOO_LARGE` / `CURLE_OUT_OF_MEMORY`**: curl の結果コードで、それぞれ「大きすぎる」「メモリ不足」を表します。

## 何をしているか

### 1. 必要な大きさを計算する

```c:line-numbers=70
  size_t idx = s->leng;
  size_t a = s->allc;
  size_t fit = len + idx + 1; /* new string + old string + zero byte */
```

`fit = len + idx + 1` は、新しいデータ・今のデータ・ヌル文字を全部入れるのに必要なバイト数です。

### 2. 中身が壊れていないかを確かめる

```c:line-numbers=75
  DEBUGASSERT(s->init == DYNINIT);
  DEBUGASSERT(s->toobig);
  DEBUGASSERT(idx < s->toobig);
  DEBUGASSERT(!s->leng || s->bufr);
  DEBUGASSERT(a <= s->toobig);
  DEBUGASSERT(!len || mem);
```

デバッグビルドでは、初期化済みの印 `init`、長さと確保量の関係などを確かめます。初期化を忘れた構造体を使うと、ここで止まります。

### 3. 上限を超えるなら捨てて失敗

```c:line-numbers=82
  if(fit > s->toobig) {
    curlx_dyn_free(s);
    return CURLE_TOO_LARGE;
  }
```

`fit` が `toobig` を超えたら、バッファを解放して `CURLE_TOO_LARGE` を返します。

### 4. 新しい確保量を決める

```c:line-numbers=86
  else if(!a) {
    DEBUGASSERT(!idx);
    /* first invoke */
    if(MIN_FIRST_ALLOC > s->toobig)
      a = s->toobig;
    else if(fit < MIN_FIRST_ALLOC)
      a = MIN_FIRST_ALLOC;
    else
      a = fit;
  }
  else {
    while(a < fit)
      a *= 2;
    if(a > s->toobig)
      /* no point in allocating a larger buffer than this is allowed to use */
      a = s->toobig;
  }
```

初めての追加（`allc` が 0）なら、最低 32 バイトを確保します。ただし上限が 32 より小さければ上限ちょうど、必要量が 32 より大きければ必要量ちょうどです。

2 回目以降は、`while(a < fit)` で足りるまで 2 倍にします。広げ過ぎて上限を超えたら、上限に切り詰めます。

`toobig = 1000` で 10 バイトずつ追加していくと、確保量は 32 → 64 → 128 → 256 → 512 と増え、次は 1024 ではなく 1000 になります。

### 5. 必要なら realloc

```c:line-numbers=104
  if(a != s->allc) {
    void *p = curlx_realloc(s->bufr, a);
    if(!p) {
      curlx_dyn_free(s);
      return CURLE_OUT_OF_MEMORY;
    }
    s->bufr = p;
    s->allc = a;
  }
```

確保量が変わるときだけ `curlx_realloc` を呼びます。失敗したらバッファを解放して `CURLE_OUT_OF_MEMORY` を返します。

### 6. コピーして終端

```c:line-numbers=114
  if(len)
    memcpy(&s->bufr[idx], mem, len);
  s->leng = idx + len;
  s->bufr[s->leng] = 0;
  return CURLE_OK;
```

データを末尾にコピーし、長さを更新して、最後にヌル文字を置きます。

## ここがすごい

- **2 倍ずつ広げる**: 1 バイト足りないたびに 1 バイトだけ広げると、追加のたびに `realloc` とコピーが起きます。2 倍ずつ広げれば `realloc` の回数は全体の長さの対数程度に減り、1 回の追加あたりのコストは平均すると一定になります。
- **上限を構造体に持たせる**: どのバッファにも「これ以上は大きくならない」という上限があります。サーバーから異常に長いヘッダが送られてきても、メモリを食いつぶす前に止まります。`dynbuf.h` には用途ごとの上限（`DYN_HTTP_REQUEST` など）が並んでいます。
- **失敗したら中身を捨てる**: 上限超過でもメモリ不足でも、途中まで書いた中途半端なデータを残さず、空の状態に戻します。呼び出し側は「失敗したらバッファは空」とだけ覚えておけばよく、後始末の書き忘れが減ります。
- **realloc の失敗を正しく扱う**: `s->bufr = realloc(s->bufr, a)` と書くと、失敗したときに元の領域のアドレスを失ってメモリリークになります。ここでは一度 `p` に受けてから代入しているので、そうなりません。
- **いつでもヌル文字で終わる**: バイナリデータを入れても末尾にヌル文字があるので、中身が文字列なら C の文字列関数にそのまま渡せます。

## まとめ

- 可変長バッファは 2 倍ずつ広げると、追加の平均コストが一定になる。
- バッファごとに上限を持たせると、悪意ある入力からメモリを守れる。
- `realloc` の結果は別の変数で受けてから代入する。
- 失敗したときの状態を「空」に統一すると、呼び出し側の後始末が簡単になる。
