---
title: "複数の生産者が、番号を一度に取って空きを待つ"
description: "LMAX Disruptor の MultiProducerSequencer.next(int)。カーソルを getAndAdd で n 増やして枠を確保し、一番遅い消費者の位置を見て、枠が空くまで待つ。CAS の繰り返しを使わない。"
language: java
project: LMAX Disruptor
repo: https://github.com/LMAX-Exchange/disruptor
license: Apache-2.0
copyright: "Copyright 2011 LMAX Ltd."
commit: "c871ca49826a6be7ada6957f6fbafcfecf7b1f87"
file: src/main/java/com/lmax/disruptor/MultiProducerSequencer.java
lines: [112, 137]
function: "MultiProducerSequencer.next"
difficulty: 3
format: 2
tags: [並行処理, データ構造, アルゴリズム]
---

## ひとことで

Disruptor は、固定長のリングバッファに、生産者が要素を書き、消費者が読む仕組みです。複数の生産者が同時に書くときは、まず書く位置（シーケンス）を確保してから、その枠に書きます。

`MultiProducerSequencer.next(int n)` は、`n` 個分の枠を確保して、最後の番号を返すメソッドです。枠が消費者にまだ読まれていなければ、空くまで待ちます。

## コード

::: code-group

```java:line-numbers=112 [日本語訳]
    public long next(final int n)
    {
        if (n < 1 || n > bufferSize)
        {
            throw new IllegalArgumentException("n must be > 0 and < bufferSize");
        }

        long current = cursor.getAndAdd(n);

        long nextSequence = current + n;
        long wrapPoint = nextSequence - bufferSize;
        long cachedGatingSequence = gatingSequenceCache.get();

        if (wrapPoint > cachedGatingSequence || cachedGatingSequence > current)
        {
            long gatingSequence;
            while (wrapPoint > (gatingSequence = Util.getMinimumSequence(gatingSequences, current)))
            {
                LockSupport.parkNanos(1L); //                 LockSupport.parkNanos(1L); // TODO: 待ち方を、待機戦略（wait strategy）に合わせるべきか
            }

            gatingSequenceCache.set(gatingSequence);
        }

        return nextSequence;
    }
```

```java:line-numbers=112 [原文]
    public long next(final int n)
    {
        if (n < 1 || n > bufferSize)
        {
            throw new IllegalArgumentException("n must be > 0 and < bufferSize");
        }

        long current = cursor.getAndAdd(n);

        long nextSequence = current + n;
        long wrapPoint = nextSequence - bufferSize;
        long cachedGatingSequence = gatingSequenceCache.get();

        if (wrapPoint > cachedGatingSequence || cachedGatingSequence > current)
        {
            long gatingSequence;
            while (wrapPoint > (gatingSequence = Util.getMinimumSequence(gatingSequences, current)))
            {
                LockSupport.parkNanos(1L); // TODO, should we spin based on the wait strategy?
            }

            gatingSequenceCache.set(gatingSequence);
        }

        return nextSequence;
    }
```

:::

## 前提知識

- **カーソル（cursor）**: 確保済みの、最後の番号を表す値です。`getAndAdd` で増やします。
- **`getAndAdd`**: 値を増やして、増やす前の値を返す 1 回の操作です。CAS の繰り返しと違い、競合しても失敗して戻る必要がありません。
- **ゲーティングシーケンス（gating sequence）**: 消費者がどこまで読んだかを表す番号です。一番遅い消費者の位置が、書いてよい上限になります。
- **ラップポイント（wrap point）**: 確保しようとした枠が、リングを一周して、まだ読まれていない古い要素と重なる位置です。

## 何をしているか

### 1. カーソルを増やして、枠を確保する

```java:line-numbers=119
        long current = cursor.getAndAdd(n);
```

`cursor.getAndAdd(n)` で、`n` 個分の番号を 1 回の操作で確保します。`current` は確保前の値で、`nextSequence = current + n` が確保後の最後の番号です。

### 2. 一周の重なりを確かめる

```java:line-numbers=121
        long nextSequence = current + n;
        long wrapPoint = nextSequence - bufferSize;
        long cachedGatingSequence = gatingSequenceCache.get();

        if (wrapPoint > cachedGatingSequence || cachedGatingSequence > current)
```

`wrapPoint = nextSequence - bufferSize` は、この確保によって、リングの同じ位置に戻る番号です。その枠の古い要素を、消費者がすでに読んでいれば、書けます。

`gatingSequenceCache` は、前回までに知った消費者の位置です。キャッシュがまだ十分なら、消費者の位置を読み直さずに済みます。

### 3. 消費者が追いつくまで待つ

```java:line-numbers=127
            long gatingSequence;
            while (wrapPoint > (gatingSequence = Util.getMinimumSequence(gatingSequences, current)))
            {
                LockSupport.parkNanos(1L); //                 LockSupport.parkNanos(1L); // TODO: 待ち方を、待機戦略（wait strategy）に合わせるべきか
            }

            gatingSequenceCache.set(gatingSequence);
        }

        return nextSequence;
```

`wrapPoint` が、一番遅い消費者の位置より大きければ、まだ読まれていない要素を上書きしてしまいます。そのため、`LockSupport.parkNanos(1L)` で少し待ち、消費者の位置を読み直します。待ち終わったら、その位置をキャッシュに保存して、`nextSequence` を返します。

## ここがすごい

- **競合で失敗しない**: 確保は `getAndAdd` の 1 回で済むので、ほかの生産者と競合しても、やり直しの処理がありません。
- **消費者の位置を毎回読まない**: キャッシュを使うので、一番遅い消費者の位置を読むのは、キャッシュが足りないときだけです。読み取りの回数が減り、共有の値への負荷が下がります。
- **上書きを防ぐ**: `wrapPoint` と消費者の位置の比較で、まだ読まれていない要素を壊さないように待ちます。
- **待ち方は単純**: 待ちの間は `parkNanos(1L)` で、ごく短く止まっては確かめ直します。コメントの TODO にあるように、待機の方法はまだ改善の余地があると書かれています。

## まとめ

- `next(n)` は、カーソルを `getAndAdd(n)` で増やし、`n` 個分の枠を 1 回の操作で確保する。
- 確保した枠が、一番遅い消費者にまだ読まれていなければ、その消費者の位置を見て待つ。
- 消費者の位置はキャッシュで持ち、読み直す回数を減らす。
