---
title: "64 ビットに先頭・末尾・フラグを詰めるビットの区画割り"
description: "ロックなし待ち行列の状態を 1 つの Long に収めるための定数と補助関数。30 ビットずつの区画とフラグのビットを定義し、拡張関数で読み書きを読みやすくしている。"
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
tags: [ビット演算, 並行処理, 可読性]
---

## ひとことで

ロックを使わない待ち行列 `LockFreeTaskQueueCore` は、**先頭の位置・末尾の位置・凍結フラグ・閉鎖フラグ** の 4 つを、1 つの 64 ビット整数（`Long`）に詰めて持っています。こうすると、4 つをまとめて CAS（不可分な書き換え）1 回で更新できるからです。

この `companion object` は、その「区画割り」を定める定数と、区画を読み書きするための補助関数をまとめたものです。

## コード

```kotlin:line-numbers=266
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

## 前提知識

- **`companion object`**: クラスに属する「静的な」メンバーを置く場所です。Java の `static` にあたります。
- **`const val`**: コンパイル時に決まる定数です。
- **ビット演算**: `shl`（左シフト）、`shr`（右シフト）、`and`（AND）、`or`（OR）、`inv()`（全ビット反転）です。Kotlin では記号ではなく名前で書きます。
- **マスク**: 欲しいビットだけ 1 にした値です。`x and MASK` でその部分だけを取り出せます。
- **拡張関数 `fun Long.updateHead(...)`**: `Long` 型に外から関数を生やす書き方です。`state.updateHead(5)` のように呼べます。
- **`infix fun`**: 中置記法で呼べる関数です。`a wo b` のように、演算子のように書けます。
- **`inline fun <T> Long.withState(block: (head: Int, tail: Int) -> T): T`**: head と tail を取り出してブロックに渡す関数です。`inline` なので、ラムダのオブジェクトは作られません。

## 何をしているか

### 1. 区画を定義する（270〜280 行目）

64 ビットを、下から次のように割り当てています。

| ビット | 内容 | 定数 |
| --- | --- | --- |
| 0〜29 | head（30 ビット） | `HEAD_MASK` |
| 30〜59 | tail（30 ビット） | `TAIL_MASK` |
| 60 | 凍結フラグ | `FROZEN_MASK` |
| 61 | 閉鎖フラグ | `CLOSED_MASK` |

`MAX_CAPACITY_MASK = (1 shl 30) - 1` は 30 ビットすべてが 1 の値で、位置の上限です。

### 2. 区画を書き換える（290〜292 行目）

`updateHead(newHead)` は、

1. `this wo HEAD_MASK` で head の区画を 0 にする
2. `newHead` を正しい位置にずらして `or` で入れる

という手順で、他の区画を壊さずに head だけを書き換えます。

### 3. 区画を読む（294〜298 行目）

`withState` は、マスクで区画を取り出し、右にずらして `Int` にしてから、ブロックに渡します。使う側は `state.withState { head, tail -> ... }` と書くだけで、ビット演算を意識せずに済みます。

### 4. 失敗の理由（301 行目）

追加に失敗したとき、閉鎖フラグが立っていれば「閉じている」、そうでなければ「凍結」を返します。

## ここがすごい

- **CAS 1 回で全部を守る**: 「凍結されていない」「満杯でない」を確認しながら tail を進める、という操作は、4 つの値が 1 つの整数に入っているからこそ CAS 1 回で済みます。別々の変数だと、確認と更新の間に他の値が変わってしまいます。
- **定数を積み上げて定義**: `TAIL_SHIFT = HEAD_SHIFT + CAPACITY_BITS` のように、前の区画の位置から次の位置を計算しています。区画の幅を変えたくなっても、`CAPACITY_BITS` を 1 か所変えるだけで済みます。
- **補助関数で読みやすく**: ビット演算を直接書くと、本体のアルゴリズムが読めなくなります。`updateHead`、`withState`、`wo` のような名前付きの関数にしたことで、本体は「head を進める」「head と tail を取り出す」と読めるようになっています。
- **`inline` でコストなし**: `withState` は頻繁に呼ばれますが、`inline` なのでラムダも関数呼び出しも消え、ビット演算そのものと同じ速さで動きます。

## まとめ

- 一緒に更新したい複数の値は、1 つの整数にビットの区画を割り当てて詰める。
- 区画の位置は前の区画から計算して定義すると、変更に強い。
- ビット演算は名前付きの小さな関数に閉じ込めると、本体のアルゴリズムが読みやすくなる。
