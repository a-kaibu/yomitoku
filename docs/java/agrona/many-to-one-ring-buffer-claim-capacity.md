---
title: "複数の書き手が、末尾に入らない記録を埋め草で飛ばして場所を取る"
description: "Agrona の ManyToOneRingBuffer.claimCapacity。複数の生産者が末尾の位置を CAS で取り合う。記録がバッファの末尾に収まらないとき、残りを埋め草にして先頭へ回す。"
language: java
project: Agrona
repo: https://github.com/real-logic/agrona
license: Apache-2.0
copyright: "Copyright 2014-2025 Real Logic Limited."
commit: "4e576b8628ee8d5516c7352eae95720263b4dc59"
file: agrona/src/main/java/org/agrona/concurrent/ringbuffer/ManyToOneRingBuffer.java
lines: [493, 553]
function: "ManyToOneRingBuffer.claimCapacity"
difficulty: 3
format: 2
tags: [並行処理, データ構造, アルゴリズム]
---

## ひとことで

Agrona の `ManyToOneRingBuffer` は、複数の書き手（生産者）が 1 つの読み手（消費者）へ、記録を送るリングバッファです。書き手は、先に「書く場所」を確保してから、その場所に記録を書きます。

`claimCapacity` は、その確保を行うメソッドです。確保する領域は、書き手が取り合うので、末尾の位置（tail）を CAS で進めます。

## コード

::: code-group

```java:line-numbers=493 [日本語訳]
    private int claimCapacity(final AtomicBuffer buffer, final int recordLength)
    {
        final int requiredCapacity = align(recordLength, ALIGNMENT);
        final int capacity = this.capacity;
        final int tailPositionIndex = this.tailPositionIndex;
        final int headCachePositionIndex = this.headCachePositionIndex;
        final int mask = capacity - 1;

        long head = buffer.getLongVolatile(headCachePositionIndex);

        long tail;
        long newTail;
        int tailIndex;
        int padding;
        int writeIndex;
        do
        {
            tail = buffer.getLongVolatile(tailPositionIndex);
            final int availableCapacity = capacity - (int)(tail - head);

            if (requiredCapacity > availableCapacity)
            {
                head = buffer.getLongVolatile(headPositionIndex);

                if (requiredCapacity > (capacity - (int)(tail - head)))
                {
                    return INSUFFICIENT_CAPACITY;
                }

                buffer.putLongRelease(headCachePositionIndex, head);
            }
            newTail = tail + requiredCapacity;

            padding = 0;
            tailIndex = (int)tail & mask;
            writeIndex = tailIndex;
            final int toBufferEndLength = capacity - tailIndex;

            if (requiredCapacity > toBufferEndLength)
            {
                int headIndex = (int)head & mask;
                writeIndex = 0;

                if (requiredCapacity > headIndex)
                {
                    head = buffer.getLongVolatile(headPositionIndex);
                    headIndex = (int)head & mask;
                    if (requiredCapacity > headIndex)
                    {
                        writeIndex = INSUFFICIENT_CAPACITY;
                        newTail = tail; //                         newTail = tail; // 実際の領域は確保せず、バッファの末尾までの埋め草だけを書く
                    }

                    buffer.putLongRelease(headCachePositionIndex, head);
                }

                padding = toBufferEndLength;
                newTail += padding;
            }
        }
        while (!buffer.compareAndSetLong(tailPositionIndex, tail, newTail));
```

```java:line-numbers=493 [原文]
    private int claimCapacity(final AtomicBuffer buffer, final int recordLength)
    {
        final int requiredCapacity = align(recordLength, ALIGNMENT);
        final int capacity = this.capacity;
        final int tailPositionIndex = this.tailPositionIndex;
        final int headCachePositionIndex = this.headCachePositionIndex;
        final int mask = capacity - 1;

        long head = buffer.getLongVolatile(headCachePositionIndex);

        long tail;
        long newTail;
        int tailIndex;
        int padding;
        int writeIndex;
        do
        {
            tail = buffer.getLongVolatile(tailPositionIndex);
            final int availableCapacity = capacity - (int)(tail - head);

            if (requiredCapacity > availableCapacity)
            {
                head = buffer.getLongVolatile(headPositionIndex);

                if (requiredCapacity > (capacity - (int)(tail - head)))
                {
                    return INSUFFICIENT_CAPACITY;
                }

                buffer.putLongRelease(headCachePositionIndex, head);
            }
            newTail = tail + requiredCapacity;

            padding = 0;
            tailIndex = (int)tail & mask;
            writeIndex = tailIndex;
            final int toBufferEndLength = capacity - tailIndex;

            if (requiredCapacity > toBufferEndLength)
            {
                int headIndex = (int)head & mask;
                writeIndex = 0;

                if (requiredCapacity > headIndex)
                {
                    head = buffer.getLongVolatile(headPositionIndex);
                    headIndex = (int)head & mask;
                    if (requiredCapacity > headIndex)
                    {
                        writeIndex = INSUFFICIENT_CAPACITY;
                        newTail = tail; // Do not claim any actual space, only pad to the buffer end
                    }

                    buffer.putLongRelease(headCachePositionIndex, head);
                }

                padding = toBufferEndLength;
                newTail += padding;
            }
        }
        while (!buffer.compareAndSetLong(tailPositionIndex, tail, newTail));
```

:::

## 前提知識

- **リングバッファ**: 固定長の配列を、末尾の次に先頭へ戻って使う仕組みです。`tail` は書く位置、`head` は読んだ位置です。
- **埋め草（padding）**: 記録の途中で配列の末尾に達すると、残りを無効な記録として埋めます。読み手は、その記録を読み飛ばして、先頭へ進みます。
- **`align(recordLength, ALIGNMENT)`**: 記録の長さを、決まった単位の倍数に切り上げます。
- **`mask`**: `capacity - 1` で、位置を配列の範囲に収めます。容量は 2 の累乗です。

## 何をしているか

### 1. 空きがあるか確かめる

```java:line-numbers=510
            tail = buffer.getLongVolatile(tailPositionIndex);
            final int availableCapacity = capacity - (int)(tail - head);

            if (requiredCapacity > availableCapacity)
            {
                head = buffer.getLongVolatile(headPositionIndex);

                if (requiredCapacity > (capacity - (int)(tail - head)))
                {
                    return INSUFFICIENT_CAPACITY;
```

`availableCapacity` は、`tail` と `head` の差から求めた空きです。足りなければ、読み手の `head` を読み直し、それでも足りなければ `INSUFFICIENT_CAPACITY` を返します。読み直した `head` は、`headCachePositionIndex` にキャッシュします。

### 2. 末尾に収まらなければ、先頭に書く

```java:line-numbers=527
            tailIndex = (int)tail & mask;
            writeIndex = tailIndex;
            final int toBufferEndLength = capacity - tailIndex;

            if (requiredCapacity > toBufferEndLength)
            {
                int headIndex = (int)head & mask;
                writeIndex = 0;
```

`toBufferEndLength` は、`tail` の位置から配列の末尾までの長さです。記録がそれより長ければ、末尾に収まりません。そのときは、書く位置を先頭（0）にし、末尾の残りを埋め草として含めます。先頭側にも空きが足りなければ、`head` を読み直します。

### 3. CAS で `tail` を進める

```java:line-numbers=543
                        newTail = tail; //                         newTail = tail; // 実際の領域は確保せず、バッファの末尾までの埋め草だけを書く
```

`newTail` は、確保後の `tail` です。埋め草を含めて進めます。空きが足りなければ、実際の領域は確保せず、埋め草だけを書きます。

```java:line-numbers=549
                padding = toBufferEndLength;
                newTail += padding;
            }
        }
        while (!buffer.compareAndSetLong(tailPositionIndex, tail, newTail));
```

`compareAndSetLong` が失敗したら、ほかの書き手が `tail` を変えたので、最初からやり直します。成功したときだけ、この確保が有効になります。

## ここがすごい

- **書き手同士が待ち合わない**: 場所の確保は CAS 1 回の競合で済みます。ロックを使わず、失敗したら読み直すだけです。
- **読み手の位置をキャッシュ**: `head` を読み直す回数を減らすため、前回の値を `headCachePositionIndex` に保存します。読み手の値を揮発性で読む費用を抑えます。
- **末尾で止まらない**: 記録を末尾で切らずに、埋め草で末尾まで埋めてから先頭へ回すので、記録は連続した領域に収まります。
- **埋め草は負の長さで書かれる**: 確保のあと、埋め草があれば、その位置に長さ `-padding` と `PADDING_MSG_TYPE_ID` を書きます。読み手は、その型と負の長さを見て、埋め草を読み飛ばせます。

## まとめ

- `claimCapacity` は、`tail` の CAS で書く領域を確保する。収まらない記録は、末尾の埋め草を含めて先頭へ回す。
- 空きが足りなければ `head` を読み直し、それでも足りなければ `INSUFFICIENT_CAPACITY` を返す。
- 読み手の位置をキャッシュし、CAS が失敗したら最初からやり直す。
