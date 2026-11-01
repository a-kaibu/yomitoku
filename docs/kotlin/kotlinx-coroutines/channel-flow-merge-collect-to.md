---
title: "並行数の許可を取ってから子コルーチンを起動する flatMapMerge"
description: "内側の Flow を並行に集めるための collectTo。セマフォで同時に動く数を制限し、各内側 Flow を子コルーチンで流してチャネルに送る。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/internal/Merge.kt
lines: [51, 71]
function: "ChannelFlowMerge.collectTo"
difficulty: 3
tags: [非同期, 並行処理, 防御的プログラミング]
format: 2
---

## ひとことで

`ChannelFlowMerge` は、`flattenMerge(concurrency)` や `flatMapMerge(concurrency)` の実体で、**内側の Flow を最大 `concurrency` 個まで同時に集め** て、その値を 1 本の流れにまとめます。

その中心の `collectTo` は、内側の Flow を 1 つ受け取るたびに **許可（permit）を 1 つ取ってから** コルーチンを起動する、という形で並行数を制限しています。

## コード


::: code-group

```kotlin:line-numbers=51 [日本語訳]
    override suspend fun collectTo(scope: ProducerScope<T>) {
        val semaphore = Semaphore(concurrency)
        val collector = SendingCollector(scope)
        val job: Job? = coroutineContext[Job]
        flow.collect { inner ->
            /*
             * 要素が流れてくるたびにコルーチンを起動する。この収集者で唯一の中断点は `semaphore.acquire` で、めったに中断しない。
             * そのため、キャンセルを上流へ間に合うように伝えるため、ここで手動で確認する。
             *
             */
            job?.ensureActive()
            semaphore.acquire()
            scope.launch {
                try {
                    inner.collect(collector)
                } finally {
                    semaphore.release() // 並行数の許可を返す
                }
            }
        }
    }
```

```kotlin:line-numbers=51 [原文]
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

:::

## 前提知識

- **`Flow<Flow<T>>`**: 「Flow を値として流す Flow」です。内側の Flow を 1 つずつ受け取って、並行に集めます。
- **`Semaphore`（セマフォ）**: 同時に入れる数を決めておき、入るときに `acquire()`、出るときに `release()` する仕組みです。許可がなければ `acquire()` は待ちます。
- **`ProducerScope<T>` と `scope.launch`**: 値をチャネルへ送るコルーチンの範囲です。その中で `launch` した子は、同じ範囲で動きます。
- **`SendingCollector(scope)`**: 受け取った値を、チャネルへ送る収集者です。
- **`ensureActive()`**: 取り消されていれば例外を投げる確認関数です。

## 何をしているか

### 1. 上流の Flow を集め、取り消しを確かめる

内側の Flow が届くたびに、まず親の `Job` が取り消されていないかを確かめます。

```kotlin:line-numbers=61
            job?.ensureActive()
```

コメントにある通り、この収集者の中で唯一の中断点は `semaphore.acquire()` ですが、許可が空いていれば中断しません。だから取り消しを手動で確かめて、上流へ素早く伝えます。

### 2. 許可を取ってから起動する

空きがなければ、ここで待ちます。空きがあれば、許可を 1 つ使って次の処理へ進みます。

```kotlin:line-numbers=62
            semaphore.acquire()
```

### 3. 子コルーチンで内側を流し、終わったら許可を返す

許可を取った内側の Flow を、子コルーチンで流します。終わったら `finally` で必ず許可を返すので、途中で失敗しても許可が漏れません。

```kotlin:line-numbers=63
            scope.launch {
                try {
                    inner.collect(collector)
                } finally {
```

## ここがすごい

- **並行数を 1 つの許可で管理**: 同時に動くコルーチンは、必ず許可を持っているものだけ。`acquire` と `release` が対になっているので、数を超えて起動されることはありません。
- **許可の返し忘れを防ぐ**: `release` を `finally` に置いているので、内側の Flow が失敗しても、キャンセルされても、許可は返ります。
- **中断点を意識して取り消しを補う**: 中断しない場所では取り消しが届きにくいので、`ensureActive()` で手動の確認を入れています。そのコメントは、その理由を説明しています。
- **`flatMapMerge` も同じ道を通る**: `flatMapMerge` は内部で `map(transform).flattenMerge(concurrency)` と書かれているので、この収集処理をそのまま使います。

## まとめ

- 同時に動く数を制限するには、セマフォで許可を取ってから起動し、`finally` で返す。
- 中断しない場所での取り消しは、`ensureActive()` で手動に確かめる。
- 「流れを 1 本にまとめる」処理は、内側ごとに子コルーチンを作って並行に流すと速い。
