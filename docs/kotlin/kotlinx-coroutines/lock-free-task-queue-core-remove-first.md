---
title: "CAS の後でしか null にしないロックフリーな取り出し"
description: "ロックなしの待ち行列から先頭を取り出す関数。値を読み、CAS で先頭を進めてから配列を空ける順番を守ることで、同時に起きる配列のコピーと衝突しないようにしている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/LockFreeTaskQueue.kt
lines: [159, 192]
function: "LockFreeTaskQueueCore.removeFirstOrNull"
difficulty: 3
tags: [並行処理, ロック不要, データ構造]
---

## ひとことで

`removeFirstOrNull` は、ロックを使わない環状配列の待ち行列から、**先頭の要素を 1 つ取り出す** 関数です。空なら `null` を返します。

先頭の位置は、末尾の位置やフラグと一緒に 1 つの 64 ビット整数 `_state` に入っています。値を読み、**CAS で先頭を 1 つ進めることに成功してから**、配列のその場所を `null` に戻す、という順番がこの関数の核心です。

## コード

```kotlin:line-numbers=159
    // REMOVE_FROZEN | null (EMPTY) | E (SUCCESS)
    fun removeFirstOrNull(): Any? {
        _state.loop { state ->
            if (state and FROZEN_MASK != 0L) return REMOVE_FROZEN // frozen -- cannot modify
            state.withState { head, tail ->
                if ((tail and mask) == (head and mask)) return null // empty
                val element = array[head and mask].value
                if (element == null) {
                    // If queue is Single-Consumer, then element == null only when add has not finished yet
                    if (singleConsumer) return null // consider it not added yet
                    // retry (spin) until consumer adds it
                    return@loop
                }
                // element == Placeholder can only be when add has not finished yet
                if (element is Placeholder) return null // consider it not added yet
                // we cannot put null into array here, because copying thread could replace it with Placeholder and that is a disaster
                val newHead = (head + 1) and MAX_CAPACITY_MASK
                if (_state.compareAndSet(state, state.updateHead(newHead))) {
                    // Array could have been copied by another thread and it is perfectly fine, since only elements
                    // between head and tail were copied and there are no extra steps we should take here
                    array[head and mask].value = null // now can safely put null (state was updated)
                    return element // successfully removed in fast-path
                }
                // Multi-Consumer queue must retry this loop on CAS failure (another consumer might have removed element)
                if (!singleConsumer) return@loop
                // Single-consumer queue goes to slow-path for remove in case of interference
                var cur = this
                while (true) {
                    @Suppress("UNUSED_VALUE")
                    cur = cur.removeSlowPath(head, newHead) ?: return element
                }
            }
        }
    }
```

## 前提知識

- **環状配列と `mask`**: 固定長の配列を、末尾まで来たら先頭に戻って使うものです。位置は `index and mask` で配列の範囲に収めます。
- **`_state`**: 先頭（head）・末尾（tail）・凍結フラグなどを詰め込んだ 64 ビット整数です。`withState { head, tail -> }` で取り出し、`updateHead(newHead)` で head だけを書き換えた新しい値を作ります。
- **凍結（frozen）**: 配列が満杯になるなどして、新しい配列へのコピーが始まった状態です。凍結された配列は変更できないので、`REMOVE_FROZEN` を返して外側に乗り換えを頼みます。
- **Placeholder**: 追加の途中（場所は確保したが値はまだ）の要素が、コピー先で仮に置かれる印です。
- **`singleConsumer`**: 取り出すのが 1 スレッドだけと分かっているかどうかです。
- **`return@loop`**: ループのブロックを抜けて、次の繰り返しに進みます（スピンしてやり直す）。

## 何をしているか

### 1. 凍結なら乗り換えを頼む（162 行目）

### 2. 空なら null（164 行目）

head と tail が同じ位置なら空です。

### 3. 先頭の値を読む（165〜173 行目）

- 値がまだ `null` なのは、追加する側が「場所を確保したが、値をまだ書いていない」ときです。取り出す側が 1 つなら「まだ追加されていない」とみなして `null`、複数ならスピンしてやり直します。
- Placeholder も同じく「まだ追加されていない」扱いです。

### 4. CAS で先頭を進めてから、配列を空ける（175〜181 行目）

head を 1 進めた状態に CAS で書き換えられたら、その要素は自分のものです。**そのあとで** 配列の場所を `null` にして、要素を返します。

174 行目のコメントの通り、CAS より先に `null` を書くのは危険です。もしその瞬間に別のスレッドが配列をコピーしていたら、`null` を「追加途中」と誤解して Placeholder に置き換え、取り出したはずの要素が復活してしまうからです。

### 5. CAS に失敗したら（182〜189 行目）

取り出す側が複数なら、他のスレッドが先に取ったので、やり直します。1 つなら、競合の相手は「凍結」しかありえないので、遅い道（`removeSlowPath`）でコピー先の head も進めます。

## ここがすごい

- **書き込みの順番で安全を作る**: 「head を進める（CAS）」→「`null` を書く」という順番を守るだけで、コピー処理との衝突を防いでいます。177〜178 行目のコメントは、CAS 後ならコピーされても問題ない理由まで説明しています。
- **null を「まだ来ていない」と読む**: 追加は「場所確保 → 値書き込み」の 2 段階なので、取り出し側から見ると、確保済みで値がない瞬間があります。それを「まだ追加されていない」と解釈すれば、追加の完了を待たずに済みます。
- **1 人用の最適化**: 取り出すのが 1 スレッドなら、CAS が失敗する理由は限られます。その知識を使って、やり直しのループを省いた専用の道を用意しています。
- **3 種類の戻り値**: `REMOVE_FROZEN`（乗り換えて）、`null`（空）、要素（成功）を `Any?` 1 つで返しています。番兵オブジェクトを使った、ライブラリ内でおなじみのやり方です。

## まとめ

- ロックフリーでは「どの順番で書くか」が安全性を決める。所有権を取ってから片付ける。
- 2 段階の追加は、途中の状態（`null`）を「まだない」と読むことで待たずに済ませられる。
- 「使うスレッドが 1 つ」と分かっていれば、競合の可能性が減り、速い道を作れる。
