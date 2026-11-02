---
title: "バイト配列の比較を 8 バイトずつ行い、最初に違うバイトをビットで探す"
description: "Guava の UnsignedBytes.lexicographicalComparator の Unsafe 版 compare。8 バイトを long として比べ、違いがあれば xor の最も下位の 0 でないビットから、違うバイトを取り出す。"
language: java
project: Guava
repo: https://github.com/google/guava
license: Apache-2.0
copyright: "Copyright (C) 2009 The Guava Authors"
commit: "7cd44b3506796c329f450e053673b74bed9db108"
file: guava/src/com/google/common/primitives/UnsignedBytes.java
lines: [411, 452]
function: "UnsignedBytes.UnsafeComparator.compare"
difficulty: 3
format: 2
tags: [最適化, ビット演算, 文字列処理]
---

## ひとことで

`lexicographicalComparator()` は、バイト配列を辞書順に比べる `Comparator` を返します。バイトは符号なしとして比べます。

その中で、Unsafe を使う版の `compare` は、8 バイトを 1 つの `long` として読み、まとめて比べます。違いがあれば、その `long` の中から最初に違うバイトを、ビット演算で直接取り出します。

## コード

::: code-group

```java:line-numbers=411 [日本語訳]
      public int compare(byte[] left, byte[] right) {
        //         // theUnsafe が使えなければ、この実装は選ばれないはず。
        Unsafe theUnsafe = requireNonNull(UnsafeComparator.theUnsafe);

        int stride = 8;
        int minLength = Math.min(left.length, right.length);
        int strideLimit = minLength & ~(stride - 1);
        int i;

        /*
         *          * x86 での計測では、8 バイトの幅は、32 ビットでも 4 バイトより遅くはない。
         *          * 一方で、64 ビットでは大幅に速い。
         */
        for (i = 0; i < strideLimit; i += stride) {
          long lw = theUnsafe.getLong(left, BYTE_ARRAY_BASE_OFFSET + (long) i);
          long rw = theUnsafe.getLong(right, BYTE_ARRAY_BASE_OFFSET + (long) i);
          if (lw != rw) {
            if (BIG_ENDIAN) {
              return Long.compareUnsigned(lw, rw);
            }

            /*             /*
             *              * 比べたいのは、left[index] と right[index] が最初に違う位置だけ。
             *              * これは lw ^ rw の、最も下位の 0 でないバイトに当たる（lw と rw はリトルエンディアン）。
             *              * Long.numberOfTrailingZeros(diff) で、最も下位の 0 でないビットが分かる。
             *              * その下 3 ビットを 0 にした nTZ が、そのバイトへのずらし量になる。
             *              * つまり、そのバイトを取り出せる。
             *              */
            int n = Long.numberOfTrailingZeros(lw ^ rw) & ~0x7;
            return ((int) ((lw >>> n) & UNSIGNED_MASK)) - ((int) ((rw >>> n) & UNSIGNED_MASK));
          }
        }

        //         // 最後の（minLength % 8）個の要素を処理する後始末。
        for (; i < minLength; i++) {
          int result = UnsignedBytes.compare(left[i], right[i]);
          if (result != 0) {
            return result;
          }
        }
        return left.length - right.length;
      }
```

```java:line-numbers=411 [原文]
      public int compare(byte[] left, byte[] right) {
        // If theUnsafe weren't available, we wouldn't have selected this Comparator implementation.
        Unsafe theUnsafe = requireNonNull(UnsafeComparator.theUnsafe);

        int stride = 8;
        int minLength = Math.min(left.length, right.length);
        int strideLimit = minLength & ~(stride - 1);
        int i;

        /*
         * Compare 8 bytes at a time. Benchmarking on x86 shows a stride of 8 bytes is no slower
         * than 4 bytes even on 32-bit. On the other hand, it is substantially faster on 64-bit.
         */
        for (i = 0; i < strideLimit; i += stride) {
          long lw = theUnsafe.getLong(left, BYTE_ARRAY_BASE_OFFSET + (long) i);
          long rw = theUnsafe.getLong(right, BYTE_ARRAY_BASE_OFFSET + (long) i);
          if (lw != rw) {
            if (BIG_ENDIAN) {
              return Long.compareUnsigned(lw, rw);
            }

            /*
             * We want to compare only the first index where left[index] != right[index]. This
             * corresponds to the least significant nonzero byte in lw ^ rw, since lw and rw are
             * little-endian. Long.numberOfTrailingZeros(diff) tells us the least significant
             * nonzero bit, and zeroing out the first three bits of L.nTZ gives us the shift to get
             * that least significant nonzero byte.
             */
            int n = Long.numberOfTrailingZeros(lw ^ rw) & ~0x7;
            return ((int) ((lw >>> n) & UNSIGNED_MASK)) - ((int) ((rw >>> n) & UNSIGNED_MASK));
          }
        }

        // The epilogue to cover the last (minLength % stride) elements.
        for (; i < minLength; i++) {
          int result = UnsignedBytes.compare(left[i], right[i]);
          if (result != 0) {
            return result;
          }
        }
        return left.length - right.length;
      }
```

:::

## 前提知識

- **辞書順**: 先頭から順に比べて、最初に違う位置の大小で決まる順番です。
- **符号なしのバイト**: Java の `byte` は符号付きですが、ここでは `0xFF` で打ち消して、0 から 255 の値として比べます。
- **リトルエンディアンとビッグエンディアン**: 複数バイトの整数で、下位のバイトを先に置くか（リトルエンディアン）、上位を先に置くか（ビッグエンディアン）の並び方です。
- **`Long.numberOfTrailingZeros`**: 最も下位の 1 までの 0 の個数です。XOR の結果に使うと、最初に違うビットの位置が分かります。

## 何をしているか

### 1. 8 バイトずつ、`long` として比べる

```java:line-numbers=415
        int stride = 8;
        int minLength = Math.min(left.length, right.length);
        int strideLimit = minLength & ~(stride - 1);
```

```java:line-numbers=424
        for (i = 0; i < strideLimit; i += stride) {
          long lw = theUnsafe.getLong(left, BYTE_ARRAY_BASE_OFFSET + (long) i);
          long rw = theUnsafe.getLong(right, BYTE_ARRAY_BASE_OFFSET + (long) i);
          if (lw != rw) {
```

`strideLimit` は、短いほうの長さを 8 の倍数に切り下げた値です。その範囲では、`getLong` で 8 バイトを読み、`lw != rw` なら違いがあります。

### 2. ビッグエンディアンなら、そのまま比べる

```java:line-numbers=428
            if (BIG_ENDIAN) {
              return Long.compareUnsigned(lw, rw);
            }
```

ビッグエンディアンの環境では、`long` の大小が、バイト列の辞書順と一致します。そのため `Long.compareUnsigned(lw, rw)` 1 回で結果が決まります。

### 3. リトルエンディアンなら、違うバイトの位置を求める

```java:line-numbers=439
            int n = Long.numberOfTrailingZeros(lw ^ rw) & ~0x7;
            return ((int) ((lw >>> n) & UNSIGNED_MASK)) - ((int) ((rw >>> n) & UNSIGNED_MASK));
```

リトルエンディアンでは、最も下位のバイトが、配列の先頭に当たります。そのため、`lw ^ rw` の最も下位の 0 でない位置を探し、その位置を 8 の倍数（バイトの単位）に切り下げた `n` を求めます。`(lw >>> n) & 0xFF` と `(rw >>> n) & 0xFF` で、その 1 バイトを取り出し、差を返します。

### 4. 端数は 1 バイトずつ比べる

```java:line-numbers=445
        for (; i < minLength; i++) {
          int result = UnsignedBytes.compare(left[i], right[i]);
          if (result != 0) {
            return result;
          }
        }
        return left.length - right.length;
```

8 の倍数に満たない残りは、1 バイトずつ `UnsignedBytes.compare` で比べます。すべて同じなら、長さの差を返します。

## ここがすごい

- **8 倍の幅で比べる**: 8 バイトを 1 回の読み取りで比べるので、長い配列ほど速くなります。
- **違うバイトを直接取り出す**: 違いが見つかったあとに、もう一度バイト単位で探し直す必要がありません。`numberOfTrailingZeros` の 1 命令で位置が決まります。
- **エンディアンで分ける**: 並び方によって、最初に比べるべき位置が変わるので、`BIG_ENDIAN` の定数で分岐しています。ビッグエンディアンでは、`long` の比較そのものが辞書順に一致します。
- **比べる値を符号なしにする**: `UNSIGNED_MASK`（`0xFF`）で、負の `byte` を 128 から 255 の値として扱います。

## まとめ

- Unsafe 版の `compare` は、8 バイトずつ `long` として比べ、違いがあれば最初に違うバイトを取り出す。
- リトルエンディアンでは、XOR の最も下位の 0 でないビットから、そのバイトの位置を求める。
- 端数は 1 バイトずつ比べ、すべて同じなら長さの差を返す。
