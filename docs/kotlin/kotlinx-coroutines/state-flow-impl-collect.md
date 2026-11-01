---
title: "途中の値を飛ばして最新の値だけを届ける StateFlow.collect"
description: "StateFlow を購読するときの本体。待たずに今の値を送り、以後は新しい値が来たときだけ起きる。ディスパッチを待つ間に古くなった値は、最新の値に置き換えて届ける。"
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
tags: [非同期, 並行処理, 状態機械]
format: 2
---

## ひとことで

`stateFlow.collect { ... }` は、StateFlow の **今の値と、その後の新しい値** を、購読者に順番に届ける関数です。値が古くなっていても、それを全部届ける必要はなく、**いつも最新の値に追いつく** ように作られています。

購読者は、新しい値が来るまで眠り、来たら起きて最新の値を流します。値が同じなら、流さずに飛ばします。

## コード


::: code-group

```kotlin:line-numbers=386 [日本語訳]
    override suspend fun collect(collector: FlowCollector<T>): Nothing {
        val slot = allocateSlot()
        try {
            if (collector is SubscribedFlowCollector) collector.onSubscription()
            val collectorJob = currentCoroutineContext()[Job]
            var oldState: Any? = null // 前に流した T!! か NULL（null は、まだ何も流していない）
            // ループは、待たずに今の値を配り始めるように組まれている
            while (true) {
                // ここでコルーチンは、ディスパッチされるまでしばらく待っていたかもしれない。
                // そのため最新の状態を使い、古い値をできるだけ 1 つにまとめる（conflation）
                val newState = _state.value
                // 必ずキャンセルを確かめる
                collectorJob?.ensureActive()
                // 等価性を使って、値の発行をまとめる（conflate）
                if (oldState == null || oldState != newState) {
                    collector.emit(NULL.unbox(newState))
                    oldState = newState
                }
                // 注意: awaitPending がキャンセルされると、このループを抜けて freeSlot を呼ぶ
                if (!slot.takePending()) { // 中断せず、まずは速い道を試す
                    slot.awaitPending() // 新しい値が必要なときだけ中断する
                }
            }
        } finally {
            freeSlot(slot)
        }
    }
```

```kotlin:line-numbers=386 [原文]
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

:::

## 前提知識

- **`StateFlow`**: 今の値を 1 つ持ち、値が変わるたびに購読者へ知らせる Flow です。
- **スロット（slot）**: 購読者 1 人ぶんの連絡用の区画です。`allocateSlot()` で確保し、`freeSlot(slot)` で返します。
- **`takePending()` / `awaitPending()`**: スロットに「新しい値がある」という印があるかを調べ、なければ印が付くまで中断して待つ関数です。
- **`SubscribedFlowCollector`**: 購読が始まったことを知らせるための収集者の型です。
- **`currentCoroutineContext()[Job]`**: 今のコルーチンの Job を取り出します。キャンセルを確かめるために使います。
- **`NULL.unbox(...)`**: 番兵 `NULL` を、本当の `null` に戻す関数です。

## 何をしているか

### 1. 今の最新値を読み、同じでなければ流す

`_state.value` で最新の値を読みます。前に流した値（`oldState`）と同じなら、飛ばします。違えば、下流へ `emit` します。

```kotlin:line-numbers=400
                if (oldState == null || oldState != newState) {
                    collector.emit(NULL.unbox(newState))
```

### 2. 新しい値が来るまで眠る

流し終わったら、新しい値の印（pending）を探します。見つからなければ `awaitPending()` で中断し、印が付くまで眠ります。

```kotlin:line-numbers=405
                if (!slot.takePending()) {
                    slot.awaitPending()
                }
```

先に `takePending()` で速い道を試すのは、印がすでにあれば、中断せずに済むからです。

### 3. 購読を抜けるとき、スロットを返す

キャンセルや例外で抜けるときは、`finally` で必ず `freeSlot` を呼び、スロットを次の購読者に渡せるようにします。

```kotlin:line-numbers=410
            freeSlot(slot)
```

## ここがすごい

- **途中の値を飛ばす（conflation）**: 購読者が遅くても、古い値を全部届けません。起きたときの最新の値だけを流すので、遅い購読者が溜まってしまうことがありません。
- **同じ値は流さない**: 値が変わらなければ `oldState` と比べて飛ばします。StateFlow は「値の変化」を届けるものなので、同じ値を何度も流さないのが正しい振る舞いです。
- **まず速い道、必要なときだけ中断**: 印がすでにあるなら中断せずに進みます。中断は、本当に新しい値がないときだけ行うので、無駄な切り替えを避けられます。
- **キャンセルはすぐ確かめる**: 毎回の処理の前に `ensureActive()` で取り消しを確かめるので、長く流しても、取り消しに素早く反応します。

## まとめ

- 購読者には、途中の値を飛ばして、いつも最新の値を届ける。
- 同じ値は流さず、変化したときだけ流す。
- 新しい値がなければ眠り、印が付いたら起きる。スロットは必ず返す。
