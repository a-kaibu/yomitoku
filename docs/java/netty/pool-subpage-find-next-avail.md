---
title: "64 ビットずつ空きの印を見て、最初の空きの番号を探す"
description: "Netty の PoolSubpage.findNextAvail と findNextAvail0。ビットマップの語を 64 ビットずつ調べ、0 のビットがある語の中で最も下の空きを探す。確保のたびに、番号を語の位置とビットの位置に分ける。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2012 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: buffer/src/main/java/io/netty/buffer/PoolSubpage.java
lines: [182, 206]
function: "PoolSubpage.findNextAvail"
difficulty: 2
format: 2
tags: [ビット演算, データ構造, 探索]
---

## ひとことで

Netty の `PoolSubpage` は、同じ大きさの小さなメモリ片を、まとめて管理するクラスです。どの片が使用中かは、ビットマップで表します。ビットが 1 なら使用中、0 なら空きです。

`findNextAvail` は、0 のビット（空き）を 1 つ探すメソッドです。ビットマップを 64 ビットずつ見て、空きがある語の中から、最も下の空きを選びます。

## コード

```java:line-numbers=182
    private int findNextAvail() {
        for (int i = 0; i < bitmapLength; i ++) {
            long bits = bitmap[i];
            if (~bits != 0) {
                return findNextAvail0(i, bits);
            }
        }
        return -1;
    }

    private int findNextAvail0(int i, long bits) {
        final int baseVal = i << 6;
        for (int j = 0; j < 64; j ++) {
            if ((bits & 1) == 0) {
                int val = baseVal | j;
                if (val < maxNumElems) {
                    return val;
                } else {
                    break;
                }
            }
            bits >>>= 1;
        }
        return -1;
    }
```

## 前提知識

- **ビットマップ**: 1 ビットで 1 つの対象の状態を表す配列です。ここでは、片が使用中（1）か空き（0）かを表します。
- **語（word）**: `long` 1 つ、64 ビットです。番号 `i` の片は、語 `i >>> 6`、ビット `i & 63` にあります。
- **`~bits != 0`**: 語を反転して 0 でなければ、元の語に 0 のビットがあるということです。つまり空きがあります。
- **最も下のビット**: 下の位（小さい番号）から順に調べるので、見つかった空きは、その語で最も小さい番号になります。

## 何をしているか

### 1. 空きのある語を探す

```java:line-numbers=182
    private int findNextAvail() {
        for (int i = 0; i < bitmapLength; i ++) {
            long bits = bitmap[i];
            if (~bits != 0) {
                return findNextAvail0(i, bits);
            }
        }
        return -1;
    }
```

`findNextAvail` は、ビットマップの語を先頭から順に見ます。`~bits != 0` となる語を見つけたら、その語の中で空きを探します。どの語にも空きがなければ `-1` を返します。

### 2. 語の中で、最も下の空きを探す

```java:line-numbers=192
    private int findNextAvail0(int i, long bits) {
        final int baseVal = i << 6;
        for (int j = 0; j < 64; j ++) {
            if ((bits & 1) == 0) {
                int val = baseVal | j;
                if (val < maxNumElems) {
                    return val;
                } else {
                    break;
                }
            }
            bits >>>= 1;
        }
        return -1;
    }
```

`baseVal = i << 6` は、その語の先頭の番号です。`bits` を 1 ビットずつ右へずらし、下のビットから見ていきます。最初に 0 のビットが見つかると、`baseVal | j` が片の番号です。

その番号が `maxNumElems` 以上なら、この小さなメモリ片は存在しないので、探索を止めて `-1` にします。最後の語の、使われない部分を選ばないための判定です。

### 3. 確保時に、語とビットの位置に分けて印を付ける

これは、この関数を呼ぶ `allocate` の中で行われます。番号を、`q = bitmapIdx >>> 6` と `r = bitmapIdx & 63` に分けて、`bitmap[q] |= 1L << r` でビットを 1 にします。

## ここがすごい

- **64 ビットずつ飛ばす**: 空きのある語を、語の単位で見つけるので、1 ビットずつ見るより速く探せます。空きがない語は 1 回の比較で飛ばせます。
- **番号と位置の換算が単純**: 番号を 6 ビット右にずらすと語の番号、下の 6 ビットを取ると語の中の位置になります。割り算を使いません。
- **番号の範囲を確かめる**: `val < maxNumElems` の判定で、最後の語の余りのビットを、存在しない片として扱います。
- **見つけた番号をすぐ使う**: 空きの番号が決まると、同じ関数の呼び出し側が、そのビットを 1 にして確保を完了します。

## まとめ

- `findNextAvail` は、空きのある 64 ビットの語を探し、その中で `findNextAvail0` が最も下の空きを選ぶ。
- 番号 `i` は、語 `i >>> 6`、ビット `i & 63` で表され、確保時に同じ位置のビットを 1 にする。
- 存在しない片を選ばないように、番号の上限で確かめる。
