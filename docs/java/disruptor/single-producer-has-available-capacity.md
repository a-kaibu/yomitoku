---
title: "最後に見た最小値を覚えて、毎回の全体確認を省く"
description: "LMAX Disruptor の SingleProducerSequencer.hasAvailableCapacity。消費者の位置の最小値をキャッシュし、キャッシュで空きが証明できるときは、全消費者を調べ直さない。"
language: java
project: LMAX Disruptor
repo: https://github.com/LMAX-Exchange/disruptor
license: Apache-2.0
copyright: "Copyright 2011 LMAX Ltd."
commit: "c871ca49826a6be7ada6957f6fbafcfecf7b1f87"
file: src/main/java/com/lmax/disruptor/SingleProducerSequencer.java
lines: [95, 119]
function: "SingleProducerSequencer.hasAvailableCapacity"
difficulty: 3
format: 2
tags: [並行処理, キャッシュ, 最適化]
---

## ひとことで

Disruptor は、生産者（データを書く側）と消費者（データを読む側）の間に、固定長のリングバッファを置く仕組みです。生産者は、消費者がまだ読んでいない場所を上書きしないように、空きがあるかを確かめてから書きます。

`hasAvailableCapacity` は、その空きの確認を行うメソッドです。すべての消費者の位置を毎回調べると遅くなるので、前回調べた最小値をキャッシュしておき、それで空きが証明できる間は、調べ直しを省きます。

## コード

::: code-group

```java:line-numbers=95 [日本語訳]
    private boolean hasAvailableCapacity(final int requiredCapacity, final boolean doStore)
    {
        long nextValue = this.nextValue;

        long wrapPoint = (nextValue + requiredCapacity) - bufferSize;
        long cachedGatingSequence = this.cachedValue;

        if (wrapPoint > cachedGatingSequence || cachedGatingSequence > nextValue)
        {
            if (doStore)
            {
                cursor.setVolatile(nextValue);  // StoreLoad のメモリ順序の保証（書き込みを先に見せる）
            }

            long minSequence = Util.getMinimumSequence(gatingSequences, nextValue);
            this.cachedValue = minSequence;

            if (wrapPoint > minSequence)
            {
                return false;
            }
        }

        return true;
    }
```

```java:line-numbers=95 [原文]
    private boolean hasAvailableCapacity(final int requiredCapacity, final boolean doStore)
    {
        long nextValue = this.nextValue;

        long wrapPoint = (nextValue + requiredCapacity) - bufferSize;
        long cachedGatingSequence = this.cachedValue;

        if (wrapPoint > cachedGatingSequence || cachedGatingSequence > nextValue)
        {
            if (doStore)
            {
                cursor.setVolatile(nextValue);  // StoreLoad fence
            }

            long minSequence = Util.getMinimumSequence(gatingSequences, nextValue);
            this.cachedValue = minSequence;

            if (wrapPoint > minSequence)
            {
                return false;
            }
        }

        return true;
    }
```

:::

## 前提知識

- **シーケンス**: 生産者と消費者が、どこまで書いた（読んだ）かを表す、単調に増える `long` の値です。
- **ゲーティング・シーケンス（gating sequence）**: 生産者が上書きしてはいけない位置を決める、消費者のシーケンスです。その最小値より先には、書けません。
- **`wrapPoint`**: 今の書き込み位置から、必要な数だけ進めたときの位置から、リングバッファの大きさを引いた値です。この値が最小の消費者の位置を超えると、上書きになってしまいます。
- **`cachedValue`**: 前回に調べた、消費者の位置の最小値です。
- **単調増加**: 消費者の位置は、増えることしかありません。そのため、古い最小値は、今の本当の最小値より小さいか等しく、安全な下限になります。

## 何をしているか

### 1. キャッシュで足りるかを判定する

```java:line-numbers=99
        long wrapPoint = (nextValue + requiredCapacity) - bufferSize;
        long cachedGatingSequence = this.cachedValue;

        if (wrapPoint > cachedGatingSequence || cachedGatingSequence > nextValue)
        {
```

`wrapPoint` を計算し、キャッシュした値 `cachedGatingSequence` と比べます。キャッシュが `wrapPoint` より大きく、かつ `nextValue` 以下なら、キャッシュの値だけで空きが証明できます。その場合は、`if` の中に入らず、そのまま `return true` になります。

### 2. キャッシュが足りないときだけ、全消費者を調べる

```java:line-numbers=104
            if (doStore)
            {
                cursor.setVolatile(nextValue);  // StoreLoad のメモリ順序の保証（書き込みを先に見せる）
            }

            long minSequence = Util.getMinimumSequence(gatingSequences, nextValue);
            this.cachedValue = minSequence;

```

キャッシュでは証明できないときは、`cursor` を書き込み、消費者全員の位置の最小値を `getMinimumSequence` で求めます。その値を `cachedValue` に覚えておきます。`cursor.setVolatile(nextValue)` は、生産者の位置の書き込みを、その後の消費者の位置の読み取りより先に確定させるための操作です（コメントの StoreLoad は、この順序を指します）。

### 3. 最小値でも足りなければ、空きなし

```java:line-numbers=112
            if (wrapPoint > minSequence)
            {
                return false;
            }
        }

        return true;
```

新しい最小値で `wrapPoint` を比べ、まだ超えていれば `false` を返します。空きがあれば、`true` を返します。

## ここがすごい

- **毎回の全体確認を省く**: 消費者が多いと、最小値を求めるのに全員の位置を読む必要があります。キャッシュがあれば、その読みを、必要なときだけに減らせます。
- **古い値でも安全**: 消費者の位置は増えるだけなので、キャッシュした最小値は、本当の最小値より小さいか等しいです。そのため、キャッシュで空きが証明できれば、必ず安全です。
- **ロックを使わない**: 判定は、フィールドの読みと比較だけです。消費者を止めることなく、空きを確かめられます。
- **再計算の条件が明確**: `wrapPoint > cachedGatingSequence || cachedGatingSequence > nextValue` の 2 つの条件で、再計算が必要な場面が決まっています。

## まとめ

- `hasAvailableCapacity` は、前回の消費者の最小値をキャッシュし、それで空きが証明できる間は全員の位置を読み直さない。
- 消費者の位置は増えるだけなので、古いキャッシュの最小値は安全な下限になる。
- キャッシュが足りないときだけ、全消費者の最小値を求め直し、それを覚えておく。
