---
title: "固定長の配列を、満杯になったら次の配列へつないで伸ばす"
description: "RxJava の SpscLinkedArrayQueue.offer。1 人の生産者と 1 人の消費者のための、上限のない待ち行列。先読みの位置を覚えて空きを確かめ、いっぱいなら新しい配列をつなげる。"
language: java
project: RxJava
repo: https://github.com/ReactiveX/RxJava
license: Apache-2.0
copyright: "Copyright (c) 2016-present, RxJava Contributors."
commit: "b0e8737b956f05cebca961899193c80104c94941"
file: src/main/java/io/reactivex/rxjava4/operators/SpscLinkedArrayQueue.java
lines: [72, 97]
function: "SpscLinkedArrayQueue.offer"
difficulty: 3
format: 2
tags: [並行処理, データ構造, アルゴリズム]
---

## ひとことで

`SpscLinkedArrayQueue` は、1 つのスレッドが入れ、もう 1 つのスレッドが取り出す待ち行列です。配列は固定長ですが、いっぱいになると、新しい配列を後ろへつないで伸びていきます。上限はありません。

`offer` は、要素を 1 つ入れるメソッドです。配列の空きを確かめ、必要なら新しい配列を作ります。

## コード

::: code-group

```java:line-numbers=72 [日本語訳]
    public boolean offer(final T e) {
        if (null == e) {
            throw new NullPointerException("Null is not a valid element");
        }
        //         // 揮発性の読み込みのあとで、同じ値を繰り返し読まないよう、フィールドをローカルに写す
        final AtomicReferenceArray<Object> buffer = producerBuffer;
        final long index = lpProducerIndex();
        final int mask = producerMask;
        final int offset = calcWrappedOffset(index, mask);
        if (index < producerLookAhead) {
            return writeToQueue(buffer, e, index, offset);
        } else {
            final int lookAheadStep = producerLookAheadStep;
            //             // バッファを回るか、いっぱいならサイズを増やす（最大容量に達していなければ）
            int lookAheadElementOffset = calcWrappedOffset(index + lookAheadStep, mask);
            if (null == lvElement(buffer, lookAheadElementOffset)) { //             if (null == lvElement(buffer, lookAheadElementOffset)) { // LoadLoad（読み込みの順序を保つ）
                producerLookAhead = index + lookAheadStep - 1; //                 producerLookAhead = index + lookAheadStep - 1; // 十分に空きがある
                return writeToQueue(buffer, e, index, offset);
            } else if (null == lvElement(buffer, calcWrappedOffset(index + 1, mask))) { //             } else if (null == lvElement(buffer, calcWrappedOffset(index + 1, mask))) { // バッファはいっぱいではない
                return writeToQueue(buffer, e, index, offset);
            } else {
                resize(buffer, index, offset, e, mask); //                 resize(buffer, index, offset, e, mask); // 新しいバッファを追加し、古いものとつなぐ
                return true;
            }
        }
    }
```

```java:line-numbers=72 [原文]
    public boolean offer(final T e) {
        if (null == e) {
            throw new NullPointerException("Null is not a valid element");
        }
        // local load of field to avoid repeated loads after volatile reads
        final AtomicReferenceArray<Object> buffer = producerBuffer;
        final long index = lpProducerIndex();
        final int mask = producerMask;
        final int offset = calcWrappedOffset(index, mask);
        if (index < producerLookAhead) {
            return writeToQueue(buffer, e, index, offset);
        } else {
            final int lookAheadStep = producerLookAheadStep;
            // go around the buffer or resize if full (unless we hit max capacity)
            int lookAheadElementOffset = calcWrappedOffset(index + lookAheadStep, mask);
            if (null == lvElement(buffer, lookAheadElementOffset)) { // LoadLoad
                producerLookAhead = index + lookAheadStep - 1; // joy, there's plenty of room
                return writeToQueue(buffer, e, index, offset);
            } else if (null == lvElement(buffer, calcWrappedOffset(index + 1, mask))) { // buffer is not full
                return writeToQueue(buffer, e, index, offset);
            } else {
                resize(buffer, index, offset, e, mask); // add a buffer and link old to new
                return true;
            }
        }
    }
```

:::

## 前提知識

- **SPSC（単一生産者・単一消費者）**: 入れる側と取り出す側が、それぞれ 1 スレッドだけの形です。その前提で、ロックなしに速く動かせます。
- **先読み（look ahead）**: 空きがあることが分かっている位置を、覚えておく仕組みです。毎回、その先の空きを確かめる代わりに、覚えた位置まで書けばよくなります。
- **`null` の意味**: 配列の要素が `null` なら、その場所は空いています。消費者は、取り出した後の場所を `null` に戻します（`soElement(buffer, offset, null)`）。
- **マスク（mask）**: 配列の長さは 2 の累乗なので、`index & mask` で円形の位置を求められます。

## 何をしているか

### 1. 先読みの範囲にあれば、そのまま書く

```java:line-numbers=74
            throw new NullPointerException("Null is not a valid element");
        }
        //         // 揮発性の読み込みのあとで、同じ値を繰り返し読まないよう、フィールドをローカルに写す
        final AtomicReferenceArray<Object> buffer = producerBuffer;
        final long index = lpProducerIndex();
        final int mask = producerMask;
        final int offset = calcWrappedOffset(index, mask);
        if (index < producerLookAhead) {
            return writeToQueue(buffer, e, index, offset);
```

`index` は、次に書く位置の番号です。`index < producerLookAhead` なら、すでに空きが確かめられている範囲なので、消費者の状態を読まずに `writeToQueue` で書けます。

### 2. 先読みを超えたら、空きを確かめる

```java:line-numbers=85
            //             // バッファを回るか、いっぱいならサイズを増やす（最大容量に達していなければ）
            int lookAheadElementOffset = calcWrappedOffset(index + lookAheadStep, mask);
            if (null == lvElement(buffer, lookAheadElementOffset)) { //             if (null == lvElement(buffer, lookAheadElementOffset)) { // LoadLoad（読み込みの順序を保つ）
                producerLookAhead = index + lookAheadStep - 1; //                 producerLookAhead = index + lookAheadStep - 1; // 十分に空きがある
                return writeToQueue(buffer, e, index, offset);
            } else if (null == lvElement(buffer, calcWrappedOffset(index + 1, mask))) { //             } else if (null == lvElement(buffer, calcWrappedOffset(index + 1, mask))) { // バッファはいっぱいではない
                return writeToQueue(buffer, e, index, offset);
            } else {
                resize(buffer, index, offset, e, mask); //                 resize(buffer, index, offset, e, mask); // 新しいバッファを追加し、古いものとつなぐ
```

先読みの範囲を超えたときは、`index + lookAheadStep` の位置が空いているかを見ます。空いていれば、先読みの位置を更新して書きます。そうでなければ、次の 1 つの位置を確かめ、それも空いていなければ配列はいっぱいです。

いっぱいのときは、`resize` で新しい配列を作り、古い配列の末尾に、新しい配列へのつなぎ目（`HAS_NEXT`）を書きます。要素は新しい配列の先頭に入ります。

## ここがすごい

- **空きの確認を減らす**: 先読みの位置を覚えておくと、毎回 `null` を読み直す回数が減ります。読み込みが少ないほど、スレッド同士の衝突が減ります。
- **配列の上限がない**: いっぱいになったら、新しい配列を作ってつなぐので、キューの大きさを事前に決めなくて済みます。
- **つなぎ目の目印**: 古い配列の、次の要素の位置に `HAS_NEXT` を書くことで、消費者は次の配列へ進む場所を知れます。
- **先読みの大きさは容量で決まる**: `adjustLookAheadStep` は、容量の 4 分の 1 と上限の小さい方を先読みの大きさにします。小さなキューでも、先読みが大きすぎないように抑えられています。

## まとめ

- `offer` は、先読みの範囲なら直接書き、超えたら空きを確かめる。
- いっぱいなら、新しい配列を作って古い配列につなぎ、要素は新しい配列へ入れる。
- 先読みの位置を覚えることで、空きの確認を減らしながら、上限のない待ち行列を作る。
