---
title: "複数の生産者が、CAS で書き込み位置を取り合う"
description: "JCTools の MpscArrayQueue.offer。複数のスレッドが同時に末尾へ入れられる有界キューで、生産者の位置を CAS で 1 つずつ確保し、消費者の位置は必要なときだけ読み直す。"
language: java
project: JCTools
repo: https://github.com/JCTools/JCTools
license: Apache-2.0
copyright: "Copyright JCTools contributors"
commit: "6d497fc79fcf44dc3c301ac813f3615fabb3a444"
file: jctools-core/src/main/java/org/jctools/queues/MpscArrayQueue.java
lines: [288, 311]
function: "MpscArrayQueue.offer"
difficulty: 3
format: 2
tags: [並行処理, ロック不要, データ構造]
---

## ひとことで

`MpscArrayQueue` は、複数のスレッドが同時に `offer` して、1 つのスレッドが `poll` する、有界のキューです。`offer` は、末尾に要素を入れて成功すると `true` を、キューが満杯なら `false` を返します。

複数の生産者が同時に入れるときに、互いの書き込み位置がぶつからないように、位置を CAS（比較して交換する命令）で 1 つずつ確保します。ロックを使わないので、1 つのスレッドが止まっても、他のスレッドは先に進めます。

## コード

::: code-group

```java:line-numbers=288 [日本語訳]
        // producerLimit は、消費者の位置を覚えておくキャッシュで、ループの中で更新されることがある
        long producerLimit = lvProducerLimit();
        long pIndex;
        do
        {
            pIndex = lvProducerIndex();
            if (pIndex >= producerLimit)
            {
                final long cIndex = lvConsumerIndex();
                producerLimit = cIndex + mask + 1;

                if (pIndex >= producerLimit)
                {
                    return false; // return false; // 満杯
                }
                else
                {
                    // producer limit を、消費者の位置を再確認すべき次の位置まで更新する
                    // 競合はあるが、その競合は害がない
                    soProducerLimit(producerLimit);
                }
            }
        }
        while (!casProducerIndex(pIndex, pIndex + 1));
```

```java:line-numbers=288 [原文]
        // use `producerLimit` which is a cached view on consumer index (potentially updated in loop)
        long producerLimit = lvProducerLimit();
        long pIndex;
        do
        {
            pIndex = lvProducerIndex();
            if (pIndex >= producerLimit)
            {
                final long cIndex = lvConsumerIndex();
                producerLimit = cIndex + mask + 1;

                if (pIndex >= producerLimit)
                {
                    return false; // FULL :(
                }
                else
                {
                    // update producer limit to the next index that we must recheck the consumer index
                    // this is racy, but the race is benign
                    soProducerLimit(producerLimit);
                }
            }
        }
        while (!casProducerIndex(pIndex, pIndex + 1));
```

:::

## 前提知識

- **生産者（producer）と消費者（consumer）**: 生産者は要素を入れる側、消費者は取り出す側です。「Mpsc」は、複数の生産者（Multi Producer）と単一の消費者（Single Consumer）を表します。
- **`producerIndex`**: 次に要素を入れる位置を表す、単調に増える値です。
- **`consumerIndex`**: 次に取り出す位置です。キューに空きがあるかを判定するために使います。
- **`producerLimit`**: 生産者が「ここまでは空いている」と覚えている位置です。消費者の位置を毎回読まずに済むように、キャッシュとして使います。
- **CAS（compare-and-set）**: 「値が期待したものなら新しい値に変える」という操作を 1 回の命令で行います。失敗したら、やり直します。

## 何をしているか

### 1. 空きの見積もりをキャッシュから取る

```java:line-numbers=288
        // producerLimit は、消費者の位置を覚えておくキャッシュで、ループの中で更新されることがある
        long producerLimit = lvProducerLimit();
        long pIndex;
```

`producerLimit` を、キャッシュとして読みます。ここまでは空いていると分かっていれば、消費者の位置を読まずに書き込めます。

### 2. 上限に達したら、消費者の位置を読み直す

```java:line-numbers=293
            pIndex = lvProducerIndex();
            if (pIndex >= producerLimit)
            {
                final long cIndex = lvConsumerIndex();
                producerLimit = cIndex + mask + 1;

                if (pIndex >= producerLimit)
                {
                    return false; // return false; // 満杯
```

`pIndex` が `producerLimit` に達したら、消費者の位置 `cIndex` を読み直し、新しい上限 `cIndex + mask + 1` を計算します。それでも `pIndex` が上限以上なら、キューは満杯なので `false` を返します。

```java:line-numbers=303
                else
                {
                    // producer limit を、消費者の位置を再確認すべき次の位置まで更新する
                    // 競合はあるが、その競合は害がない
                    soProducerLimit(producerLimit);
                }
```

まだ空きがあるなら、新しい上限を `soProducerLimit` で保存します。次の `offer` が、この上限を使えるようになります。この書き込みは、競合があっても害がないとコメントされています。古い上限を読んでも、CAS の失敗で正しく再試行されるためです。

### 3. CAS で位置を確保する

```java:line-numbers=311
        while (!casProducerIndex(pIndex, pIndex + 1));
```

`casProducerIndex(pIndex, pIndex + 1)` は、`producerIndex` が `pIndex` のままなら、1 つ先へ進めます。失敗したら、別の生産者が先に取ったので、ループの先頭からやり直します。成功したら、その `pIndex` は、この生産者だけのものになります。

### 4. 確保した位置に要素を書く

```java:line-numbers=317
        // CAS に勝った。要素を配列に格納する
        final long offset = calcCircularRefElementOffset(pIndex, mask);
        soRefElement(buffer, offset, e);
        return true; // return true; // 成功
```

CAS に勝ったあと、`pIndex` に対応する配列の位置に、要素を格納します。この書き込みは他の生産者とぶつからないので、単純な書き込みで済みます。

## ここがすごい

- **複数の生産者が同じキューに入れる**: 位置の確保は CAS の 1 回だけで、その後の書き込みは他と衝突しません。ロックの待ちがありません。
- **消費者の位置を読む回数を減らす**: `producerLimit` のキャッシュで、ほとんどの `offer` は消費者の位置を読まずに済みます。消費者と生産者のキャッシュ線の取り合いが減ります。
- **満杯の判定が 1 か所**: 上限を超えたときだけ、消費者の位置を読み直します。空きがある間の判定は、キャッシュの比較だけです。
- **位置を先に確保する設計**: `producerIndex` を先に進めてから要素を書くので、読む側は、まだ要素が書かれていない位置を見ることがあります。このことは、JCTools のコメントにも説明されています。

## まとめ

- `offer` は、`producerLimit` のキャッシュで空きを見積もり、必要なときだけ消費者の位置を読み直す。
- 書き込み位置は CAS で確保し、負けた生産者はループでやり直す。
- 位置を確保してから要素を書くので、複数の生産者がロックなしで同時に入れられる。
