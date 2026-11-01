---
title: "行列の席に先に許可が置かれていたら横取りする待ち行列"
description: "セマフォの待ち行列に並ぶ関数。番号を引いて席に座り、もし release が先に許可を置いていたら、それを受け取って待たずに進む「消去」の工夫がある。"
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
---

## ひとことで

`addAcquireToQueue` は、セマフォの許可が足りないときに、**待ち行列に並ぶ** 関数です。
待ち行列は「番号付きの席が並んだ配列」で、並ぶ人は番号札を引いて自分の席に座ります。許可を返す人（`release`）も番号札を引いて、その番号の席にいる人を起こします。

おもしろいのは、**並ぶ人より先に、許可を返す人がその席に来てしまう** 場合です。そのとき席には許可（`PERMIT`）が置かれていて、並ぶ人はそれを受け取って **待たずに進みます**。

## コード

```kotlin:line-numbers=280
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

## 前提知識

- **待ち行列の仕組み**: 待ち行列は、`SEGMENT_SIZE` 個ずつの席を持つ「セグメント」がつながったリストです。`enqIdx`（並ぶ人の番号札）と `deqIdx`（起こす人の番号札）という 2 つのカウンタがあり、それぞれ `getAndIncrement` で番号を引きます。番号 `n` の席は、`n / SEGMENT_SIZE` 番目のセグメントの、`n % SEGMENT_SIZE` 番目です。
- **席の状態**: 空き（`null`）、待っている人（継続オブジェクトなど）、`PERMIT`（許可が置かれた）、`TAKEN`（置かれた許可が受け取られた）、`BROKEN`（使えなくなった）などがあります。状態の移り方は同じファイルの 102〜123 行目に図で描かれています。
- **`segment.cas(i, 期待値, 新しい値)`**: 席 `i` の値が期待どおりなら書き換える不可分な操作です。
- **`findSegmentAndMoveForward`**: 指定した番号のセグメントを探し、なければ作り、末尾の参照を前に進める内部関数です。
- **`Waiter`**: 待つ側を表す型です。普通のコルーチンの継続（`CancellableContinuation`）か、`select` 式の一部（`SelectInstance`）です。
- **`invokeOnCancellation(segment, i)`**: 待っている人が取り消されたときに、その席を片付けるよう登録します。

## 何をしているか

### 1. 番号札を引いて席を探す（281〜286 行目）

### 2. 空き席なら座る（288〜291 行目）

`null` から自分に CAS できれば、並び終わりです。取り消されたときの片付けを登録して `true` を返します。

### 3. 許可が先に置かれていたら受け取る（294〜307 行目）

CAS に失敗したのは、席がもう空きではないからです。`PERMIT` が置かれていれば、それを `TAKEN` に変えて受け取り、待たずに自分を再開します。

### 4. 席が壊れていたら失敗（308〜309 行目）

`release` 側は、席に許可を置いたあと少しだけ待ち、それでも誰も来なければ席を `BROKEN` にして去ります（328〜332 行目）。その席はもう使えないので、`false` を返して呼び出し元にやり直してもらいます。

### 追い越しが起きる例

1. A が `acquire` で許可数を 0 → -1 に減らす（待つことが決まる）
2. A が番号札を引く前に、B が `release` で -1 → 0、番号札 0 を引いて席 0 に `PERMIT` を置く
3. A が番号札 0 を引き、席 0 に行くと `PERMIT` がある → 受け取って待たずに進む

## ここがすごい

- **「消去（elimination）」**: 並ぶ処理と許可を返す処理がすれ違ったとき、席の上で直接許可を受け渡すことで、中断も再開もせずに済ませます。116 行目の図に「ELIMINATION HAPPENED」とある通り、acquire と release のペアがその場で打ち消し合います。
- **番号札で順番を決める**: 並ぶ人と起こす人が、それぞれ番号札を `getAndIncrement` で引くだけで、どの席で会うかが決まります。ロックなしで公平な順番（先に並んだ人から起こす）が保たれます。
- **待ちすぎない**: `release` 側が少し待っても相手が来なければ席を壊して去る、という仕組みにより、どちらかが永遠に待つことはありません。壊れた席に来た人はやり直すだけです。
- **状態遷移を図にしている**: 102〜123 行目の ASCII 図は、席が取りうる状態と遷移を一目で示しています。ロックなしのアルゴリズムは状態の把握が肝心なので、こうした図は理解の大きな助けになります。

## まとめ

- 待ち行列を「番号札と席」で作ると、ロックなしで順番を決められる。
- すれ違った処理同士は、席の上で直接受け渡すと中断のコストを省ける（消去）。
- 相手を待つ時間には上限を設け、来なければ「壊れた」印を残して、相手にやり直してもらう。
