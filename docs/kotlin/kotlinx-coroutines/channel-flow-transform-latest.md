---
title: "新しい値が来たら前の変換を止める transformLatest"
description: "上流の値が来るたびに、前の変換をキャンセルしてから新しい変換を始める transformLatest の本体。前の変換が終わるのを待ってから、新しい変換を同じ場所で起動する。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/internal/Merge.kt
lines: [19, 34]
function: "ChannelFlowTransformLatest.flowCollect"
difficulty: 2
tags: [非同期, 並行処理, イディオム]
format: 2
---

## ひとことで

`flow.transformLatest { value -> ... }` は、上流の値が来るたびに **前の変換を取り消して、新しい値の変換だけを続ける** 演算子です。

たとえば、上流が `1`、100 ミリ秒後に `2` を流し、変換が「すぐ `it` を流し、200 ミリ秒後に `it * 10` を流す」ものだとします。`1` の変換は 200 ミリ秒後の出力の前に取り消されるので、結果は `1`、`2`、`20` になります。`1` の `10` は流れません。

`ChannelFlowTransformLatest` はこの動きを、`coroutineScope` の中で「前の変換の `Job` を覚えておき、次の値が来たらそれを取り消して待つ」という形で実装しています。

## コード


::: code-group

```kotlin:line-numbers=19 [日本語訳]
    override suspend fun flowCollect(collector: FlowCollector<R>) {
        assert { collector is SendingCollector } // キャンセルの振る舞いが下流へ漏れないようにするため
        coroutineScope {
            var previousFlow: Job? = null
            flow.collect { value ->
                previousFlow?.apply {
                    cancel(ChildCancelledException())
                    join()
                }
                // ここではディスパッチの費用を払わない。必要がないため
                previousFlow = launch(start = CoroutineStart.UNDISPATCHED) {
                    collector.transform(value)
                }
            }
        }
    }
```

```kotlin:line-numbers=19 [原文]
    override suspend fun flowCollect(collector: FlowCollector<R>) {
        assert { collector is SendingCollector } // So cancellation behaviour is not leaking into the downstream
        coroutineScope {
            var previousFlow: Job? = null
            flow.collect { value ->
                previousFlow?.apply {
                    cancel(ChildCancelledException())
                    join()
                }
                // Do not pay for dispatch here, it's never necessary
                previousFlow = launch(start = CoroutineStart.UNDISPATCHED) {
                    collector.transform(value)
                }
            }
        }
    }
```

:::

## 前提知識

- **`Job` と `cancel`**: コルーチンの取り消しや完了を管理するオブジェクトです。`cancel(...)` で取り消せます。取り消しは協調的で、取り消されたコルーチンは次の中断点で止まります。
- **`join()`**: 対象の `Job` が終わるまで待つ中断関数です。
- **`launch(start = CoroutineStart.UNDISPATCHED)`**: 子コルーチンを起動する方法の 1 つです。ディスパッチ（別のスレッドへの切り替え）をせず、呼び出した場所でそのまま最初の部分を実行します。
- **`ChildCancelledException`**: 親ではなく、子のコルーチンが取り消されたことを表す内部の例外です。
- **`apply`**: 対象のオブジェクトを `this` にして、ブロックを実行する関数です。
- **`assert { ... }`**: 開発時にだけ確かめる条件です。

## 何をしているか

### 1. 前の変換を取り消して、終わるのを待つ

上流の次の値が来たら、前の変換（`previousFlow`）があれば取り消して、終わるまで待ちます。

```kotlin:line-numbers=24
                previousFlow?.apply {
                    cancel(ChildCancelledException())
                    join()
                }
```

待つのは、前の変換が完全に後始末を終えてから次を始めるためです。取り消しの途中の処理が、新しい変換と同時に下流へ出ないようにしています。

### 2. 新しい変換をすぐ起動する

新しい値に対する変換を、`UNDISPATCHED` で起動します。`previousFlow` にその `Job` を入れておけば、次の値が来たときに取り消せます。

```kotlin:line-numbers=29
                previousFlow = launch(start = CoroutineStart.UNDISPATCHED) {
                    collector.transform(value)
                }
```

## ここがすごい

- **前の仕事を捨てる**: 「最新の値だけが大事」という場面（検索窓の入力など）で、古い値の変換を途中で止めて、無駄な処理を省きます。
- **取り消してから待つ**: 単に `cancel` するだけだと、前の変換が後始末をしている途中に新しい変換が始まってしまいます。`join()` で待つことで、順番が保たれます。
- **ディスパッチを省く**: `UNDISPATCHED` の起動は、新しい変換をすぐその場で始めます。ソースのコメントの通り、ここで余計なディスパッチ（別のスレッドへの切り替え）は不要です。
- **外側の範囲で守る**: `coroutineScope` があるので、上流や変換の中で本当に失敗した場合は、全体が正しく取り消されます。

## まとめ

- 「最新の値だけ使う」処理は、前の仕事を取り消してから新しい仕事を始める。
- 取り消しは `join()` で終わりを待つと、順番が崩れない。
- 同じ場所で動く短い処理には、`UNDISPATCHED` を使うと余計な切り替えを省ける。
