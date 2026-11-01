---
title: "バッファの中身ごと所有権を渡す ― 「取り出したら空になる」API"
description: "dynbuf が持つメモリを呼び出し側に引き渡す 10 行の関数。コピーせずにポインタを渡し、自分の側は空に戻して二重解放を防ぐ。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/dynbuf.c
lines: [245, 255]
function: "curlx_dyn_take"
difficulty: 1
format: 2
tags: [メモリ管理, API設計, イディオム]
---

## ひとことで

`curlx_dyn_take` は、可変長バッファ `dynbuf` が確保していた文字列を、そのまま呼び出し側に渡します。戻り値はその文字列の先頭、`*plen` にはその長さが入ります。渡したあと、`dynbuf` は「何も持っていない」状態に戻ります。以後、その文字列を `free` する責任は受け取った側にあります。

## コード

```c:line-numbers=245
char *curlx_dyn_take(struct dynbuf *s, size_t *plen)
{
  char *ptr = s->bufr;
  DEBUGASSERT(s);
  DEBUGASSERT(s->init == DYNINIT);
  *plen = s->leng;
  s->bufr = NULL;
  s->leng = 0;
  s->allc = 0;
  return ptr;
}
```

`struct dynbuf` は `lib/curlx/dynbuf.h` で定義されています。

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

## 前提知識

- **`malloc` と `free`**: C では、`malloc` で確保したメモリは、使い終わったらだれかが必ず `free` で返す必要があります。返し忘れるとメモリリーク、2 回返すと二重解放（プログラムが壊れる原因）になります。
- **所有権**: 「このメモリを最後に `free` するのはだれか」という責任のことです。C の言語仕様にはない考え方ですが、設計の上でとても大事です。
- **`char *`**: 文字の並びを指すポインタです。ポインタを渡しても中身はコピーされず、同じメモリを指すだけです。
- **`size_t *plen`**: 長さを書き込む場所を指すポインタです。`*plen = s->leng;` で呼び出し元の変数に長さが入ります。C で「値を 2 つ返す」ときの定番です。
- **`NULL`**: どこも指していないポインタです。`free(NULL)` は何もしないことが C の規格で決まっています。
- **`DEBUGASSERT`**: デバッグビルドでだけ条件を確かめるマクロです。

## 何をしているか

### 1. 先頭のポインタを控える

```c:line-numbers=247
  char *ptr = s->bufr;
```

`char *ptr = s->bufr;` で、今のバッファの場所を手元に取っておきます。

### 2. 初期化済みかを確かめる

```c:line-numbers=248
  DEBUGASSERT(s);
  DEBUGASSERT(s->init == DYNINIT);
```

デバッグビルドでは、構造体が `curlx_dyn_init` で初期化されたかを印の値で確かめます。

### 3. 長さを渡す

```c:line-numbers=250
  *plen = s->leng;
```

呼び出し側が受け取る文字列の長さを `*plen` に書きます。中身にヌル文字が含まれていても、長さが分かれば正しく扱えます。

### 4. 自分は空になる

```c:line-numbers=251
  s->bufr = NULL;
  s->leng = 0;
  s->allc = 0;
```

`bufr` を `NULL`、`leng` と `allc` を 0 にします。これで `dynbuf` は「何も確保していない」初期状態と同じになります。

### 5. 控えたポインタを返す

```c:line-numbers=254
  return ptr;
```

1 で控えた場所を返します。

使い方は、たとえば次のようになります。

```c
curlx_dyn_add(&buf, "hello");
str = curlx_dyn_take(&buf, &len); /* str は "hello"、len は 5 */
curlx_dyn_free(&buf);             /* 空なので何も解放しない */
```

## ここがすごい

- **コピーしない引き渡し**: 組み立てた文字列を呼び出し側に返すとき、素直に書くと「新しく `malloc` して中身をコピーし、元のバッファを `free`」になります。この関数はポインタを渡すだけなので、長い文字列でもコピーが起きません。
- **二重解放を構造的に防ぐ**: 渡したあとに `bufr` を `NULL` にしているのが要です。もし `NULL` にしなければ、呼び出し側が `free` したあとに `curlx_dyn_free` も同じメモリを `free` してしまいます。`NULL` にしておけば、`curlx_dyn_free` が中で使う解放処理は `NULL` に対して何もしないので安全です。
- **再利用できる状態に戻る**: `allc` も 0 にしているので、次に追記すると新しい領域が確保されます。同じ `dynbuf` 変数をそのまま使い続けられます。
- **「取り出す」という名前**: `take` という名前自体が「所有権が移る」ことを表しています。ほかの言語の「ムーブ」や Rust の `Option::take` と同じ発想を、C の小さな関数で実現しています。

## まとめ

- C では「だれが最後に `free` するか」（所有権）を API で明確にする。
- 所有権を渡すときは、ポインタを返したうえで自分の側を `NULL` にすると二重解放を防げる。
- 中身をコピーせずポインタを渡すと、長いデータでも速い。
- 渡したあとも構造体を初期状態に戻しておくと、そのまま再利用できる。
