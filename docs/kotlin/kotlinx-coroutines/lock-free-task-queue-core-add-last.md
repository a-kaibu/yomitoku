---
title: "先に場所を確保してから値を書くロックフリーな追加"
description: "ロックなしの待ち行列に要素を足す関数。先頭と末尾を 1 つの 64 ビット整数に詰めて CAS で末尾を進め、その後で値を書き込み、コピーとの競合も後から補正する。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/LockFreeTaskQueue.kt
lines: [99, 136]
function: "LockFreeTaskQueueCore.addLast"
difficulty: 3
tags: [並行処理, ロック不要, ビット演算, データ構造]
format: 2
---

## ひとことで

`LockFreeTaskQueueCore.addLast` は、ロックを使わない待ち行列（固定長の環状配列）の **末尾に要素を 1 つ足す** 関数です。

キューの状態（先頭の位置・末尾の位置・凍結フラグ・閉鎖フラグ）は、**1 つの 64 ビット整数 `_state` に詰め込まれて** います。末尾の位置を CAS で 1 つ進めて場所を確保し、そのあとで配列に値を書き込みます。

## コード


::: code-group

```kotlin:line-numbers=99 [日本語訳]
    // ADD_CLOSED | ADD_FROZEN | ADD_SUCCESS（戻り値の種類）
    fun addLast(element: E): Int {
        _state.loop { state ->
            if (state and (FROZEN_MASK or CLOSED_MASK) != 0L) return state.addFailReason() // 追加できない
            state.withState { head, tail ->
                val mask = this.mask // 性能のため、インスタンスのフィールドを手動でローカル変数に移す
                // 消費者が 1 つだけのときは、先頭の先に上書きできない要素が 1 つあるかもしれない
                // そのため、要素 1 つぶんの余裕を加えて満杯かどうかを確かめる
                if ((tail + 2) and mask == head and mask) return ADD_FROZEN // 溢れているので、凍結してコピーする
                // 消費者が複数のときは、上の確認で空きが 1 つあっても、消費者がまだ要素を消していないことがある
                // そのため、ここでも確かめる
                if (!singleConsumer && array[tail and mask].value != null) {
                    // この状況では、方法が 2 つある
                    // 1. 消費者がその場所を消すまで、スピンして待つ
                    // 2. 凍結してサイズを変え、スピンを避ける
                    // ここでは、メモリの使いすぎを避けるための経験則を使う
                    // 配列が小さい、または半分より多く使われているなら、凍結して作り直す
                    if (capacity < MIN_ADD_SPIN_CAPACITY || (tail - head) and MAX_CAPACITY_MASK > capacity shr 1) {
                        return ADD_FROZEN
                    }
                    // それ以外はスピンする
                    return@loop
                }
                val newTail = (tail + 1) and MAX_CAPACITY_MASK
                if (_state.compareAndSet(state, state.updateTail(newTail))) {
                    // 追加に成功した
                    array[tail and mask].value = element
                    // この要素を設定する前に、凍結されてコピーされていたかもしれない。Placeholder を埋めて直す
                    var cur = this
                    while(true) {
                        if (cur._state.value and FROZEN_MASK == 0L) break // 凍結されていなければ問題ない
                        cur = cur.next().fillPlaceholder(tail, element) ?: break
                    }
                    return ADD_SUCCESS // 正しく追加できた
                }
            }
        }
    }
```

```kotlin:line-numbers=99 [原文]
    // ADD_CLOSED | ADD_FROZEN | ADD_SUCCESS
    fun addLast(element: E): Int {
        _state.loop { state ->
            if (state and (FROZEN_MASK or CLOSED_MASK) != 0L) return state.addFailReason() // cannot add
            state.withState { head, tail ->
                val mask = this.mask // manually move instance field to local for performance
                // If queue is Single-Consumer then there could be one element beyond head that we cannot overwrite,
                // so we check for full queue with an extra margin of one element
                if ((tail + 2) and mask == head and mask) return ADD_FROZEN // overfull, so do freeze & copy
                // If queue is Multi-Consumer then the consumer could still have not cleared element
                // despite the above check for one free slot.
                if (!singleConsumer && array[tail and mask].value != null) {
                    // There are two options in this situation
                    // 1. Spin-wait until consumer clears the slot
                    // 2. Freeze & resize to avoid spinning
                    // We use heuristic here to avoid memory-overallocation
                    // Freeze & reallocate when queue is small or more than half of the queue is used
                    if (capacity < MIN_ADD_SPIN_CAPACITY || (tail - head) and MAX_CAPACITY_MASK > capacity shr 1) {
                        return ADD_FROZEN
                    }
                    // otherwise spin
                    return@loop
                }
                val newTail = (tail + 1) and MAX_CAPACITY_MASK
                if (_state.compareAndSet(state, state.updateTail(newTail))) {
                    // successfully added
                    array[tail and mask].value = element
                    // could have been frozen & copied before this item was set -- correct it by filling placeholder
                    var cur = this
                    while(true) {
                        if (cur._state.value and FROZEN_MASK == 0L) break // all fine -- not frozen yet
                        cur = cur.next().fillPlaceholder(tail, element) ?: break
                    }
                    return ADD_SUCCESS // added successfully
                }
            }
        }
    }
```

:::

## 前提知識

- **環状配列（リングバッファ）**: 固定長の配列の末尾まで使ったら、先頭に戻って使い続ける配列です。位置は `index and mask` で配列の範囲に収めます。`mask` は「容量 − 1」で、容量が 2 のべき乗なら `and mask` は `% capacity` と同じ意味になり、しかも速く計算できます。
- **`_state` の中身**: 64 ビットの整数を区切って使っています。下位 30 ビットが先頭（head）、次の 30 ビットが末尾（tail）、その上の 1 ビットずつが凍結（FROZEN）と閉鎖（CLOSED）です。
- **`state.withState { head, tail -> ... }`**: `_state` から head と tail を取り出してブロックに渡す、同じクラスの関数です。
- **`and`、`or`、`shr`**: Kotlin のビット演算子です。`and` は AND、`or` は OR、`shr` は右シフトです。
- **`_state.loop { state -> ... }`**: 今の値を読んでブロックを実行することを繰り返します。`return@loop` はブロックを抜けて次の繰り返しへ進みます。
- **凍結（frozen）**: 満杯などで、この配列をもう変更せず、新しい配列にコピーすることにした状態です。

## 何をしているか

### 1. 満杯なら凍結を頼む

`tail + 2` が `head` に追いついたら満杯とみなし、`ADD_FROZEN` を返して、外側に「大きな配列へ乗り換えて」と伝えます。1 つ余分に空けておくのは、取り出し途中の要素がまだ残っているかもしれないからです。

### 2. 取り出す側が複数なら、席が空いているか確認する

前の周回の要素がまだ消されていなければ、少し待つ（スピン）か、凍結して乗り換えるかを選びます。

```kotlin:line-numbers=110
                if (!singleConsumer && array[tail and mask].value != null) {
```

配列が小さい、または半分以上埋まっていれば乗り換え、そうでなければ待ちます。

### 3. CAS で末尾を進め、値を書く

tail を 1 進めた状態に CAS できれば、`tail` の位置は自分のものです。そこに値を書き込みます。

```kotlin:line-numbers=122
                val newTail = (tail + 1) and MAX_CAPACITY_MASK
                if (_state.compareAndSet(state, state.updateTail(newTail))) {
```

最初の `if` の中で、自分の値を配列に書きます。

```kotlin:line-numbers=125
                    array[tail and mask].value = element
```

### 4. コピーに書き漏れがないか補正する

CAS してから値を書くまでの一瞬に、別のスレッドが配列を凍結してコピーしたかもしれません。その場合、コピー先には自分の値ではなく「ここは書き込み中」という印（Placeholder）が入っています。凍結されていたら、次の配列の印を自分の値で埋めます（`fillPlaceholder`）。

```kotlin:line-numbers=130
                        cur = cur.next().fillPlaceholder(tail, element) ?: break
```

## ここがすごい

- **状態を 1 つの整数に詰める**: head と tail とフラグを別々の変数にすると、複数をまとめて CAS できません。1 つの 64 ビット整数にまとめたことで、「凍結されていない」「満杯でない」を確認しながら tail を進める、という操作が CAS 1 回で済みます。
- **確保と書き込みを分ける**: 「場所を確保する」は CAS で、「値を書く」はそのあと普通に書くだけ。確保さえ不可分なら、書き込みは自分専用の場所なので競合しません。
- **競合は後から直す**: 確保から書き込みまでの隙間にコピーが起きる問題を、「印を置いてもらい、後で埋める」という方法で解決しています。止めて待つのではなく、後から補正するのがロックフリーの考え方です。
- **待つか乗り換えるかを状況で選ぶ**: 小さな配列なら乗り換え、大きな配列なら少し待つ、と使い分けています。メモリを無駄に増やさないための配慮です。

## まとめ

- 複数の状態をまとめて更新したいときは、1 つの整数にビットで詰めて CAS する。
- 「場所の確保」を不可分にすれば、「値の書き込み」は普通の代入でよい。
- ロックフリーでは、競合を止めて防ぐより、後から気づいて直すほうが多い。
