---
title: "初期化忘れを見つける「合言葉」― デバッグビルドだけのマジックナンバー"
description: "dynbuf の初期化関数。デバッグビルドでは構造体に決まった値を書き込み、ほかの関数でそれを確かめて、初期化し忘れた変数の使用を検出する。"
language: c
project: curl
repo: https://github.com/curl/curl
license: curl
copyright: "Copyright (C) Daniel Stenberg, <daniel@haxx.se>, et al."
commit: "97166c3b0bd5ad63d4d44a535c93be60aded7aef"
file: lib/curlx/dynbuf.c
lines: [35, 50]
function: "curlx_dyn_init"
difficulty: 1
format: 2
tags: [防御的プログラミング, テスト, マクロ]
---

## ひとことで

`curlx_dyn_init` は、可変長バッファ `dynbuf` を空の状態に初期化し、上限サイズ `toobig` を設定します。デバッグ用のビルドでは、さらに `init` というメンバーに `0xbee51da` という決まった値を書き込みます。ほかの操作関数はこの値を確かめ、初期化されていない構造体を渡されたら即座に止まります。

## コード

::: code-group

```c:line-numbers=35 [日本語訳]
/*
 * dynbuf 構造体を初期化する。
 */
void curlx_dyn_init(struct dynbuf *s, size_t toobig)
{
  DEBUGASSERT(s);
  DEBUGASSERT(toobig);
  DEBUGASSERT(toobig <= MAX_DYNBUF_SIZE); /* とんでもない間違いを捕まえる */
  s->bufr = NULL;
  s->leng = 0;
  s->allc = 0;
  s->toobig = toobig;
#ifdef DEBUGBUILD
  s->init = DYNINIT;
#endif
}
```

```c:line-numbers=35 [原文]
/*
 * Init a dynbuf struct.
 */
void curlx_dyn_init(struct dynbuf *s, size_t toobig)
{
  DEBUGASSERT(s);
  DEBUGASSERT(toobig);
  DEBUGASSERT(toobig <= MAX_DYNBUF_SIZE); /* catch crazy mistakes */
  s->bufr = NULL;
  s->leng = 0;
  s->allc = 0;
  s->toobig = toobig;
#ifdef DEBUGBUILD
  s->init = DYNINIT;
#endif
}
```

:::

`DYNINIT` は同じファイルの先頭、`MAX_DYNBUF_SIZE` は `lib/curlx/dynbuf.h` で定義されています。ほかの関数（たとえば `curlx_dyn_free`）の先頭には、`DEBUGASSERT(s->init == DYNINIT);` が書かれています。

```c:line-numbers=31
#ifdef DEBUGBUILD
#define DYNINIT 0xbee51da /* random pattern */
#endif
```

<!-- source: lib/curlx/dynbuf.h -->
```c:line-numbers=63
#define MAX_DYNBUF_SIZE (SIZE_MAX / 2)
```

## 前提知識

- **`struct` と `->`**: `s->bufr` は「`s` が指す構造体の `bufr` メンバー」です。
- **`#ifdef DEBUGBUILD` 〜 `#endif`**: `DEBUGBUILD` というマクロが定義されているとき（開発用にビルドしたとき）だけ、その間のコードをコンパイルします。製品用のビルドでは、そこは最初から無かったことになります。
- **`DEBUGASSERT(条件)`**: デバッグビルドでは条件が偽ならプログラムを止め、製品ビルドでは何もしないマクロです。
- **初期化されていない変数**: C では、関数の中で宣言した変数や `malloc` で確保した構造体の中身は、何が入っているか分かりません（以前そこにあったゴミが残っています）。
- **マジックナンバー**: 特別な意味を持たせた決まった値のことです。ここでは「初期化済み」の合言葉として使われています。
- **`SIZE_MAX`**: `size_t` 型の最大値です。

## 何をしているか

### 1. 引数を確かめる

```c:line-numbers=40
  DEBUGASSERT(s);
  DEBUGASSERT(toobig);
  DEBUGASSERT(toobig <= MAX_DYNBUF_SIZE); /* catch crazy mistakes */
```

構造体のポインタが `NULL` でないこと、上限が 0 でないこと、上限が `MAX_DYNBUF_SIZE`（`SIZE_MAX` の半分）以下であることを確かめます。その行のコメント「とんでもない間違いを捕まえる」のとおり、桁を間違えたような値を検出するためです。

### 2. 空の状態にする

```c:line-numbers=43
  s->bufr = NULL;
  s->leng = 0;
  s->allc = 0;
  s->toobig = toobig;
```

領域なし（`NULL`）、長さ 0、確保量 0 にし、上限を記録します。実際のメモリは、最初に何かを追加したときに初めて確保されます。

### 3. 合言葉を書き込む

```c:line-numbers=47
#ifdef DEBUGBUILD
  s->init = DYNINIT;
#endif
```

デバッグビルドでだけ、`init` に `DYNINIT` を入れます。

この先、`curlx_dyn_add` などを呼ぶと、関数の先頭で `s->init == DYNINIT` が確かめられます。初期化を忘れた構造体の `init` にはゴミが入っているので、まず一致せず、その場で止まります。

```c
struct dynbuf buf;            /* 初期化を忘れた */
curlx_dyn_add(&buf, "x");     /* デバッグビルドならここで止まる */
```

## ここがすごい

- **バグをその場で見つける**: 初期化忘れの構造体を使うと、ふつうは `bufr` のゴミの値をポインタとして使ってしまい、まったく別の場所でクラッシュしたり、たまたま動いたりします。原因の場所と症状の場所が離れるので、とても見つけにくいバグです。合言葉を確かめれば、間違って使った最初の呼び出しで止まります。
- **「ありそうにない値」を選ぶ**: 0 や 1 のような値は、ゴミとして偶然入っていることがよくあります。`0xbee51da` のような意味のない値なら、偶然一致する可能性はとても低くなります。
- **製品版ではコストゼロ**: `init` メンバー自体も `#ifdef DEBUGBUILD` の中で定義されているので、製品ビルドでは構造体が小さくなり、確かめる処理も消えます。開発中だけ安全装置を付ける、という割り切りです。
- **同じ仕組みを各所で使う**: curl の `llist.c` の `LLISTINIT`、`hash.c` の `HASHINIT` なども同じ考え方で、データ構造ごとに別の合言葉を使っています。
- **遅延確保**: 初期化ではメモリを確保しないので、初期化しただけで使わなかったバッファにはコストがかかりません。

## まとめ

- C の構造体は初期化を忘れるとゴミが入っており、原因から離れた場所で壊れる。
- デバッグビルドだけ「初期化済み」の合言葉を書き込み、各関数で確かめると、誤用をすぐ見つけられる。
- 合言葉には偶然一致しにくい値を選ぶ。
- `#ifdef` で囲めば、製品版には一切コストを残さない。
