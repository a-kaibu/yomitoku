---
title: "複数の生産者が、枠ごとの番号で順番を取り合って入れる"
description: "JCTools の MpmcArrayQueue.offer。枠ごとに番号を持ち、番号が一致したときだけ CAS で生産者の位置を進める。消費者の位置をキャッシュして、満杯かどうかの確認を減らす。"
language: java
project: JCTools
repo: https://github.com/JCTools/JCTools
license: Apache-2.0
copyright: "Copyright JCTools contributors"
commit: "6d497fc79fcf44dc3c301ac813f3615fabb3a444"
file: jctools-core/src/main/java/org/jctools/queues/MpmcArrayQueue.java
lines: [180, 222]
function: "MpmcArrayQueue.offer"
difficulty: 3
format: 2
tags: [並行処理, データ構造, アルゴリズム]
---

## ひとことで

`MpmcArrayQueue` は、複数の生産者と複数の消費者が同時に使える、固定長の待ち行列です。配列の各枠に、「次にこの枠を使う番号」を持たせるのが特徴です。

`offer` は、要素を 1 つ入れるメソッドです。満杯なら `false` を返し、空きがあれば、枠を 1 つ取って要素を書きます。

## コード

::: code-group

```java:line-numbers=180 [日本語訳]
    public boolean offer(final E e)
    {
        if (null == e)
        {
            throw new NullPointerException();
        }
        final long mask = this.mask;
        final long capacity = mask + 1;
        final long[] sBuffer = sequenceBuffer;

        long pIndex;
        long seqOffset;
        long seq;
        long cIndex = Long.MIN_VALUE;//         long cIndex = Long.MIN_VALUE;// 仮の値から始める。使わずに済むことを期待する
        do
        {
            pIndex = lvProducerIndex();
            seqOffset = calcCircularLongElementOffset(pIndex, mask);
            seq = lvLongElement(sBuffer, seqOffset);
            //             // 消費者がこの seq をまだ進めていない。前の生産者が残したままの状態
            if (seq < pIndex)
            {
                //                 // Queue.offer が false を返すのは満杯のときだけ、という保証のための追加の確認
                if (pIndex - capacity >= cIndex && //                 if (pIndex - capacity >= cIndex && // キャッシュしてある cIndex と比べる
                    pIndex - capacity >= (cIndex = lvConsumerIndex())) //                     pIndex - capacity >= (cIndex = lvConsumerIndex())) // 最新の cIndex と比べる
                {
                    return false;
                }
                else
                {
                    seq = pIndex + 1; //                     seq = pIndex + 1; // (+) の工夫。CAS を使わずに、もう一度回るようにする
                }
            }
        }
        while (seq > pIndex || //         while (seq > pIndex || // 別の生産者が番号を進めた（または (+) の工夫）
            !casProducerIndex(pIndex, pIndex + 1)); //             !casProducerIndex(pIndex, pIndex + 1)); // CAS に失敗した

        //         // casProducerIndex が、正しい構築を保証する
        spRefElement(buffer, calcCircularRefElementOffset(pIndex, mask), e);
        //         // seq++;（枠の番号を 1 つ進めたことを表す）
        soLongElement(sBuffer, seqOffset, pIndex + 1);
        return true;
    }
```

```java:line-numbers=180 [原文]
    public boolean offer(final E e)
    {
        if (null == e)
        {
            throw new NullPointerException();
        }
        final long mask = this.mask;
        final long capacity = mask + 1;
        final long[] sBuffer = sequenceBuffer;

        long pIndex;
        long seqOffset;
        long seq;
        long cIndex = Long.MIN_VALUE;// start with bogus value, hope we don't need it
        do
        {
            pIndex = lvProducerIndex();
            seqOffset = calcCircularLongElementOffset(pIndex, mask);
            seq = lvLongElement(sBuffer, seqOffset);
            // consumer has not moved this seq forward, it's as last producer left
            if (seq < pIndex)
            {
                // Extra check required to ensure [Queue.offer == false iff queue is full]
                if (pIndex - capacity >= cIndex && // test against cached cIndex
                    pIndex - capacity >= (cIndex = lvConsumerIndex())) // test against latest cIndex
                {
                    return false;
                }
                else
                {
                    seq = pIndex + 1; // (+) hack to make it go around again without CAS
                }
            }
        }
        while (seq > pIndex || // another producer has moved the sequence(or +)
            !casProducerIndex(pIndex, pIndex + 1)); // failed to increment

        // casProducerIndex ensures correct construction
        spRefElement(buffer, calcCircularRefElementOffset(pIndex, mask), e);
        // seq++;
        soLongElement(sBuffer, seqOffset, pIndex + 1);
        return true;
    }
```

:::

## 前提知識

- **MPMC**: 複数の生産者（Multi Producer）と複数の消費者（Multi Consumer）が、同時に使える形です。
- **枠の番号（sequence）**: 配列の各枠に持たせる番号です。生産者は、この番号が自分の位置と一致したときだけ、その枠を使えます。
- **CAS（casProducerIndex）**: 生産者の位置を `pIndex` から `pIndex + 1` へ、1 回で進める操作です。複数の生産者が同じ位置を取ろうとしても、1 人だけが成功します。
- **円形のマスク**: `calcCircularLongElementOffset(pIndex, mask)` で、番号を配列の中の枠の位置にします。配列の長さは 2 の累乗です。

## 何をしているか

### 1. 枠の番号を確かめる

```java:line-numbers=196
            pIndex = lvProducerIndex();
            seqOffset = calcCircularLongElementOffset(pIndex, mask);
            seq = lvLongElement(sBuffer, seqOffset);
            //             // 消費者がこの seq をまだ進めていない。前の生産者が残したままの状態
            if (seq < pIndex)
```

`pIndex` は、今の生産者の位置です。その位置の枠の番号 `seq` を読みます。`seq < pIndex` なら、消費者がまだその枠を空にしていません。この場合は、満杯かどうかを、消費者の位置と比べて確かめます。

### 2. 位置を CAS で取る

```java:line-numbers=214
        while (seq > pIndex || //         while (seq > pIndex || // 別の生産者が番号を進めた（または (+) の工夫）
            !casProducerIndex(pIndex, pIndex + 1)); //             !casProducerIndex(pIndex, pIndex + 1)); // CAS に失敗した
```

`seq > pIndex` なら、ほかの生産者が先に進めています。`casProducerIndex(pIndex, pIndex + 1)` が成功したら、その枠を自分のものとして取ります。失敗したら、もう一度読み直します。

### 3. 要素を書き、番号を進める

```java:line-numbers=218
        spRefElement(buffer, calcCircularRefElementOffset(pIndex, mask), e);
        //         // seq++;（枠の番号を 1 つ進めたことを表す）
        soLongElement(sBuffer, seqOffset, pIndex + 1);
        return true;
```

取った枠に要素を書き、その枠の番号を `pIndex + 1` にします。消費者は、この番号を見て、枠に要素があることを知ります。

## ここがすごい

- **番号で枠の状態を表す**: 「空いている」「入っている」を、枠の番号で区別します。ロックは使いません。
- **満杯の確認を減らす**: 消費者の位置をキャッシュしておき、必要なときだけ読みます。満杯と判定するときは、最新の値で確かめるので、誤って `false` を返すことはありません。
- **CAS の回数を減らす**: `seq = pIndex + 1` とすると、ループの条件で CAS を飛ばして、読み直しに進めます。
- **書き込みと公開の順序**: 要素を書いてから番号を進めるので、消費者は、番号を見たときに要素が揃っていることを期待できます。

## まとめ

- `offer` は、枠の番号が自分の位置と一致したら、CAS で生産者の位置を進めて枠を取る。
- 枠に要素を書いたあと、番号を進めて消費者に知らせる。
- 満杯の確認は、消費者の位置のキャッシュを使い、必要なときだけ最新の値を読む。
