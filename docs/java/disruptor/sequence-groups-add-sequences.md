---
title: "配列の差し替えを CAS で繰り返し、ロックなしで追加する"
description: "LMAX Disruptor の SequenceGroups.addSequences。シーケンスの配列を新しい配列に作り直し、AtomicReferenceFieldUpdater の compareAndSet で差し替える。失敗したら最初からやり直す。"
language: java
project: LMAX Disruptor
repo: https://github.com/LMAX-Exchange/disruptor
license: Apache-2.0
copyright: "Copyright 2012 LMAX Ltd."
commit: "c871ca49826a6be7ada6957f6fbafcfecf7b1f87"
file: src/main/java/com/lmax/disruptor/SequenceGroups.java
lines: [27, 57]
function: "SequenceGroups.addSequences"
difficulty: 3
format: 2
tags: [並行処理, アルゴリズム, データ構造]
---

## ひとことで

Disruptor は、リングバッファの進み具合を、`Sequence` という番号で表します。ある処理（ゲートや消費者）が、どこまで読んだかを、この番号で示します。

`addSequences` は、その番号の一覧に新しい番号を追加します。一覧の配列はロックなしで共有されるので、追加は「配列を作り直し、CAS で差し替える」形で行います。

## コード

```java:line-numbers=27
    static <T> void addSequences(
        final T holder,
        final AtomicReferenceFieldUpdater<T, Sequence[]> updater,
        final Cursored cursor,
        final Sequence... sequencesToAdd)
    {
        long cursorSequence;
        Sequence[] updatedSequences;
        Sequence[] currentSequences;

        do
        {
            currentSequences = updater.get(holder);
            updatedSequences = copyOf(currentSequences, currentSequences.length + sequencesToAdd.length);
            cursorSequence = cursor.getCursor();

            int index = currentSequences.length;
            for (Sequence sequence : sequencesToAdd)
            {
                sequence.set(cursorSequence);
                updatedSequences[index++] = sequence;
            }
        }
        while (!updater.compareAndSet(holder, currentSequences, updatedSequences));

        cursorSequence = cursor.getCursor();
        for (Sequence sequence : sequencesToAdd)
        {
            sequence.set(cursorSequence);
        }
    }
```

## 前提知識

- **`Sequence`**: 1 つの番号を持つ、スレッドから安全に読み書きできる値です。
- **CAS（compareAndSet）**: 「今の値が期待どおりなら、新しい値に変える」という 1 回の操作です。成功した場合だけ変わり、他のスレッドが先に変えていたら失敗します。
- **`AtomicReferenceFieldUpdater`**: 対象のオブジェクトの参照型のフィールドに、CAS を行うための道具です。ここでは、`Sequence[]` の配列を差し替えるのに使います。
- **配列はコピーして作る**: Java の配列は長さを変えられないので、新しい長さの配列を作って元の要素を写します。

## 何をしているか

### 1. 新しい配列を作り、CAS で差し替える

```java:line-numbers=37
        do
        {
            currentSequences = updater.get(holder);
            updatedSequences = copyOf(currentSequences, currentSequences.length + sequencesToAdd.length);
            cursorSequence = cursor.getCursor();

            int index = currentSequences.length;
            for (Sequence sequence : sequencesToAdd)
            {
                sequence.set(cursorSequence);
                updatedSequences[index++] = sequence;
            }
        }
        while (!updater.compareAndSet(holder, currentSequences, updatedSequences));
```

`do` の中では、現在の配列を読み、追加分を含む長さの新しい配列 `updatedSequences` を作ります。その後、追加する各 `Sequence` を、読んだカーソルの位置に合わせ、新しい配列に入れます。

`while (!updater.compareAndSet(holder, currentSequences, updatedSequences));` は、差し替えを試みます。ほかのスレッドが途中で配列を変えていれば失敗するので、そのときは `do` の先頭に戻って、もう一度作り直します。

### 2. 差し替えの後で、カーソルに合わせる

```java:line-numbers=52
        cursorSequence = cursor.getCursor();
        for (Sequence sequence : sequencesToAdd)
        {
            sequence.set(cursorSequence);
        }
```

差し替えが成功すると、カーソルの位置をもう一度読み、追加された各 `Sequence` をその位置に設定します。これで、新しく追加されたシーケンスは、現在のカーソルから処理を始められます。

## ここがすごい

- **ロックを使わない**: 配列の差し替えは CAS だけで行うので、待ち行列やロックを作らずに、複数のスレッドが同時に追加できます。
- **読む側は止まらない**: 配列は、差し替えの前後で、古いものか新しいものかのどちらかが見えます。途中の状態は見えないので、読む側は待たされません。
- **失敗したら作り直す**: CAS が負けたときは、最新の配列から作り直すだけです。古い配列を上書きしてしまう心配がありません。
- **カーソルは 2 回読む**: 配列を作るときの値と、差し替えの後の値は別に読まれます。差し替え後の値を使うことで、追加の時点のカーソルに合わせられます。

## まとめ

- `addSequences` は、新しい配列を作り、`compareAndSet` で差し替える。
- 失敗したら、最新の配列からやり直すので、他のスレッドの変更を消さない。
- 差し替えの後にカーソルを読み、追加した `Sequence` をその位置へ合わせる。
