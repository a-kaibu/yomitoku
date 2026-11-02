---
title: "末尾に入らないときは、詰め物を入れて先頭へ回す"
description: "Agrona の OneToOneRingBuffer.claimCapacity。1 対 1 のリングバッファで、メッセージを書く場所を確保する。残りの領域が足りないときは詰め物（パディング）を入れて、先頭に戻って書く。"
language: java
project: Agrona
repo: https://github.com/real-logic/agrona
license: Apache-2.0
copyright: "Copyright 2014-2025 Real Logic Limited."
commit: "4e576b8628ee8d5516c7352eae95720263b4dc59"
file: agrona/src/main/java/org/agrona/concurrent/ringbuffer/OneToOneRingBuffer.java
lines: [429, 506]
function: "OneToOneRingBuffer.claimCapacity"
difficulty: 3
format: 2
tags: [並行処理, データ構造, メモリ管理]
---

## ひとことで

`claimCapacity` は、リングバッファに、次のメッセージを書くための場所を確保します。リングバッファは、固定の大きさの配列を端から端まで円のように使う仕組みです。

メッセージは、配列の末尾に入りきるとは限りません。入らないときは、残りの末尾を「詰め物（パディング）」で埋めてから、先頭に戻って書きます。この関数は、その判断と、読む側の安全を守る手順を担当します。

## コード

::: code-group

```java:line-numbers=429 [日本語訳]
    private int claimCapacity(final AtomicBuffer buffer, final int recordLength)
    {
        final int alignedRecordLength = align(recordLength, ALIGNMENT);
        final int requiredCapacity = alignedRecordLength + HEADER_LENGTH;
        final int capacity = this.capacity;
        final int tailPositionIndex = this.tailPositionIndex;
        final int headCachePositionIndex = this.headCachePositionIndex;
        final int mask = capacity - 1;

        long head = buffer.getLong(headCachePositionIndex);
        final long tail = buffer.getLong(tailPositionIndex);
        final int availableCapacity = capacity - (int)(tail - head);

        if (requiredCapacity > availableCapacity)
        {
            head = buffer.getLongVolatile(headPositionIndex);

            if (requiredCapacity > (capacity - (int)(tail - head)))
            {
                return INSUFFICIENT_CAPACITY;
            }

            buffer.putLong(headCachePositionIndex, head);
        }

        int padding = 0;
        final int recordIndex = (int)tail & mask;
        final int toBufferEndLength = capacity - recordIndex;
        int writeIndex = recordIndex;
        long nextTail = tail + alignedRecordLength;

        if (alignedRecordLength == toBufferEndLength) // メッセージがちょうどバッファの末尾に収まる
        {
            buffer.putLongRelease(tailPositionIndex, nextTail);
            buffer.putLong(0, 0L); // 次のメッセージのヘッダを 0 にしておく
            return recordIndex;
        }
        else if (requiredCapacity > toBufferEndLength)
        {
            writeIndex = 0;
            int headIndex = (int)head & mask;

            if (requiredCapacity > headIndex)
            {
                head = buffer.getLongVolatile(headPositionIndex);
                headIndex = (int)head & mask;
                if (requiredCapacity > headIndex)
                {
                    writeIndex = INSUFFICIENT_CAPACITY;
                    nextTail = tail;
                }

                buffer.putLong(headCachePositionIndex, head);
            }

            padding = toBufferEndLength;
            nextTail += padding;
        }

        buffer.putLongRelease(tailPositionIndex, nextTail);

        if (0 != padding)
        {
            buffer.putLong(0, 0L);
            buffer.putIntRelease(lengthOffset(recordIndex), -padding);
            VarHandle.releaseFence();

            buffer.putInt(typeOffset(recordIndex), PADDING_MSG_TYPE_ID);
            buffer.putIntRelease(lengthOffset(recordIndex), padding);
        }

        if (INSUFFICIENT_CAPACITY != writeIndex)
        {
            buffer.putLong(writeIndex + alignedRecordLength, 0L); // 次のメッセージのヘッダを 0 にしておく
        }

        return writeIndex;
    }
```

```java:line-numbers=429 [原文]
    private int claimCapacity(final AtomicBuffer buffer, final int recordLength)
    {
        final int alignedRecordLength = align(recordLength, ALIGNMENT);
        final int requiredCapacity = alignedRecordLength + HEADER_LENGTH;
        final int capacity = this.capacity;
        final int tailPositionIndex = this.tailPositionIndex;
        final int headCachePositionIndex = this.headCachePositionIndex;
        final int mask = capacity - 1;

        long head = buffer.getLong(headCachePositionIndex);
        final long tail = buffer.getLong(tailPositionIndex);
        final int availableCapacity = capacity - (int)(tail - head);

        if (requiredCapacity > availableCapacity)
        {
            head = buffer.getLongVolatile(headPositionIndex);

            if (requiredCapacity > (capacity - (int)(tail - head)))
            {
                return INSUFFICIENT_CAPACITY;
            }

            buffer.putLong(headCachePositionIndex, head);
        }

        int padding = 0;
        final int recordIndex = (int)tail & mask;
        final int toBufferEndLength = capacity - recordIndex;
        int writeIndex = recordIndex;
        long nextTail = tail + alignedRecordLength;

        if (alignedRecordLength == toBufferEndLength) // message fits within the end of the buffer
        {
            buffer.putLongRelease(tailPositionIndex, nextTail);
            buffer.putLong(0, 0L); // pre-zero next message header
            return recordIndex;
        }
        else if (requiredCapacity > toBufferEndLength)
        {
            writeIndex = 0;
            int headIndex = (int)head & mask;

            if (requiredCapacity > headIndex)
            {
                head = buffer.getLongVolatile(headPositionIndex);
                headIndex = (int)head & mask;
                if (requiredCapacity > headIndex)
                {
                    writeIndex = INSUFFICIENT_CAPACITY;
                    nextTail = tail;
                }

                buffer.putLong(headCachePositionIndex, head);
            }

            padding = toBufferEndLength;
            nextTail += padding;
        }

        buffer.putLongRelease(tailPositionIndex, nextTail);

        if (0 != padding)
        {
            buffer.putLong(0, 0L);
            buffer.putIntRelease(lengthOffset(recordIndex), -padding);
            VarHandle.releaseFence();

            buffer.putInt(typeOffset(recordIndex), PADDING_MSG_TYPE_ID);
            buffer.putIntRelease(lengthOffset(recordIndex), padding);
        }

        if (INSUFFICIENT_CAPACITY != writeIndex)
        {
            buffer.putLong(writeIndex + alignedRecordLength, 0L); // pre-zero next message header
        }

        return writeIndex;
    }
```

:::

## 前提知識

- **head と tail**: 消費者が読んだ位置を `head`、生産者が書いた位置を `tail` とします。どちらも増え続ける番号で、配列の場所は番号を大きさで割った余りで決まります。
- **空き容量**: `capacity - (tail - head)` で、まだ読まれていない分を引いた残りが分かります。
- **2 のべき乗の大きさ**: `mask = capacity - 1` で、番号から場所を求めます。割り算が要りません。
- **詰め物（パディング）**: 末尾の余った部分を埋めるための、ダミーのメッセージです。読む側は、その種類を見て読み飛ばします。
- **`putLongRelease` と `getLongVolatile`**: 別のスレッドとの順序を保つ読み書きです。読む側が正しい値を見られるように、書き込みを公開します。

## 何をしているか

### 1. 空き容量を確かめる

```java:line-numbers=438
        long head = buffer.getLong(headCachePositionIndex);
        final long tail = buffer.getLong(tailPositionIndex);
        final int availableCapacity = capacity - (int)(tail - head);

        if (requiredCapacity > availableCapacity)
        {
            head = buffer.getLongVolatile(headPositionIndex);

            if (requiredCapacity > (capacity - (int)(tail - head)))
            {
                return INSUFFICIENT_CAPACITY;
            }

            buffer.putLong(headCachePositionIndex, head);
        }
```

まず、前回読んだ `head` のキャッシュで空き容量を計算します。足りなければ、`head` を読み直します。それでも足りなければ `INSUFFICIENT_CAPACITY` を返して、書けないことを知らせます。

### 2. 末尾にちょうど収まる場合

```java:line-numbers=454
        int padding = 0;
        final int recordIndex = (int)tail & mask;
        final int toBufferEndLength = capacity - recordIndex;
        int writeIndex = recordIndex;
        long nextTail = tail + alignedRecordLength;

        if (alignedRecordLength == toBufferEndLength) // メッセージがちょうどバッファの末尾に収まる
        {
            buffer.putLongRelease(tailPositionIndex, nextTail);
            buffer.putLong(0, 0L); // 次のメッセージのヘッダを 0 にしておく
            return recordIndex;
        }
```

`recordIndex` は、今の書き込み位置です。残りの末尾の長さとメッセージの長さがちょうど同じなら、`tail` を進めて、次のメッセージのヘッダを 0 にしておきます。そのまま書き込み位置を返します。

### 3. 末尾に入らない場合は先頭へ回す

```java:line-numbers=466
        else if (requiredCapacity > toBufferEndLength)
        {
            writeIndex = 0;
            int headIndex = (int)head & mask;

            if (requiredCapacity > headIndex)
            {
                head = buffer.getLongVolatile(headPositionIndex);
                headIndex = (int)head & mask;
                if (requiredCapacity > headIndex)
                {
                    writeIndex = INSUFFICIENT_CAPACITY;
                    nextTail = tail;
                }

                buffer.putLong(headCachePositionIndex, head);
            }

            padding = toBufferEndLength;
            nextTail += padding;
        }
```

メッセージが末尾に入らないときは、書き込み位置を 0 にします。先頭の空きが足りなければ `head` を読み直し、それでも足りなければ書けないと決めます。足りるなら、末尾の残りを `padding` として `nextTail` に加えます。

### 4. 詰め物を書いて、tail を進める

```java:line-numbers=487

        buffer.putLongRelease(tailPositionIndex, nextTail);

        if (0 != padding)
        {
            buffer.putLong(0, 0L);
            buffer.putIntRelease(lengthOffset(recordIndex), -padding);
            VarHandle.releaseFence();

            buffer.putInt(typeOffset(recordIndex), PADDING_MSG_TYPE_ID);
            buffer.putIntRelease(lengthOffset(recordIndex), padding);
        }

        if (INSUFFICIENT_CAPACITY != writeIndex)
        {
            buffer.putLong(writeIndex + alignedRecordLength, 0L); // 次のメッセージのヘッダを 0 にしておく
        }

        return writeIndex;
    }
```

`tail` を新しい位置へ公開します。詰め物があれば、その長さを負の値で書いてから、種類を書き、最後に正の長さに直します。この順番によって、読む側は書きかけのヘッダを見分けられます。

## ここがすごい

- **書けないときは何も変えない**: 空きが足りないときは、`tail` を動かさずに `INSUFFICIENT_CAPACITY` を返します。途中の状態を残さないので、やり直しが簡単です。
- **head のキャッシュ**: 毎回 `head` を読むと遅くなるので、前回の値を使い、足りなくなったときだけ読み直します。読む回数を減らす工夫です。
- **詰め物で配列の端を使い切る**: 末尾の半端な領域を捨てずに詰め物にすると、メッセージを先頭から連続して並べられます。どの位置からも、読み手は次のヘッダへ確実に進めます。
- **負の長さで書きかけを示す**: 書き込み中は長さを負にしておき、完成してから正に直します。読む側は、負の長さを見たら待つか、読まずに飛ばせます。

## まとめ

- 空きが足りるか、`head` のキャッシュと必要なら `head` の読み直しで確かめる。
- 末尾に入らないときは、残りを詰め物で埋めて先頭に回る。
- 書きかけのヘッダは負の長さで示し、完成してから正に直す。
