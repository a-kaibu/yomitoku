---
title: "ロックなしで 1 対 1 のキューに入れる"
description: "JCTools の SpscArrayQueue.offer。生産者 1 人・消費者 1 人の配列キューで、ロックを使わずに要素を入れる。読み込みを減らす先読みの上限キャッシュに注目する。"
language: java
project: JCTools
repo: https://github.com/JCTools/JCTools
license: Apache-2.0
copyright: "Copyright JCTools contributors"
commit: "6d497fc79fcf44dc3c301ac813f3615fabb3a444"
file: jctools-core/src/main/java/org/jctools/queues/SpscArrayQueue.java
lines: [198, 236]
function: "SpscArrayQueue.offer"
difficulty: 3
format: 2
tags: [並行処理, ロック不要, データ構造]
---

## ひとことで

`SpscArrayQueue.offer(e)` は、配列で作ったキューの末尾に要素を入れます。SPSC は「生産者 1 人、消費者 1 人」の意味で、この前提があるので、ロックを使わずに安全に動きます。

スレッドが 2 つだけのやり取りで、遅延を抑えたいときに使われます。JCTools は、こうした低レイテンシーのための並行キューをまとめたライブラリです。

## コード

::: code-group

```java:line-numbers=198 [日本語訳]
    public boolean offer(final E e)
    {
        if (null == e)
        {
            throw new NullPointerException();
        }
        // volatile な読み込みの後で、同じフィールドを何度も読まないよう、フィールドをローカル変数に読み込む
        final E[] buffer = this.buffer;
        final long mask = this.mask;
        final long producerIndex = this.lpProducerIndex();

        if (producerIndex >= producerLimit &&
            !offerSlowPath(buffer, mask, producerIndex))
        {
            return false;
        }
        final long offset = calcCircularRefElementOffset(producerIndex, mask);

        soRefElement(buffer, offset, e);
        soProducerIndex(producerIndex + 1); // 順序付きの書き込みにより、アトミックで順序が保証され、size() から見える
        return true;
    }

    private boolean offerSlowPath(final E[] buffer, final long mask, final long producerIndex)
    {
        final int lookAheadStep = this.lookAheadStep;
        if (null == lvRefElement(buffer,
            calcCircularRefElementOffset(producerIndex + lookAheadStep, mask)))
        {
            producerLimit = producerIndex + lookAheadStep;
        }
        else
        {
            final long offset = calcCircularRefElementOffset(producerIndex, mask);
            if (null != lvRefElement(buffer, offset))
            {
                return false;
            }
        }
```

```java:line-numbers=198 [原文]
    public boolean offer(final E e)
    {
        if (null == e)
        {
            throw new NullPointerException();
        }
        // local load of field to avoid repeated loads after volatile reads
        final E[] buffer = this.buffer;
        final long mask = this.mask;
        final long producerIndex = this.lpProducerIndex();

        if (producerIndex >= producerLimit &&
            !offerSlowPath(buffer, mask, producerIndex))
        {
            return false;
        }
        final long offset = calcCircularRefElementOffset(producerIndex, mask);

        soRefElement(buffer, offset, e);
        soProducerIndex(producerIndex + 1); // ordered store -> atomic and ordered for size()
        return true;
    }

    private boolean offerSlowPath(final E[] buffer, final long mask, final long producerIndex)
    {
        final int lookAheadStep = this.lookAheadStep;
        if (null == lvRefElement(buffer,
            calcCircularRefElementOffset(producerIndex + lookAheadStep, mask)))
        {
            producerLimit = producerIndex + lookAheadStep;
        }
        else
        {
            final long offset = calcCircularRefElementOffset(producerIndex, mask);
            if (null != lvRefElement(buffer, offset))
            {
                return false;
            }
        }
```

:::

## 前提知識

- **キュー**: 先に入れた要素を、先に取り出す入れ物です。先入れ先出し（FIFO）の順番を持ちます。
- **SPSC（単一生産者・単一消費者）**: 入れる側も取り出す側も 1 つのスレッドだけと決めた形です。競合が減るので、ロックなしで作りやすくなります。
- **`volatile` の読み書き**: 別のスレッドからの変更を、すぐに見えるようにする仕組みです。ただし、読み書きのたびに余計なコストがかかります。
- **`mask`**: 配列の大きさから作ったビットマスクです。添字をリングバッファの範囲に収めるために使われます。
- **`null` のスロット**: 要素が入っていないことを示します。消費者が取り出すと、そこは `null` に戻ります。

## 何をしているか

### 1. 入力と生産者の位置を確かめる

```java:line-numbers=199
    {
        if (null == e)
        {
            throw new NullPointerException();
        }
        // volatile な読み込みの後で、同じフィールドを何度も読まないよう、フィールドをローカル変数に読み込む
        final E[] buffer = this.buffer;
        final long mask = this.mask;
        final long producerIndex = this.lpProducerIndex();
```

`null` の要素は受け付けません。配列とマスクを、ローカル変数に読み込みます。`lpProducerIndex()` は、生産者だけが書く位置なので、通常の読み込みで十分です。

### 2. 上限を超えたときだけ遅い経路へ

```java:line-numbers=209
        if (producerIndex >= producerLimit &&
            !offerSlowPath(buffer, mask, producerIndex))
        {
            return false;
```

`producerLimit` は、前回確かめた「ここまでは空いている」という上限のキャッシュです。消費者の位置を毎回読むと遅くなるので、上限に達したときだけ `offerSlowPath` で確かめ直します。

### 3. 要素を書き込み、位置を進める

```java:line-numbers=214
        final long offset = calcCircularRefElementOffset(producerIndex, mask);

        soRefElement(buffer, offset, e);
        soProducerIndex(producerIndex + 1); // 順序付きの書き込みにより、アトミックで順序が保証され、size() から見える
        return true;
```

要素を正しいスロットに書き込み、`producerIndex + 1` を公開します。書き込みを公開する順番が大切で、消費者はこの位置を見て要素を読みに来ます。

### 4. 遅い経路で先読みを確かめる

```java:line-numbers=221
    private boolean offerSlowPath(final E[] buffer, final long mask, final long producerIndex)
    {
        final int lookAheadStep = this.lookAheadStep;
        if (null == lvRefElement(buffer,
            calcCircularRefElementOffset(producerIndex + lookAheadStep, mask)))
        {
            producerLimit = producerIndex + lookAheadStep;
        }
        else
        {
            final long offset = calcCircularRefElementOffset(producerIndex, mask);
            if (null != lvRefElement(buffer, offset))
            {
                return false;
            }
        }
```

`offerSlowPath` は、`lookAheadStep` だけ先のスロットが空かどうかを調べます。空なら、そこまでを新しい上限として記録します。空でなければ、今いるスロットを確かめて、まだ満杯なら `false` を返します。

## ここがすごい

- **消費者の位置を毎回読まない**: 生産者は、`producerLimit` の範囲内なら、消費者の状態を見ずに入れられます。読み込みの回数を減らすことが、速さの基本です。
- **先読みで一度に多く確かめる**: 1 スロットずつ見ずに、`lookAheadStep` 先をまとめて確かめます。空きがあれば、その範囲は次の呼び出しから確かめ直さずに済みます。
- **ロックを使わない**: 生産者と消費者が、それぞれ別の位置だけを書きます。同じ変数を奪い合わないので、待ち時間が発生しにくくなります。
- **前提を明記している**: 同じ位置に複数の生産者がいると壊れるので、このクラスは 1 対 1 専用です。その制約がクラス名で明確に示されています。

## まとめ

- SPSC キューは、生産者と消費者を 1 人ずつに限ることで、ロックなしで要素を入れられる。
- 空きの上限をキャッシュし、先読みで確かめ直す回数を減らす。
- 書き込みを公開する順番を守ることで、消費者が正しい要素を読める。
