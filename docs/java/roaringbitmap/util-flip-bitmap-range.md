---
title: "ビットの範囲を反転し、端の語だけマスクで整える"
description: "RoaringBitmap の Util.flipBitmapRange。範囲の先頭と末尾の 64 ビット語にだけマスクを使い、間の語は NOT でまとめて反転する。先頭の語は全体を反転してから、範囲外のビットを戻す。"
language: java
project: RoaringBitmap
repo: https://github.com/RoaringBitmap/RoaringBitmap
license: Apache-2.0
copyright: "Copyright 2013-2016 the RoaringBitmap authors"
commit: "1add1bd95854f18346375bff46b3c57b3dfb467a"
file: roaringbitmap/src/main/java/org/roaringbitmap/Util.java
lines: [375, 386]
function: "Util.flipBitmapRange"
difficulty: 3
format: 2
tags: [ビット演算, データ構造, アルゴリズム]
---

## ひとことで

RoaringBitmap は、整数の集合を、`long` の配列（64 ビットずつの語）でビットとして持ちます。`flipBitmapRange` は、`start` 以上 `end` 未満のビットを、まとめて反転するメソッドです。

反転したい範囲が、語の途中から始まったり、途中で終わったりすることがあります。その端の語だけに、範囲のマスクを作って対処します。

## コード

```java:line-numbers=375
  public static void flipBitmapRange(long[] bitmap, int start, int end) {
    if (start == end) {
      return;
    }
    int firstword = start / 64;
    int endword = (end - 1) / 64;
    bitmap[firstword] ^= ~(~0L << start);
    for (int i = firstword; i < endword; i++) {
      bitmap[i] = ~bitmap[i];
    }
    bitmap[endword] ^= ~0L >>> -end;
  }
```

## 前提知識

- **語（word）**: `long` 1 つ、64 ビットです。ビットの番号 `i` は、語 `i / 64` の、`i % 64` の位置にあります。
- **`~0L << k`**: 下位 `k` ビットが 0、上の `64 - k` ビットが 1 の値です。`~` で反転すると、下位 `k` ビットだけが 1 になります。
- **`~0L >>> k`**: 上位 `k` ビットが 0、下の `64 - k` ビットが 1 の値です。
- **シフトの数の扱い**: Java の `long` のシフトは、数を 64 で割った余りだけ使います。`-end` の `>>>` は、`(64 - end % 64) % 64` ビットずらすことになります。

## 何をしているか

### 1. 先頭の語は、全体を反転してから、戻す

```java:line-numbers=381
    bitmap[firstword] ^= ~(~0L << start);
```

`firstword` は範囲の最初の語です。`~(~0L << start)` は、語の下位 `start % 64` ビットだけを 1 にしたマスクです。XOR すると、そのビットは反転されます。

この行は、先頭の語のうち範囲より前の部分を、元に戻すために使われます。範囲の先頭以降は、次の行の反転で、いったん全部反転されています。

### 2. 間の語は、まとめて NOT する

```java:line-numbers=382
    for (int i = firstword; i < endword; i++) {
      bitmap[i] = ~bitmap[i];
    }
```

`firstword` から `endword - 1` までの語は、範囲に完全に含まれます。`~` でまとめて反転します。

### 3. 末尾の語は、範囲の終わりまでだけ反転する

```java:line-numbers=385
    bitmap[endword] ^= ~0L >>> -end;
```

`~0L >>> -end` は、語の下位 `end % 64` ビットだけを 1 にしたマスクです。XOR すると、範囲の終わりより前のビットだけが反転します。`end % 64` が 0 のときは、語全体が 1 になり、語の全部が範囲に入ります。

範囲が 1 つの語の中で終わるときは、先頭の XOR と末尾の XOR が重なって、2 つのマスクの間のビットだけが反転します。

## ここがすごい

- **ビットを 1 つずつ触らない**: 語の単位で `~` と `^` を使うので、64 ビットを一度に扱えます。
- **端の処理を 2 回の XOR で**: 先頭の語は、全部反転してから範囲外を戻す形です。範囲の開始位置による場合分けを減らせます。
- **1 語の範囲も同じ式**: 範囲が 1 つの語で終わる場合も、2 つの XOR の組み合わせで正しくなります。特別な分岐を書く必要がありません。
- **シフトの 64 での剰余を利用**: `-end` や `start` をそのまま使い、シフトの数を 64 で割った余りに任せています。

## まとめ

- `flipBitmapRange` は、先頭と末尾の語にマスクで XOR し、間の語は `~` でまとめて反転する。
- 先頭の語は全体を反転してから、範囲より前のビットを XOR で戻す。
- 範囲が 1 つの語に収まる場合も、2 つのマスクの XOR で同じ式が使える。
