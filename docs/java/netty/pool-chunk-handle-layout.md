---
title: "1 つの long に、位置・大きさ・使用中の印を詰める"
description: "Netty の PoolChunk のハンドル。1 つの long の上の方に、ページの位置と大きさ、使用中と小片かの印を入れ、下の 32 ビットに小片の番号を入れる。取り出しは、シフトとマスクだけで行う。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2012 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: buffer/src/main/java/io/netty/buffer/PoolChunk.java
lines: [697, 724]
function: "PoolChunk.runOffset"
difficulty: 3
format: 2
tags: [ビット演算, データ構造, 低レイヤ]
---

## ひとことで

Netty の `PoolChunk` は、大きなメモリの塊（チャンク）を、ページ単位で割り当てます。割り当てた領域を後で返すには、その位置と大きさが必要です。

そこで、それらを 1 つの `long` の値（ハンドル）に詰めて持ちます。ハンドルは、オブジェクトを作らずに、値として受け渡せます。

## コード

```java:line-numbers=697
    static int runOffset(long handle) {
        return (int) (handle >> RUN_OFFSET_SHIFT);
    }

    static int runSize(int pageShifts, long handle) {
        return runPages(handle) << pageShifts;
    }

    static int runPages(long handle) {
        return (int) (handle >> SIZE_SHIFT & 0x7fff);
    }

    static boolean isUsed(long handle) {
        return (handle >> IS_USED_SHIFT & 1) == 1L;
    }

    static boolean isRun(long handle) {
        return !isSubpage(handle);
    }

    static boolean isSubpage(long handle) {
        return (handle >> IS_SUBPAGE_SHIFT & 1) == 1L;
    }

    static int bitmapIdx(long handle) {
        return (int) handle;
    }

```

## 前提知識

- **ハンドル（handle）**: 割り当てた領域を指す値です。返却のときに、この値から位置と大きさを取り出します。
- **ビットフィールド**: 1 つの整数の中を、欄に分けて使う方法です。欄ごとに、ビットの幅と位置が決まっています。
- **算術右シフト（`>>`）とマスク（`& 0x7fff`）**: 上の欄を右へずらして取り出し、必要な幅だけをマスクで残します。
- **ページ**: チャンクを分ける単位です。ハンドルの「大きさ」は、ページの数で表します。

## 何をしているか

### 1. 欄の位置を決める

```java:line-numbers=139
    private static final int SIZE_BIT_LENGTH = 15;
    private static final int INUSED_BIT_LENGTH = 1;
    private static final int SUBPAGE_BIT_LENGTH = 1;
    private static final int BITMAP_IDX_BIT_LENGTH = 32;
```

ページの数は 15 ビット、使用中の印と小片の印は 1 ビットずつ、小片の番号は 32 ビットです。`IS_SUBPAGE_SHIFT`（32）から始めて、それぞれの欄の位置を、幅の和で決めています。

```java:line-numbers=147
    static final int IS_SUBPAGE_SHIFT = BITMAP_IDX_BIT_LENGTH;
    static final int IS_USED_SHIFT = SUBPAGE_BIT_LENGTH + IS_SUBPAGE_SHIFT;
    static final int SIZE_SHIFT = INUSED_BIT_LENGTH + IS_USED_SHIFT;
    static final int RUN_OFFSET_SHIFT = SIZE_BIT_LENGTH + SIZE_SHIFT;
```

結果として、下位の 32 ビットが小片の番号、そのすぐ上が小片かどうかの印（32）、次が使用中の印（33）、次が大きさ（34 から 48）、最上位の欄が位置（49 から 63）になります。

### 2. 欄を取り出す

```java:line-numbers=697
    static int runOffset(long handle) {
        return (int) (handle >> RUN_OFFSET_SHIFT);
    }
```

位置は、`handle >> RUN_OFFSET_SHIFT` で、上の欄だけを残します。

```java:line-numbers=705
    static int runPages(long handle) {
        return (int) (handle >> SIZE_SHIFT & 0x7fff);
    }
```

大きさは、`handle >> SIZE_SHIFT` で大きさの欄を下へ寄せ、`& 0x7fff` で 15 ビットだけを残します。

```java:line-numbers=709
    static boolean isUsed(long handle) {
        return (handle >> IS_USED_SHIFT & 1) == 1L;
    }
```

使用中かどうか、小片かどうか、小片の番号は、それぞれ 1 ビットを取り出すか、下の 32 ビットをそのまま使います。

## ここがすごい

- **オブジェクトを作らない**: 位置、大きさ、状態を 1 つの `long` に収めるので、割り当てのたびに小さなオブジェクトを作る必要がありません。
- **取り出しが 1 命令**: 各欄は、シフトとマスクの 1 回ずつで取り出せます。読み出しが速く、呼び出しごとの費用が小さくなります。
- **欄の位置を式で表す**: `SIZE_SHIFT = INUSED_BIT_LENGTH + IS_USED_SHIFT` のように、幅から位置を計算しています。欄の幅を変えても、位置の式がずれにくい作りです。
- **小片の番号を下に置く**: 小片の番号は、`(int) handle` で取れるように、下の 32 ビットに置いています。キャストだけで済みます。

## まとめ

- ハンドルは、下の 32 ビットに小片の番号、その上に小片と使用中の印、次に 15 ビットの大きさ、最上位に 15 ビットの位置を持つ。
- 各欄は、シフトとマスクで取り出す。位置は `>> 49`、大きさは `>> 34` と `& 0x7fff`。
- 割り当ての情報を、オブジェクトを作らずに 1 つの `long` で受け渡す。
