---
title: "追記を繰り返しても遅くならない、文字列バッファの「倍々」拡張"
description: "SDS 文字列の後ろに空き容量を確保する関数。足りないときは必要量の 2 倍（1MB 以上なら +1MB）を確保し、ヘッダの種類が変わるときだけ realloc をやめて引っ越す。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2006-2015, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/sds.c
lines: [250, 310]
function: "_sdsMakeRoomFor"
difficulty: 3
tags: [メモリ管理, データ構造, 最適化]
---

## ひとことで

`_sdsMakeRoomFor` は、SDS 文字列 `s` の後ろに、少なくとも `addlen` バイトの空きを用意する関数です。
空きが十分ならなにもしません。足りなければ確保し直しますが、`greedy`（欲張り）が 1 なら **必要な量の 2 倍** を確保します。
これで、1 文字ずつ追記を繰り返しても、確保し直しの回数が少なく抑えられます。

## コード

```c:line-numbers=250
sds _sdsMakeRoomFor(sds s, size_t addlen, int greedy) {
    void *sh, *newsh;
    size_t avail = sdsavail(s);
    size_t len, newlen, reqlen;
    char type, oldtype = sdsType(s);
    int hdrlen;
    size_t bufsize, usable;
    int use_realloc;

    /* Return ASAP if there is enough space left. */
    if (avail >= addlen) return s;

    len = sdslen(s);
    sh = (char *)s - sdsHdrSize(oldtype);
    reqlen = newlen = (len + addlen);
    assert(newlen > len); /* Catch size_t overflow */
    if (greedy == 1) {
        if (newlen < SDS_MAX_PREALLOC)
            newlen *= 2;
        else
            newlen += SDS_MAX_PREALLOC;
    }

    type = sdsReqType(newlen);

    /* Don't use type 5: the user is appending to the string and type 5 is
     * not able to remember empty space, so sdsMakeRoomFor() must be called
     * at every appending operation. */
    if (type == SDS_TYPE_5) type = SDS_TYPE_8;

    hdrlen = sdsHdrSize(type);
    assert(hdrlen + newlen + 1 > reqlen); /* Catch size_t overflow */
    use_realloc = (oldtype == type);
    if (use_realloc) {
        newsh = s_realloc_usable(sh, hdrlen + newlen + 1, &bufsize);
        if (newsh == NULL) return NULL;
        s = (char *)newsh + hdrlen;

        if (adjustTypeIfNeeded(&type, &hdrlen, bufsize)) {
            memmove((char *)newsh + hdrlen, s, len + 1);
            s = (char *)newsh + hdrlen;
            s[-1] = type;
            sdssetlen(s, len);
        }
    } else {
        /* Since the header size changes, need to move the string forward,
         * and can't use realloc */
        newsh = s_malloc_usable(hdrlen + newlen + 1, &bufsize);
        if (newsh == NULL) return NULL;
        adjustTypeIfNeeded(&type, &hdrlen, bufsize);
        memcpy((char *)newsh + hdrlen, s, len + 1);
        s_free(sh);
        s = (char *)newsh + hdrlen;
        s[-1] = type;
        sdssetlen(s, len);
    }
    usable = bufsize - hdrlen - 1;
    assert(type == SDS_TYPE_5 || usable <= sdsTypeMaxSize(type));
    sdssetalloc(s, usable);
    return s;
}
```

## 前提知識

- **SDS**: Valkey の文字列形式です。文字列の中身の直前に「長さ `len`」「確保した大きさ `alloc`」「種類 `flags`」のヘッダがあります。`sds` 型は中身の先頭を指す `char *` で、ヘッダは `s` の **手前** にあります。ヘッダの大きさは種類（TYPE_5/8/16/32/64）によって 1〜17 バイトと異なります。
- **`sdsavail(s)` / `sdslen(s)`**: 空き容量（`alloc - len`）と、文字列の長さを返す関数です。
- **ポインタの計算**: `(char *)s - sdsHdrSize(oldtype)` は、中身の先頭からヘッダの大きさだけ戻った位置、つまり **確保したメモリの先頭** です。
- **`realloc`**: 確保済みのメモリの大きさを変える標準関数です。必要なら別の場所に移し、中身をコピーしてくれます。ここでは Valkey のラッパー `s_realloc_usable` を使い、「実際に使える大きさ」も `bufsize` で受け取ります。
- **`memmove` / `memcpy`**: メモリをコピーする関数です。`memmove` はコピー元と先が重なっていても正しく動きます。
- **`s[-1] = type`**: 中身の 1 バイト手前、つまりヘッダの `flags` に種類を書き込みます。
- **`assert(条件)`**: 条件が偽ならプログラムを止める、開発中の安全装置です。

## 何をしているか

### 1. 空きが足りていれば即終了（259〜260 行目）

`avail >= addlen` なら何もせず `s` を返します。追記のたびに呼ばれるので、この速い道が大事です。

### 2. 新しい大きさを決める（262〜271 行目）

長さ 100 の文字列に 50 バイト追記したい場合、`newlen = 150` です。`greedy == 1` で、150 は `SDS_MAX_PREALLOC`（1MB）未満なので **2 倍** の 300 にします。
長さが 1MB 以上なら、2 倍ではなく **1MB だけ** 足します。巨大な文字列で倍々にすると、使わない領域が大きくなりすぎるからです。
265 行目の `assert(newlen > len)` は、足し算が `size_t` の最大値を超えて巻き戻っていないかの確認です。

### 3. ヘッダの種類を決める（273〜280 行目）

新しい長さ 300 に必要な種類は TYPE_16 です。TYPE_5 には空き容量を記録する場所がないので、TYPE_5 になった場合は TYPE_8 に格上げします。

### 4a. 種類が同じなら realloc（282〜293 行目）

ヘッダの大きさが変わらないので、`realloc` で全体を広げるだけです。メモリの割り当て器（アロケータ）が要求より大きな領域をくれた場合、その大きさが今の種類の上限を超えることがあります。`adjustTypeIfNeeded` がそれを検出したら、より大きなヘッダに変え、中身を `memmove` で後ろにずらします。

### 4b. 種類が変わるなら引っ越し（294〜305 行目）

TYPE_8 から TYPE_16 のようにヘッダの大きさが変わると、中身の位置もずれます。`realloc` は中身を同じ相対位置にコピーするだけなので、使えません。そこで新しく `malloc` し、新しいヘッダの直後に中身（終端を含む `len + 1` バイト）を `memcpy` して、古いメモリを解放します。

### 5. 容量を記録（306〜309 行目）

実際に使える大きさ `bufsize` からヘッダと終端を引いたものを `alloc` に記録します。`len` は変えません。この関数は「場所を空けるだけ」で、文字列の長さは呼び出し側が後で更新します。

## ここがすごい

**倍々で償却 O(1)**: 追記のたびに「ちょうど必要なぶん」だけ広げると、n 回の追記で n 回の確保し直しとコピーが起き、合計で O(n²) の手間になります。2 倍ずつ広げれば、確保し直しは log n 回で済み、1 回あたりの追記は平均して定数時間（償却 O(1)）になります。

**上限 1MB の折衷**: 倍々は速い代わりに、最悪で半分近くが空きになります。1MB を超えたら「+1MB ずつ」に切り替えることで、巨大な文字列での無駄を抑えています。速さとメモリのトレードオフに、明確な線を引いているわけです。

**アロケータがくれた余りも使う**: `malloc` は内部で決まった大きさの区画に切り上げて渡すことがあります。`s_malloc_usable` でその「本当に使える大きさ」を受け取り、`alloc` に反映しているので、余った部分も空き容量として活かせます。

**realloc と malloc の使い分け**: ヘッダが同じなら `realloc`（その場で広げられればコピーなし）、変わるなら `malloc`+`memcpy`。ヘッダが可変長の設計ならではの分岐で、どちらの道でも最後に `s[-1]` へ種類を書き直しています。

## まとめ

- 可変長バッファは「足りなければ 2 倍」に広げると、追記が平均定数時間になる。
- 巨大なバッファでは倍々をやめ、一定量ずつ増やすと無駄が減る。
- ヘッダの大きさが変わるときは、`realloc` ではなく新しく確保して中身を正しい位置にコピーする。
- アロケータが実際にくれた大きさを記録すれば、切り上げの余りも使える。
