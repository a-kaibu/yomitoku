---
title: "64 ビットに先頭・末尾・フラグを詰めるビットの区画割り"
description: "待ち行列の状態を 1 つの Long に詰めるための定数とビット操作の関数。先頭・末尾の位置を 30 ビットずつ、凍結と閉鎖を 1 ビットずつに割り当てる。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/internal/LockFreeTaskQueue.kt
lines: [266, 302]
function: "LockFreeTaskQueueCore.Companion (withState / updateHead)"
difficulty: 2
tags: [ビット演算, データ構造, 低レイヤ]
format: 2
---

## ひとことで

`LockFreeTaskQueueCore` の `companion object` には、キューの状態を **1 つの 64 ビット整数（`Long`）に詰め込む** ための定数と関数が集まっています。

先頭の位置（head）、末尾の位置（tail）、凍結フラグ、閉鎖フラグを、それぞれ決まったビットの位置に置きます。`withState` で取り出し、`updateHead` や `updateTail` で一部だけ書き換えた新しい値を作ります。

## コード


::: code-group

```kotlin:line-numbers=266 [日本語訳]
    @Suppress("PrivatePropertyName", "MemberVisibilityCanBePrivate")
    internal companion object {
        const val INITIAL_CAPACITY = 8

        const val CAPACITY_BITS = 30
        const val MAX_CAPACITY_MASK = (1 shl CAPACITY_BITS) - 1
        const val HEAD_SHIFT = 0
        const val HEAD_MASK = MAX_CAPACITY_MASK.toLong() shl HEAD_SHIFT
        const val TAIL_SHIFT = HEAD_SHIFT + CAPACITY_BITS
        const val TAIL_MASK = MAX_CAPACITY_MASK.toLong() shl TAIL_SHIFT

        const val FROZEN_SHIFT = TAIL_SHIFT + CAPACITY_BITS
        const val FROZEN_MASK = 1L shl FROZEN_SHIFT
        const val CLOSED_SHIFT = FROZEN_SHIFT + 1
        const val CLOSED_MASK = 1L shl CLOSED_SHIFT

        const val MIN_ADD_SPIN_CAPACITY = 1024

        @JvmField val REMOVE_FROZEN = Symbol("REMOVE_FROZEN")

        const val ADD_SUCCESS = 0
        const val ADD_FROZEN = 1
        const val ADD_CLOSED = 2

        infix fun Long.wo(other: Long) = this and other.inv()
        fun Long.updateHead(newHead: Int) = (this wo HEAD_MASK) or (newHead.toLong() shl HEAD_SHIFT)
        fun Long.updateTail(newTail: Int) = (this wo TAIL_MASK) or (newTail.toLong() shl TAIL_SHIFT)

        inline fun <T> Long.withState(block: (head: Int, tail: Int) -> T): T {
            val head = ((this and HEAD_MASK) shr HEAD_SHIFT).toInt()
            val tail = ((this and TAIL_MASK) shr TAIL_SHIFT).toInt()
            return block(head, tail)
        }

        // FROZEN | CLOSED（凍結と閉鎖のフラグ）
        fun Long.addFailReason(): Int = if (this and CLOSED_MASK != 0L) ADD_CLOSED else ADD_FROZEN
    }
```

```kotlin:line-numbers=266 [原文]
    @Suppress("PrivatePropertyName", "MemberVisibilityCanBePrivate")
    internal companion object {
        const val INITIAL_CAPACITY = 8

        const val CAPACITY_BITS = 30
        const val MAX_CAPACITY_MASK = (1 shl CAPACITY_BITS) - 1
        const val HEAD_SHIFT = 0
        const val HEAD_MASK = MAX_CAPACITY_MASK.toLong() shl HEAD_SHIFT
        const val TAIL_SHIFT = HEAD_SHIFT + CAPACITY_BITS
        const val TAIL_MASK = MAX_CAPACITY_MASK.toLong() shl TAIL_SHIFT

        const val FROZEN_SHIFT = TAIL_SHIFT + CAPACITY_BITS
        const val FROZEN_MASK = 1L shl FROZEN_SHIFT
        const val CLOSED_SHIFT = FROZEN_SHIFT + 1
        const val CLOSED_MASK = 1L shl CLOSED_SHIFT

        const val MIN_ADD_SPIN_CAPACITY = 1024

        @JvmField val REMOVE_FROZEN = Symbol("REMOVE_FROZEN")

        const val ADD_SUCCESS = 0
        const val ADD_FROZEN = 1
        const val ADD_CLOSED = 2

        infix fun Long.wo(other: Long) = this and other.inv()
        fun Long.updateHead(newHead: Int) = (this wo HEAD_MASK) or (newHead.toLong() shl HEAD_SHIFT)
        fun Long.updateTail(newTail: Int) = (this wo TAIL_MASK) or (newTail.toLong() shl TAIL_SHIFT)

        inline fun <T> Long.withState(block: (head: Int, tail: Int) -> T): T {
            val head = ((this and HEAD_MASK) shr HEAD_SHIFT).toInt()
            val tail = ((this and TAIL_MASK) shr TAIL_SHIFT).toInt()
            return block(head, tail)
        }

        // FROZEN | CLOSED
        fun Long.addFailReason(): Int = if (this and CLOSED_MASK != 0L) ADD_CLOSED else ADD_FROZEN
    }
```

:::

## 前提知識

- **ビット演算**: 整数の各ビット（0 か 1）を個別に扱う演算です。`and` は両方が 1 のビットだけ 1、`or` はどちらかが 1 なら 1、`inv()` は全ビットを反転、`shl` / `shr` はビットを左右にずらします。
- **マスク（mask）**: 「ここのビットだけ見る」ための値です。`HEAD_MASK` は head のビットだけが 1 の値で、`and` でそこだけを取り出せます。
- **`const val`**: コンパイル時に決まる定数です。
- **`companion object`**: クラスに付随する、クラス名で直接使えるオブジェクトです。`LockFreeTaskQueueCore.ADD_SUCCESS` のように使います。
- **`infix fun`**: `a wo b` のように、中置の形で呼べる関数です。
- **`Symbol`**: 名前付きの番兵オブジェクトです。

## 何をしているか

### 1. ビットの区画割り

64 ビットの中を、次のように分けています。

| 項目 | ビットの位置 | 幅 |
| --- | --- | --- |
| head（先頭） | 0〜29 | 30 ビット |
| tail（末尾） | 30〜59 | 30 ビット |
| FROZEN（凍結） | 60 | 1 ビット |
| CLOSED（閉鎖） | 61 | 1 ビット |

head と tail は、どちらも `MAX_CAPACITY_MASK`（`(1 shl 30) - 1`）で切り出せる範囲です。それぞれの位置は、シフト量を定数で決めています。

```kotlin:line-numbers=270
        const val CAPACITY_BITS = 30
        const val MAX_CAPACITY_MASK = (1 shl CAPACITY_BITS) - 1
```

```kotlin:line-numbers=277
        const val FROZEN_SHIFT = TAIL_SHIFT + CAPACITY_BITS
        const val FROZEN_MASK = 1L shl FROZEN_SHIFT
```

### 2. 一部だけを書き換える

`updateHead` は、head の部分だけを消してから新しい値を入れます。`wo`（〜なし）で指定ビットを 0 にしてから `or` で足します。

```kotlin:line-numbers=291
        fun Long.updateHead(newHead: Int) = (this wo HEAD_MASK) or (newHead.toLong() shl HEAD_SHIFT)
```

### 3. 取り出す

`withState` は、head と tail を取り出してブロックに渡します。値を `Int` に変換してから返すので、呼び出す側は普通の整数として扱えます。

```kotlin:line-numbers=294
        inline fun <T> Long.withState(block: (head: Int, tail: Int) -> T): T {
            val head = ((this and HEAD_MASK) shr HEAD_SHIFT).toInt()
            val tail = ((this and TAIL_MASK) shr TAIL_SHIFT).toInt()
            return block(head, tail)
        }
```

## ここがすごい

- **1 回の CAS で全部を更新できる**: head・tail・フラグを 1 つの整数に入れておくと、どれか 1 つを変えるのも全部まとめて確認するのも、原子操作 1 回で済みます。
- **定数で区画を決める**: シフト量とマスクを定数から計算しているので、区画を変えるときは `CAPACITY_BITS` を直すだけです。
- **`inline` で関数呼び出しを省く**: `withState` は `inline` なので、ブロックは呼び出し元に展開され、ラムダのための余分な処理がかかりません。何度も呼ばれる処理なので、この差は効きます。
- **`Symbol` で番兵を作る**: `REMOVE_FROZEN` のような特別な戻り値を、普通の値と区別できる専用のオブジェクトにしています。

## まとめ

- 複数の状態を 1 つの整数に詰めると、まとめて原子操作できる。
- 区画の位置は定数で決め、シフトとマスクを組み合わせて取り出す。
- 頻繁に呼ぶ小さな関数は `inline` にすると、余分なコストを省ける。
