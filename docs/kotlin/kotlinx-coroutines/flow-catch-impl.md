---
title: "上流の例外だけを捕まえる catch の見分け方"
description: "Flow の catch 演算子の本体。例外が上流から来たのか、下流から来たのかを覚えておき、下流やキャンセルの例外は捕まえずに投げ直している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Errors.kt
lines: [148, 211]
function: "Flow.catchImpl"
difficulty: 3
tags: [非同期, エラー処理, 防御的プログラミング]
---

## ひとことで

Flow の `catch { ... }` は、**上流**（自分より前の処理）で起きた例外だけを捕まえる演算子です。
`catchImpl` はその本体で、上流の例外なら戻り値として返し、それ以外なら投げ直します。

Flow では上流と下流が同じ呼び出しの入れ子の中で動くため、`try/catch` で囲むと **下流（自分より後ろ）で起きた例外まで捕まえてしまいます**。それを防ぐため、「下流から来た例外」を変数に覚えておいて見分けているのがこの関数の要点です。

## コード

```kotlin:line-numbers=148
// Return exception from upstream or null
@Suppress("NAME_SHADOWING")
internal suspend fun <T> Flow<T>.catchImpl(
    collector: FlowCollector<T>
): Throwable? {
    var fromDownstream: Throwable? = null
    try {
        collect {
            try {
                collector.emit(it)
            } catch (e: Throwable) {
                fromDownstream = e
                throw e
            }
        }
    } catch (e: Throwable) {
        // Otherwise, smartcast is impossible
        val fromDownstream = fromDownstream
        /*
         * First check ensures that we catch an original exception, not one rethrown by an operator.
         * Seconds check ignores cancellation causes, they cannot be caught.
         */
        if (e.isSameExceptionAs(fromDownstream) || e.isCancellationCause(currentCoroutineContext())) {
            throw e // Rethrow exceptions from downstream and cancellation causes
        } else {
            /*
             * The exception came from the upstream [semi-] independently.
             * For pure failures, when the downstream functions normally, we handle the exception as intended.
             * But if the downstream has failed prior to or concurrently
             * with the upstream, we forcefully rethrow it, preserving the contextual information and ensuring  that it's not lost.
             */
            if (fromDownstream == null) {
                return e
            }
            /*
             * We consider the upstream exception as the superseding one when both upstream and downstream
             * fail, suppressing the downstream exception, and operating similarly to `finally` block with
             * the useful addition of adding the original downstream exception to suppressed ones.
             *
             * That's important for the following scenarios:
             * ```
             * flow {
             *     val resource = ...
             *     try {
             *         ... emit as well ...
             *     } finally {
             *          resource.close() // Throws in the shutdown sequence when 'collect' already has thrown an exception
             *     }
             * }.catch { } // or retry
             * .collect { ... }
             * ```
             * when *the downstream* throws.
             */
            if (e is CancellationException) {
                fromDownstream.addSuppressed(e)
                throw fromDownstream
            } else {
                e.addSuppressed(fromDownstream)
                throw e
            }
        }
    }
    return null
}
```

## 前提知識

- **Flow の上流・下流**: `flow.map { }.catch { }.collect { }` なら、`catch` から見て `flow` と `map` が上流、`collect` が下流です。Flow では、上流の `emit(値)` を呼ぶと、その中で下流の処理がそのまま実行されます。つまり **下流の例外も上流の `emit` の中から飛び出してくる** のです。
- **`Throwable`**: Kotlin（JVM）のすべての例外とエラーの親の型です。
- **`try { } catch (e: Throwable) { }`**: 例外を捕まえる構文です。`throw e` で投げ直せます。
- **スマートキャスト**: `if (x != null)` のあと、`x` を `null` でない型として扱える機能です。ただしラムダの中で書き換わる `var` には効きません。165 行目でローカルの `val` にコピーしているのはそのためです（164 行目のコメント）。
- **キャンセル**: コルーチンは外から取り消されることがあり、そのとき `CancellationException` が投げられます。これは「エラー」ではなく「止まって」という合図なので、普通は捕まえてはいけません。
- **`addSuppressed`**: 例外に「この例外の処理中に起きた別の例外」をくっつける JVM の仕組みです。両方の情報を失わずに済みます。

## 何をしているか

### 1. 下流の例外に印を付ける（155〜162 行目）

`collector.emit(it)` を `try` で囲み、ここで例外が起きたら `fromDownstream` に覚えてから投げ直します。`emit` の中は下流の処理なので、**ここで起きた例外は下流のもの** と分かります。

### 2. 外側で受け止めて仕分ける（163〜208 行目）

- 受け止めた例外が下流のものと同じ、またはキャンセルの原因なら、捕まえずに投げ直す（170〜171 行目）。
- 下流に何も起きていなければ、純粋に上流の例外なので、それを返す（179〜181 行目）。呼び出し元の `catch` がこれを受け取ってユーザーの処理に渡します。
- 両方で起きた場合（下流が失敗した後、上流の `finally` の後始末がさらに失敗したなど）は、片方を本命にして、もう片方を `addSuppressed` でくっつけて投げます（201〜207 行目）。

### 3. 例外がなければ null（210 行目）

## ここがすごい

- **「どこで起きたか」を変数 1 つで追跡**: 例外の種類では上流か下流か分かりません。`emit` を `try` で包んで印を付けるという単純な方法で、例外の出どころを正確に見分けています。
- **例外の透過性を守る**: Flow には「下流の例外を上流が勝手に握りつぶしてはいけない」という決まりがあります。これを守らないと、`collect` の中のバグが `catch` に消されてしまいます。
- **キャンセルは捕まえない**: 170 行目でキャンセルの原因を除外しているので、`catch` を挟んでもコルーチンの取り消しは正しく伝わります。
- **2 つの例外を両方残す**: 182〜200 行目のコメントは、リソースの `close()` が後始末中に失敗する具体例を挙げて、なぜ上流の例外を優先し下流の例外を suppressed として残すのかを説明しています。どちらの情報も失わない設計です。

## まとめ

- 呼び出しが入れ子になる仕組みでは、例外の「出どころ」を自分で記録しないと見分けられない。
- 下流の例外やキャンセルは捕まえず、そのまま通すのが Flow の決まり。
- 例外が 2 つ重なったら、`addSuppressed` で片方をもう片方にくっつけて情報を残す。
