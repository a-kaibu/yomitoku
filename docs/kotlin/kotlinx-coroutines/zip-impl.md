---
title: "2 本の Flow を 1 対 1 で組にする zip と、早く終わった側の後始末"
description: "2 つの Flow の値を順番に 1 つずつ組にする zip の本体。片方をチャネルに流し、もう片方を集めながら 1 つずつ受け取り、どちらかが終わったら専用の例外で止める。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/internal/Combine.kt
lines: [82, 139]
function: "zipImpl"
difficulty: 3
tags: [非同期, 並行処理, エラー処理]
format: 2
---

## ひとことで

`flowA.zip(flowB) { a, b -> ... }` は、2 つの Flow の値を **1 番目同士、2 番目同士…と組にして** 流す演算子です。`flowOf(1, 2, 3).zip(flowOf("a", "b")) { n, s -> "$n$s" }` は `"1a"`, `"2b"` を流し、短いほうが終わった時点で止まります。

`zipImpl` は、2 本目の Flow を別のコルーチンでチャネルに流し、1 本目を集めながら **1 個来るたびにチャネルから 1 個受け取って組にする** という形で実装されています。

## コード


::: code-group

```kotlin:line-numbers=82 [日本語訳]
internal fun <T1, T2, R> zipImpl(flow: Flow<T1>, flow2: Flow<T2>, transform: suspend (T1, T2) -> R): Flow<R> =
    unsafeFlow {
        coroutineScope {
            val second = produce<Any> {
                flow2.collect { value ->
                    return@collect channel.send(value ?: NULL)
                }
            }

            /*
             * このやり方は、ランデブー（容量 0）のチャネルでしか正しく動きません。
             * 次のような場面で正しさを守るために必要です。
             * ```
             * val f1 = flow { emit(1); delay(Long.MAX_VALUE) }
             * val f2 = flowOf(1)
             * f1.zip(f2) { ... }
             * ```
             *
             * 不変条件: この節は、チャネルのすべての要素が処理された後にだけ呼ばれる（ランデブーの制約による）。
             */
            val collectJob = Job()
            (second as SendChannel<*>).invokeOnClose {
                // 他方の Flow が終わったとき、AbortFlowException の確保を避ける最適化
                if (collectJob.isActive) collectJob.cancel(AbortFlowException(collectJob))
            }

            try {
                /*
                 * 非自明な、ディスパッチなし（undispatched）の階層です。正しいコンテキストにいて、構造化並行性も使わないので、その場で実行します:
                 * - zip 全体を所有する外側の coroutineScope
                 * - 1 本目の Flow は子の collectJob で集める。
                 *   そのため 2 本目が終わったら、安全にすぐ取り消せる。
                 * - **ただし** 下流は、2 本目が終わっても取り消してはならない。
                 *   そのため下流へは coroutineScope の Job から流す。
                 * 通常、この階層にはチャネルで通信する収集用のコルーチンが必要だが、
                 * それは高すぎるので、この工夫を使っている。
                 * （この工夫で、余計なコルーチンを作らずに済む）
                 *
                 */
                val scopeContext = coroutineContext
                val cnt = threadContextElements(scopeContext)
                withContextUndispatched(coroutineContext + collectJob, Unit) {
                    flow.collect { value ->
                        withContextUndispatched(scopeContext, Unit, cnt) {
                            val otherValue = second.receiveCatching().getOrElse {
                                throw it ?: AbortFlowException(collectJob)
                            }
                            emit(transform(value, NULL.unbox(otherValue)))
                        }
                    }
                }
            } catch (e: AbortFlowException) {
                e.checkOwnership(owner = collectJob)
            } finally {
                second.cancel()
            }
        }
    }
```

```kotlin:line-numbers=82 [原文]
internal fun <T1, T2, R> zipImpl(flow: Flow<T1>, flow2: Flow<T2>, transform: suspend (T1, T2) -> R): Flow<R> =
    unsafeFlow {
        coroutineScope {
            val second = produce<Any> {
                flow2.collect { value ->
                    return@collect channel.send(value ?: NULL)
                }
            }

            /*
             * This approach only works with rendezvous channel and is required to enforce correctness
             * in the following scenario:
             * ```
             * val f1 = flow { emit(1); delay(Long.MAX_VALUE) }
             * val f2 = flowOf(1)
             * f1.zip(f2) { ... }
             * ```
             *
             * Invariant: this clause is invoked only when all elements from the channel were processed (=> rendezvous restriction).
             */
            val collectJob = Job()
            (second as SendChannel<*>).invokeOnClose {
                // Optimization to avoid AFE allocation when the other flow is done
                if (collectJob.isActive) collectJob.cancel(AbortFlowException(collectJob))
            }

            try {
                /*
                 * Non-trivial undispatched (because we are in the right context and there is no structured concurrency)
                 * hierarchy:
                 * -Outer coroutineScope that owns the whole zip process
                 * - First flow is collected by the child of coroutineScope, collectJob.
                 *    So it can be safely cancelled as soon as the second flow is done
                 * - **But** the downstream MUST NOT be cancelled when the second flow is done,
                 *    so we emit to downstream from coroutineScope job.
                 * Typically, such hierarchy requires coroutine for collector that communicates
                 * with coroutines scope via a channel, but it's way too expensive, so
                 * we are using this trick instead.
                 */
                val scopeContext = coroutineContext
                val cnt = threadContextElements(scopeContext)
                withContextUndispatched(coroutineContext + collectJob, Unit) {
                    flow.collect { value ->
                        withContextUndispatched(scopeContext, Unit, cnt) {
                            val otherValue = second.receiveCatching().getOrElse {
                                throw it ?: AbortFlowException(collectJob)
                            }
                            emit(transform(value, NULL.unbox(otherValue)))
                        }
                    }
                }
            } catch (e: AbortFlowException) {
                e.checkOwnership(owner = collectJob)
            } finally {
                second.cancel()
            }
        }
    }
```

:::

## 前提知識

- **Flow とチャネル**: Flow は値を順に流すもの、チャネルはコルーチン間で値を渡す管です。`produce { ... }` は、別コルーチンで値を作ってチャネルに送り、そのチャネルを返します。
- **`coroutineScope { ... }`**: 中で起動した子コルーチンが全部終わるまで待つ範囲を作ります。
- **`Job`**: コルーチンの取り消しや完了を管理するオブジェクトです。`Job()` で独立した Job を作り、`cancel(...)` で取り消せます。
- **`invokeOnClose { ... }`**: チャネルが閉じられたときに呼ばれる処理を登録します。
- **`AbortFlowException`**: Flow の収集を途中で打ち切るための内部の例外です。`checkOwnership` で自分が投げたものかを確かめます。
- **`withContextUndispatched`**: コルーチンのコンテキスト（設定）を切り替えて処理を実行する内部関数です。スレッドの切り替え（ディスパッチ）をせずに、その場で実行します。
- **`NULL` と `unbox`**: `null` をチャネルで送るための番兵と、それを `null` に戻す関数です。

## 何をしているか

### 1. 2 本目をチャネルへ

`flow2` の値を `second` チャネルへ送ります。`null` は `NULL` に置き換えます。

```kotlin:line-numbers=85
            val second = produce<Any> {
                flow2.collect { value ->
                    return@collect channel.send(value ?: NULL)
                }
            }
```

### 2. 2 本目が先に終わったら、1 本目の収集を止める準備

`collectJob` は 1 本目の収集用の Job です。チャネルが閉じられた（2 本目が終わった）ら、この Job を `AbortFlowException` で取り消します。こうすると、1 本目が次の値を作ろうとして待っている途中でも止まります。

```kotlin:line-numbers=105
                if (collectJob.isActive) collectJob.cancel(AbortFlowException(collectJob))
```

### 3. 1 本目を集め、1 個ずつ組にする

1 本目の値が来るたびに、`second` から 1 個受け取り、`transform` で組にして流します。受け取れなかった（2 本目が終わった）なら、例外を投げて打ち切ります。

```kotlin:line-numbers=126
                            val otherValue = second.receiveCatching().getOrElse {
                                throw it ?: AbortFlowException(collectJob)
                            }
                            emit(transform(value, NULL.unbox(otherValue)))
```

`flowOf(1, 2, 3).zip(flowOf("a", "b"))` の場合:

- `1` → `"a"` を受信 → `"1a"`
- `2` → `"b"` を受信 → `"2b"`
- `3` → チャネルは閉じている → 打ち切り

### 4. 後始末

自分の打ち切り例外なら正常終了。最後に必ずチャネルを取り消して、2 本目のコルーチンを止めます。

```kotlin:line-numbers=133
            } catch (e: AbortFlowException) {
                e.checkOwnership(owner = collectJob)
            } finally {
                second.cancel()
            }
```

## ここがすごい

- **非対称な作りで 1 対 1 を実現**: 2 本とも別コルーチンにすると、組にするための待ち合わせが複雑になります。片方だけをチャネルにし、もう片方の `collect` の中で 1 個ずつ受け取れば、自然に 1 対 1 になります。
- **先に終わった側が、もう片方を止める**: 2 本目が終わったのに 1 本目が重い計算で次の値を作り続けるのは無駄です。チャネルの閉鎖をきっかけに 1 本目の Job を取り消すので、すぐ止まります。`invokeOnClose` の中の最適化は、他方が終わったときに例外オブジェクトを余計に作らないためのものです。
- **持ち主チェックで例外を取り違えない**: `AbortFlowException` の持ち主を `collectJob` にしているので、入れ子の `zip` でも自分の打ち切りだけを正常終了にできます。
- **`finally` で必ず片付ける**: どんな終わり方でも、2 本目のコルーチンは `second.cancel()` で止められ、取り残されることはありません。

## まとめ

- 2 つの流れを 1 対 1 で組にするには、片方をチャネルにし、もう片方の収集の中で 1 個ずつ受け取る。
- 早く終わった側の合図で、もう片方の処理を取り消すと無駄がない。
- 起動した子コルーチンは、`finally` で必ず止める。
