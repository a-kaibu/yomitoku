---
title: "読み込み用の 64 ビットバッファから、必要なビット数だけ取り出す"
description: "Netty の Bzip2BitReader.readBits。足りないときだけバイトを補充し、必要なビット数だけを下の位置へ移してマスクで切り出す。上に残った古いビットは、マスクで捨てられる。"
language: java
project: Netty
repo: https://github.com/netty/netty
license: Apache-2.0
copyright: "Copyright 2014 The Netty Project"
commit: "68cc1971010e1913f1d17f6e1d2c164ae54e62cc"
file: codec-compression/src/main/java/io/netty/handler/codec/compression/Bzip2BitReader.java
lines: [58, 98]
function: "Bzip2BitReader.readBits"
difficulty: 3
format: 2
tags: [ビット演算, データ構造, 低レイヤ]
---

## ひとことで

bzip2 の圧縮データは、1 ビット単位で並んでいます。そのため、読み込みも、1 バイトや 4 バイトの単位ではなく、必要なビットの数だけ取り出す必要があります。

`Bzip2BitReader.readBits` は、読み込み用の 64 ビットの変数（`bitBuffer`）に、ビットを溜めておきます。必要なビット数が足りないときだけ、`ByteBuf` からバイトを補充します。そのあと、要求されたビット数だけを切り出して返します。

## コード

```java:line-numbers=58
    int readBits(final int count) {
        if (count < 0 || count > 32) {
            throw new IllegalArgumentException("count: " + count + " (expected: 0-32 )");
        }
        int bitCount = this.bitCount;
        long bitBuffer = this.bitBuffer;

        if (bitCount < count) {
            long readData;
            int offset;
            switch (in.readableBytes()) {
                case 1: {
                    readData = in.readUnsignedByte();
                    offset = 8;
                    break;
                }
                case 2: {
                    readData = in.readUnsignedShort();
                    offset = 16;
                    break;
                }
                case 3: {
                    readData = in.readUnsignedMedium();
                    offset = 24;
                    break;
                }
                default: {
                    readData = in.readUnsignedInt();
                    offset = 32;
                    break;
                }
            }

            bitBuffer = bitBuffer << offset | readData;
            bitCount += offset;
            this.bitBuffer = bitBuffer;
        }

        this.bitCount = bitCount -= count;
        return (int) (bitBuffer >>> bitCount & (count != 32 ? (1 << count) - 1 : 0xFFFFFFFFL));
    }
```

## 前提知識

- **`bitBuffer` と `bitCount`**: `bitBuffer` に、まだ読んでいないビットが溜まっています。`bitCount` は、その中で読めるビットの数です。読めるビットは、下の位置に詰まっています。
- **マスク**: 必要なビットだけを残すための数です。`(1 << count) - 1` は、下位 `count` ビットが 1 の値です。
- **`count == 32` の特別扱い**: `1 << 32` は、Java の `int` では 1 として働きます。そのため、32 ビットのときは、マスクを `0xFFFFFFFFL` にしています。
- **`readUnsignedByte` など**: `ByteBuf` から、符号なしの値として 1 バイト、2 バイト、3 バイト、4 バイトを読みます。

## 何をしているか

### 1. 足りなければ、バイトを補充する

```java:line-numbers=65
        if (bitCount < count) {
```

`bitCount` が、要求されたビット数（`count`）より少ないときだけ、補充します。補充の量は、`ByteBuf` に残っているバイト数で決めます。

```java:line-numbers=91
            bitBuffer = bitBuffer << offset | readData;
            bitCount += offset;
            this.bitBuffer = bitBuffer;
```

補充したバイトを、`bitBuffer` の下へ `<< offset` で追加します。`bitCount` は、追加したビット数の分だけ増えます。

### 2. 必要なビットを切り出す

```java:line-numbers=96
        this.bitCount = bitCount -= count;
        return (int) (bitBuffer >>> bitCount & (count != 32 ? (1 << count) - 1 : 0xFFFFFFFFL));
```

`bitCount -= count` で、読んだ分を読めるビットから減らします。そのあと、`bitBuffer >>> bitCount` で、切り出すビットを一番下へ移します。`& mask` で、必要な `count` ビットだけを残して返します。

## ここがすごい

- **補充は必要なときだけ**: 十分なビットがあれば、`ByteBuf` には触りません。バイトの読み込みは、必要なときに 1 回だけです。
- **上の古いビットを気にしない**: 補充で `bitBuffer` を左へずらすと、上の方に読み終わったビットが残ることがあります。切り出すときのマスクで、それらを捨てています。
- **0 ビットの読み込みも安全**: `count` が 0 のとき、マスクは `(1 << 0) - 1 = 0` になり、結果は 0 です。
- **書く側の対になる**: 前の記事の `Bzip2BitWriter.writeBits` は、上から詰めて、32 ビット単位で書き出します。この `readBits` は、下から取り出して、必要な分だけ切り出します。

## まとめ

- `readBits` は、読めるビットが足りないときだけ `ByteBuf` からバイトを補充する。
- 読んだ分を `bitCount` から減らし、`bitBuffer >>> bitCount` と `mask` で必要なビットを切り出す。
- マスクがあるので、上に残った古いビットや、32 ビットの特別な扱いも、正しく処理される。
