---
title: "周回の番号を書いておいて、公開済みかを確かめる"
description: "LMAX Disruptor の MultiProducerSequencer。リングバッファの各スロットに「何周目に公開されたか」の番号を書き、その番号が一致するかで公開済みを判定する。フラグを消す手間を省く仕組み。"
language: java
project: LMAX Disruptor
repo: https://github.com/LMAX-Exchange/disruptor
license: Apache-2.0
copyright: "Copyright 2011 LMAX Ltd."
commit: "c871ca49826a6be7ada6957f6fbafcfecf7b1f87"
file: src/main/java/com/lmax/disruptor/MultiProducerSequencer.java
lines: [230, 273]
function: "MultiProducerSequencer.isAvailable"
difficulty: 3
format: 2
tags: [並行処理, ロック不要, データ構造]
---

## ひとことで

`MultiProducerSequencer` は、複数の生産者が同時にリングバッファへ書き込むときに、どの番号のスロットへの書き込みが終わっているかを管理します。`isAvailable(sequence)` は、その番号の要素が、消費者から読んでよい状態かどうかを返します。

複数の生産者が同時に書くと、番号の順と書き終わった順は一致しません。そのため、書き終わった番号を記録しておく仕組みが必要です。この関数は、その記録を確かめる部分です。

## コード

::: code-group

```java:line-numbers=230 [日本語訳]
    private void setAvailable(final long sequence)
    {
        setAvailableBufferValue(calculateIndex(sequence), calculateAvailabilityFlag(sequence));
    }

    private void setAvailableBufferValue(final int index, final int flag)
    {
        AVAILABLE_ARRAY.setRelease(availableBuffer, index, flag);
    }

    /**
     * Sequencer#isAvailable(long) を参照
     */
    @Override
    public boolean isAvailable(final long sequence)
    {
        int index = calculateIndex(sequence);
        int flag = calculateAvailabilityFlag(sequence);
        return (int) AVAILABLE_ARRAY.getAcquire(availableBuffer, index) == flag;
    }

    @Override
    public long getHighestPublishedSequence(final long lowerBound, final long availableSequence)
    {
        for (long sequence = lowerBound; sequence <= availableSequence; sequence++)
        {
            if (!isAvailable(sequence))
            {
                return sequence - 1;
            }
        }

        return availableSequence;
    }

    private int calculateAvailabilityFlag(final long sequence)
    {
        return (int) (sequence >>> indexShift);
    }

    private int calculateIndex(final long sequence)
    {
        return ((int) sequence) & indexMask;
    }
```

```java:line-numbers=230 [原文]
    private void setAvailable(final long sequence)
    {
        setAvailableBufferValue(calculateIndex(sequence), calculateAvailabilityFlag(sequence));
    }

    private void setAvailableBufferValue(final int index, final int flag)
    {
        AVAILABLE_ARRAY.setRelease(availableBuffer, index, flag);
    }

    /**
     * @see Sequencer#isAvailable(long)
     */
    @Override
    public boolean isAvailable(final long sequence)
    {
        int index = calculateIndex(sequence);
        int flag = calculateAvailabilityFlag(sequence);
        return (int) AVAILABLE_ARRAY.getAcquire(availableBuffer, index) == flag;
    }

    @Override
    public long getHighestPublishedSequence(final long lowerBound, final long availableSequence)
    {
        for (long sequence = lowerBound; sequence <= availableSequence; sequence++)
        {
            if (!isAvailable(sequence))
            {
                return sequence - 1;
            }
        }

        return availableSequence;
    }

    private int calculateAvailabilityFlag(final long sequence)
    {
        return (int) (sequence >>> indexShift);
    }

    private int calculateIndex(final long sequence)
    {
        return ((int) sequence) & indexMask;
    }
```

:::

## 前提知識

- **リングバッファ**: 配列を端から端まで円のようにつないで使う、固定の大きさの待ち行列です。
- **シーケンス番号**: 要素の通し番号です。`0, 1, 2, ...` と増えていき、配列の中の場所は番号を大きさで割った余りで決まります。
- **周回（lap）**: 番号が配列の大きさを一度超えるごとに、1 周したと数えます。
- **`>>>`（符号なし右シフト）**: 番号を大きさの 2 の累乗の桁数だけ右へずらすと、何周目かが分かります。
- **`getAcquire` と `setRelease`**: 書き込みと読み込みの順序を保証する、メモリの操作です。書いた値が、読む側から正しい順番で見えるようにします。

## 何をしているか

### 1. 書き込みのときに、場所と周回を記録する

```java:line-numbers=230
    private void setAvailable(final long sequence)
    {
        setAvailableBufferValue(calculateIndex(sequence), calculateAvailabilityFlag(sequence));
    }
```

番号 `sequence` が公開されたとき、その場所の番号 `index` と、周回の番号 `flag` を求めて、`availableBuffer` に書き込みます。書き込みは `setRelease` で行うので、要素の中身を書いた後に公開されます。

### 2. 場所と周回を求める

```java:line-numbers=265
    private int calculateAvailabilityFlag(final long sequence)
    {
        return (int) (sequence >>> indexShift);
    }

    private int calculateIndex(final long sequence)
    {
        return ((int) sequence) & indexMask;
    }
```

`calculateAvailabilityFlag` は、番号を `indexShift`（大きさの 2 の対数）だけ右へずらした値です。これが、何周目かを表します。`calculateIndex` は、大きさが 2 のべき乗なので、マスクで場所を求めます。

### 3. 読む側は周回が一致するかを見る

```java:line-numbers=244
    public boolean isAvailable(final long sequence)
    {
        int index = calculateIndex(sequence);
        int flag = calculateAvailabilityFlag(sequence);
        return (int) AVAILABLE_ARRAY.getAcquire(availableBuffer, index) == flag;
    }

```

`isAvailable` は、同じ場所の値を `getAcquire` で読み、今の番号の周回と一致すれば公開済みと判定します。一致しなければ、その場所はまだ前の周回の値か、まだ書かれていません。

## ここがすごい

- **リセットが要らない**: 消費者が読んだ後に、フラグを 0 に戻す必要がありません。周回の番号は毎周回で変わるので、古い値は自然に不一致になります。
- **2 のべき乗で周回が計算できる**: 大きさが 2 のべき乗なので、周回は右シフト、場所はマスクで求まります。割り算が要りません。
- **順序が保証される**: 公開には `setRelease`、確認には `getAcquire` を使います。要素の中身が、印を見た側から正しく見えることが約束されています。
- **待ちをしない**: 判定は一度読むだけで終わります。ロックや待ち行列は使わず、他の生産者が書き終わるまで消費者が待つかどうかは、呼び出し側が決めます。

## まとめ

- 各スロットに「何周目に公開されたか」の番号を書いておく。
- 番号の周回と一致すれば公開済み、一致しなければまだ。
- 周回の計算はシフトとマスクで行い、フラグのリセットは要らない。
