---
title: "終わらない collect と「最新の値だけ届ける」購読ループ"
description: "StateFlow を購読するループ。戻り値の型 Nothing で終わらないことを示し、起きるたびに最新の値を読み、前回と同じなら流さないことで古い値を間引く。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/StateFlow.kt
lines: [386, 412]
function: "StateFlowImpl.collect"
difficulty: 3
tags: [非同期, 並行処理, 型システム]
---

## ひとことで

`StateFlowImpl.collect` は、StateFlow（現在の値を 1 つ持つ Flow）を購読する側のループです。
購読を始めるとまず今の値を流し、その後は **値が変わるたびに最新の値を流し続けます**。StateFlow の購読は終わることがないので、戻り値の型が `Nothing`（決して戻らない）になっているのも特徴です。

## コード

```kotlin:line-numbers=386
    override suspend fun collect(collector: FlowCollector<T>): Nothing {
        val slot = allocateSlot()
        try {
            if (collector is SubscribedFlowCollector) collector.onSubscription()
            val collectorJob = currentCoroutineContext()[Job]
            var oldState: Any? = null // previously emitted T!! | NULL (null -- nothing emitted yet)
            // The loop is arranged so that it starts delivering current value without waiting first
            while (true) {
                // Here the coroutine could have waited for a while to be dispatched,
                // so we use the most recent state here to ensure the best possible conflation of stale values
                val newState = _state.value
                // always check for cancellation
                collectorJob?.ensureActive()
                // Conflate value emissions using equality
                if (oldState == null || oldState != newState) {
                    collector.emit(NULL.unbox(newState))
                    oldState = newState
                }
                // Note: if awaitPending is cancelled, then it bails out of this loop and calls freeSlot
                if (!slot.takePending()) { // try fast-path without suspending first
                    slot.awaitPending() // only suspend for new values when needed
                }
            }
        } finally {
            freeSlot(slot)
        }
    }
```

## 前提知識

- **`Nothing` 型**: 「この関数は正常には戻ってこない」ことを表す特別な型です。無限ループか例外でしか抜けません。コンパイラはこれを知っているので、`collect` のあとに書いたコードは「到達しない」と警告できます。
- **スロット（`slot`）**: 購読者ごとに割り当てられる小さなオブジェクトで、「新しい値が来た」という印を受け取ります。`allocateSlot()` で借り、`freeSlot(slot)` で返します。
- **`takePending()` / `awaitPending()`**: スロットの関数です。前者は眠らずに「印が来ていたか」を確かめ、後者は印が来るまで眠ります。
- **`currentCoroutineContext()[Job]`**: 今のコルーチンの `Job`（取り消しなどを管理するもの）を取り出します。`ensureActive()` は、取り消されていたら例外を投げます。
- **`NULL.unbox(x)`**: 値としての `null` は内部では番兵 `NULL` で保存されているので、流す前に `null` に戻します。
- **`try { } finally { }`**: 例外（取り消しを含む）で抜けても、`finally` を必ず実行します。

## 何をしているか

### 1. スロットを借りる（387〜389 行目）

購読開始時のコールバック（`onSubscription`）があれば呼びます。

### 2. ループ: 最新を読む → 必要なら流す → 待つ（393〜408 行目）

`oldState` は前回流した値です。最初は `null`（まだ何も流していない）です。

1. `_state.value` で **その時点の最新値** を読む（396 行目）
2. 取り消されていないか確認する（398 行目）
3. 前回と違えば流す。`oldState == null` なら初回なので必ず流す（400〜403 行目）
4. 印が来ていなければ眠る（405〜407 行目）

値が `1 → 2 → 3` と素早く変わり、購読者の処理が遅い場合:

- 購読者は `1` を流す。処理している間に値は `2`、`3` と変わる
- 次のループで最新の `3` を読んで流す。`2` は飛ばされる

値が `1 → 1` と同じ値で更新されたら、400 行目の比較で流しません。

### 3. 必ずスロットを返す（409〜411 行目）

取り消しで抜けても、スロットは返却されます。

## ここがすごい

- **「起こされた理由」ではなく「今の値」を見る**: 通知には値を載せず、起きてから最新値を読みに行きます。だから途中の古い値は自然に間引かれ（conflation）、遅い購読者に古い値が溜まりません。394〜395 行目のコメントが、ディスパッチを待つ間に値が変わる可能性まで考えていることを示しています。
- **最初に待たない**: 392 行目のコメントの通り、ループは「流してから待つ」順になっているので、購読直後に今の値がすぐ届きます。
- **`Nothing` で約束を型にする**: StateFlow は完了しない Flow です。戻り値を `Nothing` にすることで、「`collect` の後ろに処理を書いても実行されない」ことを利用者に型で伝えています。
- **`==` による重複排除**: StateFlow は「値が等しければ通知しない」性質を持っています。購読側でも比較しているので、同じ値が二重に流れることはありません。

## まとめ

- 状態の購読は「通知で起きて、最新の値を読みに行く」形にすると、古い値を自然に飛ばせる。
- 終わらない関数は戻り値の型を `Nothing` にすると、その性質を型で伝えられる。
- 借りた資源（スロット）は `finally` で必ず返す。
