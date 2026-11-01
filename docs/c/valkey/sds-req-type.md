---
title: "短い文字列には 1 バイト、長い文字列には 17 バイト。長さでヘッダの型を選ぶ"
description: "Valkey の文字列ライブラリ SDS が、文字列の長さに応じて 5 種類のヘッダから最小のものを選ぶ関数。短い文字列が大量にあるデータベースで、メモリを大きく節約する。"
language: c
project: Valkey
repo: https://github.com/valkey-io/valkey
license: BSD-3-Clause
copyright: "Copyright (c) 2006-2015, Redis Ltd."
commit: "7dfa61e04390990da64b9e982c3b0fc0da8c7c82"
file: src/sds.c
lines: [55, 66]
function: "sdsReqType"
difficulty: 2
tags: [メモリ管理, データ構造, 最適化]
---

## ひとことで

Valkey は文字列を **SDS**（Simple Dynamic Strings）という独自の形式で持ちます。SDS は文字列の前に「長さ」などを記録した **ヘッダ** を置きます。
`sdsReqType` は、文字列の長さを受け取り、それを記録できる **いちばん小さいヘッダの種類** を返す関数です。
長さ 10 なら 1 バイトのヘッダ（`SDS_TYPE_5`）、長さ 1000 なら 5 バイトのヘッダ（`SDS_TYPE_16`）が選ばれます。

## コード

```c:line-numbers=55
/* Returns the minimum SDS type required to store a string of the given length. */
char sdsReqType(size_t string_size) {
    if (string_size < 1 << 5) return SDS_TYPE_5;
    if (string_size <= (1 << 8) - sizeof(struct sdshdr8) - 1) return SDS_TYPE_8;
    if (string_size <= (1 << 16) - sizeof(struct sdshdr16) - 1) return SDS_TYPE_16;
#if (LONG_MAX == LLONG_MAX)
    if (string_size <= (1ll << 32) - sizeof(struct sdshdr32) - 1) return SDS_TYPE_32;
    return SDS_TYPE_64;
#else
    return SDS_TYPE_32;
#endif
}
```

ヘッダの定義は `src/sds.h` の 54〜81 行目にあります（抜粋）。`__packed__` は「すき間を詰めて並べる」という指定です。

```c
struct __attribute__((__packed__)) sdshdr5 {
    unsigned char flags; /* 3 lsb of type, and 5 msb of string length */
    char buf[];
};
struct __attribute__((__packed__)) sdshdr8 {
    uint8_t len;         /* used */
    uint8_t alloc;       /* excluding the header and null terminator */
    unsigned char flags; /* 3 lsb of type, 5 unused bits */
    char buf[];
};
```

`sdshdr16`・`sdshdr32`・`sdshdr64` は、`len` と `alloc` がそれぞれ 16・32・64 ビットになったものです。

## 前提知識

- **`struct`（構造体）**: 複数の値をひとまとめにした型です。`sdshdr8` は「長さ `len`」「確保した大きさ `alloc`」「種類 `flags`」を並べたものです。
- **`char buf[]`（フレキシブル配列メンバ）**: 構造体の最後に置く、大きさを決めない配列です。構造体のすぐ後ろに続くメモリを指し、ここに文字列の中身が入ります。
- **`sizeof(struct sdshdr8)`**: 構造体のバイト数です。`buf[]` は大きさ 0 として数えるので、`sdshdr8` は 1+1+1 = 3 バイト、`sdshdr16` は 5 バイト、`sdshdr32` は 9 バイト、`sdshdr64` は 17 バイトです。
- **`1 << 5`**: 1 を 5 ビット左にずらした値で、32 です。`1 << 8` は 256、`1 << 16` は 65536 です。`1ll << 32` の `ll` は「`long long` として計算する」という印で、32 ビットの `int` からはみ出さないようにしています。
- **`#if (LONG_MAX == LLONG_MAX)`**: `long` と `long long` が同じ大きさ（64 ビット環境）かどうかを、コンパイル前に判定します。
- **`size_t`**: メモリの大きさや長さを表す符号なし整数の型です。

## 何をしているか

### 1. 32 文字未満なら TYPE_5（57 行目）

`sdshdr5` には `len` がありません。`flags` の 1 バイトのうち、下位 3 ビットに種類、上位 5 ビットに長さを詰め込みます。5 ビットで表せるのは 0〜31 なので、`string_size < 32` が条件です。

### 2. TYPE_8 と TYPE_16（58〜59 行目）

`string_size <= 256 - 3 - 1`、つまり 252 以下なら `SDS_TYPE_8` です。引いている 3 はヘッダの大きさ、1 は終端の `'\0'` です。ヘッダと終端を含めた全体が 256 バイトに収まる長さまでを、このヘッダの担当にしています。
`SDS_TYPE_16` も同じ考え方で、`65536 - 5 - 1` = 65530 以下です。

### 3. 64 ビット環境と 32 ビット環境（60〜65 行目）

64 ビット環境では、約 42 億バイトまでが `SDS_TYPE_32`、それ以上が `SDS_TYPE_64` になります。
32 ビット環境では、そもそも 4GB を超えるメモリを 1 つの文字列に確保できないので、`SDS_TYPE_32` で十分です。`#else` 側でそれ以上の判定を省いています。

具体例です。

| 長さ | 種類 | ヘッダ |
| --- | --- | --- |
| 10 | TYPE_5 | 1 バイト |
| 100 | TYPE_8 | 3 バイト |
| 1000 | TYPE_16 | 5 バイト |
| 100000 | TYPE_32 | 9 バイト |

## ここがすごい

**ヘッダを長さに合わせる**: すべての文字列に 64 ビットの長さと容量を持たせると、ヘッダは 17 バイトになります。Valkey のようなデータベースでは、`"user:1001"` のような 10 文字前後のキーが何百万個もあるのがふつうです。10 文字の文字列に 17 バイトのヘッダを付けるのは大きな無駄ですが、この仕組みなら 1 バイトで済みます。

**`flags` は常に文字列の直前**: どのヘッダも最後の 1 バイトが `flags` で、そのすぐ後ろが `buf` です。だから文字列へのポインタ `s` から `s[-1]` を読めば、ヘッダの種類がわかります。種類がわかれば、ヘッダの先頭の位置も計算できます。可変長のヘッダを持ちながら、どれでも同じ方法で読み始められるのが、この設計の要です。

**型の大きさを計算で出す**: 252 や 65530 という数を直接書かず、`(1 << 8) - sizeof(struct sdshdr8) - 1` と書いています。ヘッダの定義が変わっても、この式は正しいままです。

**トレードオフ**: TYPE_5 には `alloc`（確保した大きさ）がないので、後ろに空き容量を持てません。そのため、追記されそうな空文字列は最初から TYPE_8 で作るなど、呼び出し側（同じファイルの `_sdsnewlen` の 96 行目など）で使い分けています。

## まとめ

- 長さを記録するフィールドの大きさを、文字列の長さに合わせて選ぶとメモリを節約できる。
- 種類を表すバイトをヘッダの最後（文字列の直前）に置けば、どの種類でも同じ方法で読める。
- 境界値は数字で書かず、`sizeof` を使った式で書くと定義の変更に強い。
- 32 ビット環境と 64 ビット環境の違いは `#if` で切り替える。
