---
title: "失敗したときだけ持ち主を確かめる tryLock"
description: "ロックを待たずに取ろうとする tryLock の本体。許可が取れなければ、今のロックの持ち主を調べて、同じ持ち主なら例外、別の持ち主なら失敗、解除されていたらやり直す。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/sync/Mutex.kt
lines: [154, 204]
function: "MutexImpl.tryLockImpl"
difficulty: 3
tags: [並行処理, 状態機械, エラー処理]
format: 2
---

## ひとことで

`tryLock(owner)` は、待たずにミューテックス（同時に 1 人だけが使える鍵）を取ろうとする関数です。取れれば `true`、ほかの人が持っていれば `false` を返します。

ただし、取れなかったときに **「それは、自分がすでに持っている鍵なのか、ほかの人の鍵なのか」** を確かめる必要があります。`tryLockImpl` は、この確かめを、取れなかったあとだけ行います。

## コード


::: code-group

```kotlin:line-numbers=154 [日本語訳]
    private fun holdsLockImpl(owner: Any?): Int {
        while (true) {
            // このミューテックスはロックされているか？
            if (!isLocked) return HOLDS_LOCK_UNLOCKED
            val curOwner = this.owner.value
            // 持ち主が設定されるまで、スピンして待つ
            if (curOwner === NO_OWNER) continue // <-- 注意、ここが待ちになる部分
            // 持ち主を確かめる
            return if (curOwner === owner) HOLDS_LOCK_YES else HOLDS_LOCK_ANOTHER_OWNER
        }
    }

    override suspend fun lock(owner: Any?) {
        if (tryLock(owner)) return
        lockSuspend(owner)
    }

    private suspend fun lockSuspend(owner: Any?) = suspendCancellableCoroutineReusable<Unit> { cont ->
        val contWithOwner = CancellableContinuationWithOwner(cont, owner)
        acquire(contWithOwner)
    }

    override fun tryLock(owner: Any?): Boolean = when (tryLockImpl(owner)) {
        TRY_LOCK_SUCCESS -> true
        TRY_LOCK_FAILED -> false
        TRY_LOCK_ALREADY_LOCKED_BY_OWNER -> error("This mutex is already locked by the specified owner: $owner")
        else -> error("unexpected")
    }

    private fun tryLockImpl(owner: Any?): Int {
        while (true) {
            if (tryAcquire()) {
                assert { this.owner.value === NO_OWNER }
                this.owner.value = owner
                return TRY_LOCK_SUCCESS
            } else {
                // セマフォの許可の取得に失敗した。
                // ただし、このミューテックスが
                // 自分の持ち主によってロックされていないかを確かめる必要がある。
                if (owner == null) return TRY_LOCK_FAILED
                when (holdsLockImpl(owner)) {
                    // このミューテックスは、すでに自分の持ち主にロックされている
                    HOLDS_LOCK_YES -> return TRY_LOCK_ALREADY_LOCKED_BY_OWNER
                    // このミューテックスは別の持ち主にロックされているので、trylock(..) は false を返す
                    HOLDS_LOCK_ANOTHER_OWNER -> return TRY_LOCK_FAILED
                    // このミューテックスはもうロックされていないので、操作をやり直す
                    HOLDS_LOCK_UNLOCKED -> continue
                }
            }
        }
    }
```

```kotlin:line-numbers=154 [原文]
    private fun holdsLockImpl(owner: Any?): Int {
        while (true) {
            // Is this mutex locked?
            if (!isLocked) return HOLDS_LOCK_UNLOCKED
            val curOwner = this.owner.value
            // Wait in a spin-loop until the owner is set
            if (curOwner === NO_OWNER) continue // <-- ATTENTION, BLOCKING PART HERE
            // Check the owner
            return if (curOwner === owner) HOLDS_LOCK_YES else HOLDS_LOCK_ANOTHER_OWNER
        }
    }

    override suspend fun lock(owner: Any?) {
        if (tryLock(owner)) return
        lockSuspend(owner)
    }

    private suspend fun lockSuspend(owner: Any?) = suspendCancellableCoroutineReusable<Unit> { cont ->
        val contWithOwner = CancellableContinuationWithOwner(cont, owner)
        acquire(contWithOwner)
    }

    override fun tryLock(owner: Any?): Boolean = when (tryLockImpl(owner)) {
        TRY_LOCK_SUCCESS -> true
        TRY_LOCK_FAILED -> false
        TRY_LOCK_ALREADY_LOCKED_BY_OWNER -> error("This mutex is already locked by the specified owner: $owner")
        else -> error("unexpected")
    }

    private fun tryLockImpl(owner: Any?): Int {
        while (true) {
            if (tryAcquire()) {
                assert { this.owner.value === NO_OWNER }
                this.owner.value = owner
                return TRY_LOCK_SUCCESS
            } else {
                // The semaphore permit acquisition has failed.
                // However, we need to check that this mutex is not
                // locked by our owner.
                if (owner == null) return TRY_LOCK_FAILED
                when (holdsLockImpl(owner)) {
                    // This mutex is already locked by our owner.
                    HOLDS_LOCK_YES -> return TRY_LOCK_ALREADY_LOCKED_BY_OWNER
                    // This mutex is locked by another owner, `trylock(..)` must return `false`.
                    HOLDS_LOCK_ANOTHER_OWNER -> return TRY_LOCK_FAILED
                    // This mutex is no longer locked, restart the operation.
                    HOLDS_LOCK_UNLOCKED -> continue
                }
            }
        }
    }
```

:::

## 前提知識

- **ミューテックス（Mutex）**: 同時に 1 つのコルーチンだけが入れる鍵です。`lock` で取り、`unlock` で返します。
- **セマフォの許可（permit）**: 同時に入れる数を管理する仕組みです。ミューテックスは、許可 1 つのセマフォとして実装されています。`tryAcquire()` は、待たずに許可を 1 つ取ろうとします。
- **持ち主（owner）**: どのコルーチンがロックを持っているかを表す値です。`null` のときは持ち主を区別しません。
- **`TRY_LOCK_*` と `HOLDS_LOCK_*`**: 結果を表す定数です。前者は `tryLockImpl` の結果、後者は `holdsLockImpl` の結果です。
- **`error(...)`**: 例外を投げる標準の関数です。`tryLock` で同じ持ち主がもう一度ロックしようとしたときに使います。
- **`continue`**: ループの先頭に戻って、もう一度やり直します。

## 何をしているか

### 1. 許可が取れれば、持ち主を書き込んで成功

`tryAcquire()` が成功したら、持ち主の欄に自分の値を書き込み、`TRY_LOCK_SUCCESS` を返します。

```kotlin:line-numbers=185
            if (tryAcquire()) {
                assert { this.owner.value === NO_OWNER }
                this.owner.value = owner
```

### 2. 取れなかったら、持ち主を確かめる

持ち主が `null` なら、区別しようがないので、失敗を返します。持ち主があれば、`holdsLockImpl` で今の持ち主を調べます。

```kotlin:line-numbers=193
                if (owner == null) return TRY_LOCK_FAILED
                when (holdsLockImpl(owner)) {
```

### 3. 結果に応じて、分かれる

- 自分の持ち主がロックしている → 例外を投げる（同じ鍵を 2 回取ろうとしている）。
- ほかの持ち主がロックしている → 失敗を返す。
- もうロックされていない → 最初からやり直す。

```kotlin:line-numbers=196
                    HOLDS_LOCK_YES -> return TRY_LOCK_ALREADY_LOCKED_BY_OWNER
```

### 4. 持ち主を調べる: スピンで待つ場合がある

`holdsLockImpl` は、ロックされているのに持ち主がまだ設定されていないことがあります。`tryAcquire` の直後と、持ち主を書き込む直前の、ほんの一瞬の隙間です。その場合は、持ち主が設定されるまでスピンして待ちます。

```kotlin:line-numbers=160
            if (curOwner === NO_OWNER) continue
```

## ここがすごい

- **確かめるのは、失敗したあとだけ**: 成功する場合の道は、とても短いままです。持ち主を調べるのは、取れなかったときだけなので、普段の処理は軽く動きます。
- **同じ鍵の 2 回取りを、例外で知らせる**: 自分がすでに持っている鍵を `tryLock` しても、`false` ではなく例外になります。「失敗」と「バグ」を区別しています。
- **状態の変化をやり直しで吸収する**: 確かめている間に、誰かが鍵を返すかもしれません。そのときは `continue` で最初からやり直し、古い情報で判断しないようにしています。
- **隙間を待つ**: 「ロックされている」と「持ち主が書かれている」の間には、わずかな隙間があります。その隙間だけスピンで待つことで、正しい持ち主を読めます。

## まとめ

- 鍵を取れなかったときは、誰が持っているかを確かめてから結果を決める。
- 同じ持ち主が 2 回取ろうとした場合は、失敗ではなくバグとして例外にする。
- 状態が変わったら、古い判断を捨ててやり直す。
