---
title: "奇数・偶数のカウンタで通知の嵐を防ぐ StateFlow の更新"
description: "StateFlow の値を書き換えて購読者に知らせる関数。更新中かどうかを番号の奇偶で表し、同時に来た更新を 1 人の通知役にまとめている。"
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
tags: [並行処理, 最適化, 設計パターン]
---

## ひとことで

`updateState` は、`StateFlow`（現在の値を 1 つ持ち、変化を通知する Flow）の値を書き換え、**購読しているすべての collector に「新しい値があるよ」と知らせる** 関数です。

多くのスレッドが同時に値を書き換えると、そのたびに全員へ通知していては大変です。そこでこの関数は **`sequence` という番号の奇数・偶数で「いま誰かが通知中か」を表し**、通知中に来た更新は通知役に任せて自分はすぐ帰る、という仕組みにしています。

## コード

```kotlin:line-numbers=326
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

## 前提知識

- **StateFlow とスロット**: StateFlow の購読者（collector）は、それぞれ「スロット」と呼ばれる小さなオブジェクトを持っています。`makePending()` を呼ぶと、そのスロットに「新しい値がある」と印が付き、待っている購読者が起こされます。
- **`synchronized(this) { ... }`**: 同時に 1 つのスレッドしか入れない区間（ロック）を作ります。
- **`NULL`**: 値としての `null` を表す内部の番兵オブジェクトです。
- **`and`**: Kotlin のビットごとの AND 演算子です。`x and 1 == 0` は「`x` の最下位ビットが 0」、つまり **偶数** かどうかを調べます。
- **CAS（compareAndSet）**: 「今の値が期待どおりなら書き換える」操作です。`expectedState` が `null` でなければ、この関数は CAS として動きます。
- **flat combining（フラットコンバイニング）**: 同時に来た複数の要求を、1 つのスレッドがまとめて処理する並行処理の手法です。

## 何をしているか

### 1. ロックの中で値を書き換える（329〜333 行目）

CAS として呼ばれた場合、期待値と違えば `false` を返します（331 行目）。値が変わらないなら何もせず `true`（332 行目）。それ以外なら値を書き換えます。

### 2. 通知役になるか、通知役に任せるか（334〜342 行目）

- `sequence` が **偶数**（誰も通知していない）なら、奇数にして自分が通知役になります。
- **奇数**（誰かが通知中）なら、`sequence` を 2 増やして（奇数のまま）「また変わったよ」と知らせ、すぐ `true` を返します。通知は通知役がやってくれます。

### 3. ロックの外で通知する（351〜355 行目）

すべてのスロットに `makePending()` を呼びます。ロックの外でやるのは、346 行目のコメントの通り、起こされた購読者がその場で動き出して（Unconfined の場合）また更新を呼んだときのデッドロックを避けるためです。

### 4. 通知中に変化がなかったか確認（357〜365 行目）

`sequence` が自分の番号のままなら、偶数に戻して終了。変わっていれば、誰かが通知中に更新したということなので、もう一度通知ループを回します。

例: A が値を 1 にして通知役になる（`sequence` 0 → 1）。A の通知中に B が値を 2 に（1 → 3）、C が値を 3 に（3 → 5）。B と C はすぐ帰ります。A は通知を終えて番号を見ると 5 になっているので、もう一度全員に通知し、番号が 5 のままなので 6 にして終わります。購読者は最新の 3 を受け取ります。

## ここがすごい

- **通知の嵐を防ぐ**: 10 スレッドが同時に更新しても、全員に 10 回通知するのではなく、通知役が数回まとめて通知するだけで済みます。StateFlow は「最新の値さえ届けばよい」ので、途中の値を飛ばしても問題ありません。
- **奇数・偶数で 2 つの情報を 1 つの数に**: 最下位ビットで「通知中か」、数全体で「何回目の変更か」を表しています。フラグと番号を別々に持つより、ロックの中の処理が単純です。
- **ロックは短く、重い処理は外で**: ロックの中は値の書き換えと番号の更新だけで、購読者への通知はロックの外です。待ち時間が短くなり、デッドロックも防げます。
- **CAS と通常の代入を 1 つの関数で**: `expectedState` が `null` なら代入、そうでなければ CAS。`value` の setter も `compareAndSet` もこの関数を通るので、通知の仕組みが 1 か所にまとまっています。

## まとめ

- 同時に来た要求は、1 人の担当者がまとめて処理すると効率がよい（flat combining）。
- 数の奇偶のように、1 つの値に 2 つの意味を持たせるとロック内の処理を小さくできる。
- ロックの中では最小限のことだけをし、他人のコードを呼ぶ処理はロックの外でやる。
