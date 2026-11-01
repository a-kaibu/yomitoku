---
title: "セマフォで同時に集める数を制限する flattenMerge の本体"
description: "中の Flow をコルーチンで並行に集めてチャネルに送る flattenMerge の実体。セマフォの許可を取ってから起動し、終わったら finally で返すことで、同時実行数を一定に保つ。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/internal/Merge.kt
lines: [51, 71]
function: "ChannelFlowMerge.collectTo"
difficulty: 2
tags: [非同期, 並行処理, 設計パターン]
---

## ひとことで

`ChannelFlowMerge.collectTo` は、`flattenMerge(concurrency)` や `flatMapMerge` の本体です。「Flow を流す Flow」から中の Flow を 1 つずつ受け取り、それぞれを **別のコルーチンで並行に集めて**、値を 1 本のチャネルに送ります。

同時に動かすのは最大 `concurrency` 本までで、その制限に **セマフォ** を使っています。許可を取ってから起動し、終わったら返す、というシンプルな仕組みです。

## コード

```kotlin:line-numbers=51
    override suspend fun collectTo(scope: ProducerScope<T>) {
        val semaphore = Semaphore(concurrency)
        val collector = SendingCollector(scope)
        val job: Job? = coroutineContext[Job]
        flow.collect { inner ->
            /*
             * We launch a coroutine on each emitted element and the only potential
             * suspension point in this collector is `semaphore.acquire` that rarely suspends,
             * so we manually check for cancellation to propagate it to the upstream in time.
             */
            job?.ensureActive()
            semaphore.acquire()
            scope.launch {
                try {
                    inner.collect(collector)
                } finally {
                    semaphore.release() // Release concurrency permit
                }
            }
        }
    }
```

## 前提知識

- **セマフォ（`Semaphore`）**: 「同時に入れる数」を許可で管理する仕組みです。`acquire()` で許可を 1 つ取り（なければ空くまで中断して待つ）、`release()` で返します。
- **`ProducerScope<T>`**: 値をチャネルに送るためのコルーチンの範囲です。`scope.launch` で子コルーチンを起動できます。
- **`SendingCollector(scope)`**: `emit` された値を、そのままチャネルに `send` する collector です。
- **`coroutineContext[Job]`**: 今のコルーチンの Job を取り出します。`ensureActive()` は、取り消されていたら例外を投げます。
- **`try { } finally { }`**: 途中で例外や取り消しが起きても、`finally` を必ず実行します。
- **`flow.collect { inner -> ... }`**: 外側の Flow から、中の Flow（`inner`）を 1 つずつ受け取ります。

## 何をしているか

### 1. 準備（52〜54 行目）

並行数ぶんの許可を持つセマフォと、チャネルへ送る collector を用意します。

### 2. 中の Flow が来たら、許可を取って起動（55〜70 行目）

並行数 2 で、中の Flow A・B・C が来る場合:

1. A が来る → 許可を取る（残り 1）→ A を集めるコルーチンを起動
2. B が来る → 許可を取る（残り 0）→ B のコルーチンを起動
3. C が来る → 許可がないので `acquire()` で待つ
4. A が終わる → `finally` で許可を返す → C の `acquire()` が成功 → C のコルーチンを起動

外側の Flow の収集そのものが `acquire()` で止まるので、**中の Flow を取り出す速さも自然に抑えられます**。

### 3. 取り消しの確認（61 行目）

外側の Flow が中断せずに次々と値を流す場合でも、取り消しに気づけるよう、毎回確認しています。

## ここがすごい

- **セマフォで同時実行数を制限する定番パターン**: 「許可を取ってから起動、終わったら `finally` で返す」は、並行数の制限をとても簡単に書ける形です。例外や取り消しで終わっても、`finally` のおかげで許可は必ず返されます。
- **背圧（バックプレッシャー）が自然にかかる**: 許可がないときは外側の `collect` が止まるので、中の Flow を作りすぎることがありません。外側の Flow が中の Flow を作るのにコストがかかる場合でも安心です。
- **送り先は共通の collector**: すべての子コルーチンが同じ `SendingCollector` を通してチャネルに送ります。チャネルは複数のコルーチンから同時に送っても安全なので、ロックは要りません。
- **取り消しの見落としを防ぐ**: 56〜60 行目のコメントの通り、外側の Flow が一度も中断しない場合、取り消しを確認する機会がありません。`ensureActive()` を明示的に呼んで、それを補っています。

## まとめ

- 並行数の制限は「セマフォの許可を取ってから起動し、`finally` で返す」で書ける。
- 許可待ちで生産側を止めると、作りすぎを防ぐ背圧が自然にかかる。
- 中断しないループでは、取り消しを自分で確認する。
