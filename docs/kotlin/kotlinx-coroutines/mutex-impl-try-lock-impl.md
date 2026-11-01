---
title: "「自分がもう持っている」を見抜く Mutex の tryLock"
description: "Mutex のロックを待たずに試す tryLockImpl と、持ち主を確認する holdsLockImpl。失敗したとき、相手が自分自身かを確かめて二重ロックを例外にしている。"
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
tags: [並行処理, 防御的プログラミング, ロック不要]
---

## ひとことで

`tryLockImpl(owner)` は、Mutex（コルーチン用のロック）を **待たずに取れるか試す** 関数です。取れれば成功、取れなければ失敗を返します。
ただし失敗にも 2 種類あり、**「他人が持っている」のか「自分（同じ owner）がもう持っている」のか** を見分けます。後者は、同じロックを 2 回取ろうとしている（Mutex は再入不可なので必ずデッドロックする）誤りなので、例外にするために区別しています。

その判定に使うのが、すぐ上の `holdsLockImpl` です。

## コード

```kotlin:line-numbers=154
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

`HOLDS_LOCK_*` と `TRY_LOCK_*` はファイル末尾で定義されている整数の定数です。

## 前提知識

- **Mutex とセマフォ**: このライブラリの Mutex は、「許可が 1 つのセマフォ」に「持ち主（owner）の記録」を足したものです。`tryAcquire()` はセマフォの許可を待たずに取ろうとする関数です。
- **`owner`**: ロックを持っている人を表す任意のオブジェクトです。`null` なら「持ち主を指定しない」です。
- **`NO_OWNER`**: 「持ち主が記録されていない」ことを表す番兵です。
- **再入不可（non-reentrant）**: 同じ人が同じロックを 2 回続けて取ろうとすると、自分の解放を自分で待つことになり、永遠に止まってしまう性質です。
- **`when (式) { 値 -> ... }`**: 式の値で分岐します。
- **`continue`**: ループの先頭に戻ります。
- **定数で結果を返す**: `Boolean` では 2 種類しか表せないので、3 種類以上の結果を整数の定数で返しています。

## 何をしているか

### holdsLockImpl（154〜164 行目）

1. ロックされていなければ「誰も持っていない」（157 行目）。
2. 持ち主を読む。まだ `NO_OWNER`（許可は取られたが持ち主が書かれる前）なら、書かれるまでループで待つ（160 行目）。
3. 持ち主が引数と同じなら「自分が持っている」、違えば「他人が持っている」。

### tryLockImpl（183〜204 行目）

1. 許可が取れたら、持ち主を書き込んで成功（185〜188 行目）。
2. 取れなかったとき、`owner` が `null` なら、誰が持っているか確かめようがないので単に失敗（193 行目）。
3. `owner` があれば `holdsLockImpl` で確認:
   - 自分が持っている → 「すでに自分が持っている」を返す（`tryLock` はこれを例外にする）
   - 他人が持っている → 失敗
   - その間に解放された → もう一度最初から試す（200 行目）

```kotlin
val me = Any()
mutex.tryLock(me)  // true
mutex.tryLock(me)  // 例外: already locked by the specified owner
```

## ここがすごい

- **デッドロックを例外に変える**: 再入不可のロックを同じ持ち主が 2 回取ろうとするのは、確実に止まるバグです。持ち主を記録しておけば、止まる前にその場で例外にできます。並行処理のバグとしては、とても親切な検出です。
- **状況が変わったらやり直す**: 許可が取れなかったのに、確認しようとしたら解放されていた、という競合は普通に起こります。そのときは `continue` で最初からやり直すだけで、正しく扱えます。
- **結果を 3 種類以上に分ける**: 成功・失敗だけでなく「自分がもう持っている」を区別するため、整数の定数を返す内部関数（`tryLockImpl`）と、それを `Boolean` や例外に変換する公開関数（176〜181 行目の `tryLock`）を分けています。内部で詳しく、外にはシンプルに、という設計です。
- **確認の手間は `owner` を指定したときだけ**: `owner` が `null`（よくある使い方）なら、余計な確認をせずにすぐ失敗を返します。

## まとめ

- ロックに持ち主を記録しておくと、二重取得によるデッドロックを検出できる。
- 競合で状態が変わったら、最初からやり直すループで扱う。
- 内部関数は詳しい結果を返し、公開関数でシンプルな形に変換すると、両方の使いやすさが得られる。
