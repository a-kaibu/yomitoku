---
title: "待ち列に並ぶか、許可を直接もらうかを決める acquire"
description: "セマフォの待ち列へ継続（待っている人）を置く関数。空のセルに置けたら待ち、先に許可が置かれていたら、その許可を取って待たずに進む。壊れたセルは別のセルで試し直す。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/sync/Semaphore.kt
lines: [280, 310]
function: "SemaphoreAndMutexImpl.addAcquireToQueue"
difficulty: 3
tags: [並行処理, ロック不要, データ構造]
format: 2
---

## ひとことで

`addAcquireToQueue` は、セマフォ（同時に入れる数を管理する仕組み）で **許可が空いていないときに、待ち列へ並ぶ** 関数です。待ち列は、固定長の区画（セグメント）が連なったもので、各セルに「待っている人」を置きます。

この関数は、列の末尾のセルに待ち人を置こうとします。ただし、解放する側が先に許可（`PERMIT`）を置いていれば、待たずにその許可を取ります。

## コード


::: code-group

```kotlin:line-numbers=280 [日本語訳]
    private fun addAcquireToQueue(waiter: Waiter): Boolean {
        val curTail = this.tail.value
        val enqIdx = enqIdx.getAndIncrement()
        val createNewSegment = ::createSegment
        val segment = this.tail.findSegmentAndMoveForward(id = enqIdx / SEGMENT_SIZE, startFrom = curTail,
            createNewSegment = createNewSegment).segment // 閉じられることはない
        val i = (enqIdx % SEGMENT_SIZE).toInt()
        // 通常の（速い）道。セルが空なら、継続の設置を試みる
        if (segment.cas(i, null, waiter)) { // 継続の設置に成功した
            waiter.invokeOnCancellation(segment, i)
            return true
        }
        // CAS に失敗したときは、セルは PERMIT か BROKEN のどちらか
        // tryResumeNextFromQueue ですでに PERMIT があれば、それを取ろうとする
        if (segment.cas(i, PERMIT, TAKEN)) { // 許可を取った。これで acquire/release の対が消える
            /// この継続はまだ公開されていないが、外側のジョブからキャンセルされることがある
            when (waiter) {
                is CancellableContinuation<*> -> {
                    waiter as CancellableContinuation<Unit>
                    waiter.resume(Unit, onCancellationRelease)
                }
                is SelectInstance<*> -> {
                    waiter.selectInRegistrationPhase(Unit)
                }
                else -> error("unexpected: $waiter")
            }
            return true
        }
        assert { segment.get(i) === BROKEN } // この場合は必ず BROKEN になっている。ほかに方法はない
        return false // 壊れたセル。別のセルでやり直す必要がある
    }
```

```kotlin:line-numbers=280 [原文]
    private fun addAcquireToQueue(waiter: Waiter): Boolean {
        val curTail = this.tail.value
        val enqIdx = enqIdx.getAndIncrement()
        val createNewSegment = ::createSegment
        val segment = this.tail.findSegmentAndMoveForward(id = enqIdx / SEGMENT_SIZE, startFrom = curTail,
            createNewSegment = createNewSegment).segment // cannot be closed
        val i = (enqIdx % SEGMENT_SIZE).toInt()
        // the regular (fast) path -- if the cell is empty, try to install continuation
        if (segment.cas(i, null, waiter)) { // installed continuation successfully
            waiter.invokeOnCancellation(segment, i)
            return true
        }
        // On CAS failure -- the cell must be either PERMIT or BROKEN
        // If the cell already has PERMIT from tryResumeNextFromQueue, try to grab it
        if (segment.cas(i, PERMIT, TAKEN)) { // took permit thus eliminating acquire/release pair
            /// This continuation is not yet published, but still can be cancelled via outer job
            when (waiter) {
                is CancellableContinuation<*> -> {
                    waiter as CancellableContinuation<Unit>
                    waiter.resume(Unit, onCancellationRelease)
                }
                is SelectInstance<*> -> {
                    waiter.selectInRegistrationPhase(Unit)
                }
                else -> error("unexpected: $waiter")
            }
            return true
        }
        assert { segment.get(i) === BROKEN } // it must be broken in this case, no other way around it
        return false // broken cell, need to retry on a different cell
    }
```

:::

## 前提知識

- **セマフォの許可**: 最大数まで同時に入れる仕組みです。入るときに許可を 1 つ取り、出るときに返します。許可がなければ待ちます。
- **セグメント（segment）**: 固定長の区画（セル）の配列で、それが連なって待ち列になっています。`findSegmentAndMoveForward` で、番号に対応するセグメントを探します。
- **`cas(i, 古い値, 新しい値)`**: 区画の `i` 番目のセルを、期待した値のときだけ書き換える不可分な操作です。
- **`Waiter` と `CancellableContinuation`**: 待っているコルーチンを表す型です。`resume` で再開させます。`SelectInstance` は `select` 式で待つ場合の型です。
- **`PERMIT` / `TAKEN` / `BROKEN`**: セルに置かれる印です。`PERMIT` は「許可が先に置かれた」、`TAKEN` は「その許可が取られた」、`BROKEN` は「このセルは使えない」です。
- **`invokeOnCancellation`**: 待ちがキャンセルされたときの後始末を登録する関数です。

## 何をしているか

### 1. 末尾のセルに待ち人を置く

番号（`enqIdx`）を 1 つ取って、そのセルに待ち人（`waiter`）を CAS で置きます。空のセルなら成功し、キャンセル時の後始末を登録して、待つことになります。

```kotlin:line-numbers=282
        val enqIdx = enqIdx.getAndIncrement()
```

```kotlin:line-numbers=289
            waiter.invokeOnCancellation(segment, i)
```

### 2. 先に許可が置かれていたら、取って進む

セルがすでに `PERMIT` になっていれば、解放した側が先に許可を置いたことになります。それを `TAKEN` に変えて取り、待たずに進みます。

```kotlin:line-numbers=296
            when (waiter) {
```

待っている相手が `CancellableContinuation` なら、`resume` で即座に再開させます。`select` の途中なら、登録の段階の処理をします。

### 3. 壊れたセルなら、やり直す

どちらでもなければ、セルは `BROKEN` です。そのセルは使えないので、`false` を返して、呼び出し側に別のセルで試し直してもらいます。

```kotlin:line-numbers=309
        return false
```

## ここがすごい

- **待たずに許可をもらう近道**: 解放が先に起きていた場合、待ち列に入ってから起こされるのは無駄です。許可の印を取れば、列に並ばずに済みます。
- **待つ経路と近道の経路が、同じ区画で競う**: 待ち人を置く CAS と、許可を取る CAS が、同じセルを取り合います。どちらか一方だけが勝つので、食い違いが起きません。
- **壊れたセルは捨てて進む**: 競争に負けたセルを無理に直そうとせず、「やり直し」を呼び出し側に任せます。ロックフリーな仕組みでよく使われる考え方です。
- **許可が取れたら、対を消す**: 「許可を取る」と「許可を返す」の対は、ここで消えます。二重に数えられないよう、`TAKEN` の印で記録しています。

## まとめ

- 待ち列への並びは、空のセルへの CAS で決まる。先に許可があれば、待たずに取る。
- 競争に負けた区画は捨て、呼び出し側にやり直してもらう。
- 待ちと許可の受け渡しを同じ区画で競わせると、ロックなしで整合性を保てる。
