---
title: "値の更新を 1 人にまとめて発火させる updateState"
description: "StateFlow の値を変えて、購読者に知らせる updateState。ロックの下で値と通し番号を更新し、ロックの外で購読者に通知する。更新が重なったら、通し番号で最後の 1 人が全体をまとめて発火する。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/StateFlow.kt
lines: [326, 367]
function: "StateFlowImpl.updateState"
difficulty: 3
tags: [並行処理, 状態機械, 最適化]
format: 2
---

## ひとことで

`StateFlow` の値を変えると、それを見ている購読者（`collect` している人）全員に知らせる必要があります。`updateState` は、その **値の更新と、購読者への通知** を行う関数です。

値の変更は `synchronized` のロックの下で行い、通知は **ロックの外** で行います。さらに、同時に多数のスレッドから更新されても、通知は 1 つの流れにまとめて処理されるように、通し番号（`sequence`）で管理しています。

## コード


::: code-group

```kotlin:line-numbers=326 [日本語訳]
    private fun updateState(expectedState: Any?, newState: Any): Boolean {
        var curSequence: Int
        var curSlots: Array<StateFlowSlot?>? // 無害な競合（benign race）。ロックの外で読むので、この読み取りは同期されていない
        synchronized(this) {
            val oldState = _state.value
            if (expectedState != null && oldState != expectedState) return false // CAS のサポート
            if (oldState == newState) return true // 値が変わらないなら何もしない。ただし CAS なら true
            _state.value = newState
            curSequence = sequence
            if (curSequence and 1 == 0) { // 偶数の sequence は、静かな状態（更新中ではない）
                curSequence++ // 奇数にする
                sequence = curSequence
            } else {
                // 更新がすでに進行中なので、それに通知して戻る
                sequence = curSequence + 2 // 通知のために sequence を変える。奇数のまま
                return true // 更新された
            }
            curSlots = slots // ロックの下で、収集者への現在の参照を読む
        }
        /*
           ロックの外で値の更新を発火する。Unconfined のコルーチンとのデッドロックを避けるため。
           すべての変更を発火し終えるまで繰り返す。これは単純な flat combining の一種で、
           並行する更新を順番に発火させ、多数のスレッドから同時に更新されたときに
           収集者の再開が大量に起きるのを防ぐ。
         */
        while (true) {
            // 配列の要素を読むときの無害な競合（benign race）
            curSlots?.forEach {
                it?.makePending()
            }
            // 古い値を更新している間に、値がまた更新されたかを確かめる
            synchronized(this) {
                if (sequence == curSequence) { // 何も変わっていない。終わり
                    sequence = curSequence + 1 // sequence をもう一度偶数に戻す
                    return true // 終わり。更新された
                }
                // ロックの下で、次の繰り返しのためにすべて読み直す
                curSequence = sequence
                curSlots = slots
            }
        }
    }
```

```kotlin:line-numbers=326 [原文]
    private fun updateState(expectedState: Any?, newState: Any): Boolean {
        var curSequence: Int
        var curSlots: Array<StateFlowSlot?>? // benign race, we will not use it
        synchronized(this) {
            val oldState = _state.value
            if (expectedState != null && oldState != expectedState) return false // CAS support
            if (oldState == newState) return true // Don't do anything if value is not changing, but CAS -> true
            _state.value = newState
            curSequence = sequence
            if (curSequence and 1 == 0) { // even sequence means quiescent state flow (no ongoing update)
                curSequence++ // make it odd
                sequence = curSequence
            } else {
                // update is already in process, notify it, and return
                sequence = curSequence + 2 // change sequence to notify, keep it odd
                return true // updated
            }
            curSlots = slots // read current reference to collectors under lock
        }
        /*
           Fire value updates outside of the lock to avoid deadlocks with unconfined coroutines.
           Loop until we're done firing all the changes. This is a sort of simple flat combining that
           ensures sequential firing of concurrent updates and avoids the storm of collector resumes
           when updates happen concurrently from many threads.
         */
        while (true) {
            // Benign race on element read from array
            curSlots?.forEach {
                it?.makePending()
            }
            // check if the value was updated again while we were updating the old one
            synchronized(this) {
                if (sequence == curSequence) { // nothing changed, we are done
                    sequence = curSequence + 1 // make sequence even again
                    return true // done, updated
                }
                // reread everything for the next loop under the lock
                curSequence = sequence
                curSlots = slots
            }
        }
    }
```

:::

## 前提知識

- **`StateFlow`**: 今の値を 1 つ持ち、値が変わるたびに購読者へ知らせる Flow です。常に最新の値を読めます。
- **`synchronized(this) { ... }`**: 同じオブジェクトのロックを取って、中のブロックを 1 つずつ実行する仕組みです。
- **`sequence`（通し番号）**: 更新の状態を表す整数です。偶数なら「通知の流れが動いていない」、奇数なら「誰かが通知中」を表します。
- **`slots`**: 購読者ごとの「スロット」の配列です。`makePending()` で、購読者に「新しい値があるよ」と印を付けます。
- **`expectedState`**: CAS（期待した値のときだけ書き換える）のための比較用の値です。`null` なら比べません。
- **`Unconfined`**: どのスレッドでも、呼ばれた場所でそのまま動くコルーチンです。ロックの中で通知すると、デッドロックの原因になることがあります。

## 何をしているか

### 1. ロックの下で、値と通し番号を更新する

まず、値を変えられるかを確かめます。期待した値と違えば失敗です。同じ値なら何もしません。違えば、新しい値を書き、通し番号を見ます。

```kotlin:line-numbers=333
            _state.value = newState
```

### 2. 通知が動いていなければ、自分が通知役になる

通し番号が偶数（静かな状態）なら、奇数にして、自分が通知の担当になります。奇数（通知中）なら、通し番号を 2 つ進めて、今の担当に任せて戻ります。

```kotlin:line-numbers=340
                sequence = curSequence + 2 // 通知のために sequence を変える。奇数のまま
```

### 3. ロックの外で、購読者に通知する

通知担当は、ロックを解放してから、購読者の `makePending()` を呼びます。

```kotlin:line-numbers=353
            curSlots?.forEach {
                it?.makePending()
```

### 4. 通知中に更新がなければ、終わる

もう一度ロックを取り、通し番号が最初と同じなら、だれも値を変えていません。通し番号を偶数に戻して終わります。変わっていれば、最新の状態を読み直して、もう一度通知します。

```kotlin:line-numbers=363
                curSequence = sequence
                curSlots = slots
```

## ここがすごい

- **通知をロックの外で行う**: 購読者の再開は、別のコルーチンを起こすかもしれません。ロックの中でそれをすると、待ち合わせが起きて、デッドロックの危険があります。
- **通知役を 1 人にまとめる**: 多数のスレッドが同時に値を変えても、通知の担当は 1 人だけです。担当は、通し番号の変化を見ながら、最後の更新まで通知を続けます。
- **通し番号で状態を表す**: 偶数と奇数の 1 ビットで「通知中かどうか」を表すので、別の変数を増やさずに済みます。
- **最新の値を通知する**: 通知の途中で値が変わっても、担当が読み直すので、最後には最新の値が届きます。途中の値は、まとめられて（conflate）捨てられることがあります。

## まとめ

- 値の変更はロックの下で行い、通知はロックの外で行う。
- 多数の更新は、通し番号で 1 人の通知担当にまとめる。
- 通知の途中で状態が変わったら、読み直してもう一度通知する。
