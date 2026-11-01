---
title: "下流の失敗と上流の失敗を見分ける catch の中身"
description: "Flow の catch 演算子の本体。下流で起きた例外を上流の例外と区別し、下流の例外は投げ直し、上流の例外だけを捕まえる。両方失敗したときは上流を優先して下流を抑制する。"
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
tags: [非同期, エラー処理, 設計パターン]
format: 2
---

## ひとことで

`flow.catch { e -> ... }` は、上流で起きた例外を捕まえて、別の値を流したり、別の処理をしたりする演算子です。
しかし、例外が **上流（自分より前）で起きたのか、下流（この `catch` の後ろ）で起きたのか** は、同じ `try` からは区別しにくい問題があります。

`catchImpl` は、下流で起きた例外を **自分が捕まえないように** 印を付けて、上流だけの失敗を正しく捕まえるための仕組みです。

## コード


::: code-group

```kotlin:line-numbers=148 [日本語訳]
// 上流からの例外を返す。なければ null
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
        // 同名の変数を作らないと、スマートキャストができない
        val fromDownstream = fromDownstream
        /*
         * 最初の確認で、演算子が投げ直したものではなく、元の例外を捕まえることを保証する。
         * 2 番目の確認で、キャンセルの原因は無視する。捕まえることができないため。
         */
        if (e.isSameExceptionAs(fromDownstream) || e.isCancellationCause(currentCoroutineContext())) {
            throw e // 下流からの例外と、キャンセルの原因は、そのまま投げ直す
        } else {
            /*
             * 例外は上流から（半ば）独立して来た。
             * 純粋な失敗で下流が正常に動いている場合は、意図どおりに処理する。
             * しかし、下流が上流より先に、または同時に失敗していたら、
             * 文脈の情報を保ち、失われないように、強制的に投げ直す。
             */
            if (fromDownstream == null) {
                return e
            }
            /*
             * 上流と下流の両方が失敗したときは、上流の例外を優先し、下流の例外は抑制する。
             * `finally` ブロックと似た動きだが、
             * 元の下流の例外を抑制された例外に加えるという、便利な追加がある。
             *
             * これは次のような場面で重要になる:
             * ```
             * flow {
             *     val resource = ...
             *     try {
             *         ... emit as well ...
             *     } finally {
             *          resource.close() // collect がすでに例外を投げていると、終了の処理で再び投げられる
             *     }
             * }.catch { } // or retry
             * .collect { ... }
             * ```
             * *下流* が例外を投げたとき。
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

```kotlin:line-numbers=148 [原文]
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

:::

## 前提知識

- **`catch` 演算子**: 上流で例外が起きたとき、その例外を受け取って、別の値を流したり処理をしたりする Flow の演算子です。
- **`collector.emit(it)`**: 下流へ 1 つの値を送ります。下流が例外を投げると、ここで例外になります。
- **`fromDownstream`**: 下流で起きた例外を、後で区別できるように記録しておく変数です。
- **`isSameExceptionAs` / `isCancellationCause`**: 2 つの例外が同じものか、またはキャンセルの原因かを調べる内部の関数です。
- **`addSuppressed`**: 主になる例外に、「ほかにもこの例外が起きていた」という情報を付け加えるメソッドです。
- **`CancellationException`**: コルーチンのキャンセルを表す例外です。キャンセルは、捕まえるものではなく、外へ伝えるものです。

## 何をしているか

### 1. 下流の例外に印を付ける

下流の `emit` が例外を投げたら、その例外を `fromDownstream` に記録してから、そのまま投げ直します。

```kotlin:line-numbers=157
                collector.emit(it)
            } catch (e: Throwable) {
                fromDownstream = e
                throw e
```

記録しておけば、後で `catch` の中で「この例外は下流のものだ」と分かります。

### 2. 下流の例外やキャンセルは、そのまま投げ直す

`e` が下流の例外か、キャンセルの原因なら、捕まえずに投げ直します。`catch` 演算子は、下流の失敗を捕まえてはいけないからです。

```kotlin:line-numbers=170
        if (e.isSameExceptionAs(fromDownstream) || e.isCancellationCause(currentCoroutineContext())) {
```

### 3. 上流だけが失敗していれば、捕まえる

下流が失敗していなければ、`e` は上流の例外です。`return e` で上流の例外を呼び出し元に返し、`catch` の処理に任せます。

```kotlin:line-numbers=179
            if (fromDownstream == null) {
                return e
            }
```

### 4. 両方が失敗したら、上流の例外を優先する

上流と下流の両方が失敗したときは、どちらを投げるかを決めます。`CancellationException` のときは下流の例外を投げ、それ以外は上流の例外を投げて、下流の例外を抑制された例外として付けます。

```kotlin:line-numbers=201
            if (e is CancellationException) {
                fromDownstream.addSuppressed(e)
                throw fromDownstream
            } else {
                e.addSuppressed(fromDownstream)
                throw e
            }
```

## ここがすごい

- **印で出どころを区別する**: 同じ `try` の中で、例外が上流か下流かは、`catch` の中では見分けにくいものです。下流の例外に変数で印を付けておくと、どちらから来たかをはっきり分けられます。
- **下流の失敗を捕まえない**: `catch` 演算子は上流のための仕組みです。下流の失敗まで捕まえると、利用者の処理の失敗が隠れてしまいます。
- **`finally` に似ているが、失われない**: 両方が失敗したとき、普通の `finally` では後から投げた例外が前の例外を隠します。ここでは下流の例外を `addSuppressed` で残すので、原因が消えません。
- **キャンセルを優先する**: キャンセルは、ほかの例外よりも大事な信号です。キャンセルのときは、下流の例外を投げて、キャンセルの流れを止めないようにしています。

## まとめ

- 例外の出どころを区別したいときは、印を付ける変数で記録しておく。
- 下流の失敗は捕まえず、上流の失敗だけを処理する。
- 両方が失敗したら、上流の例外を投げ、下流の例外は抑制された例外として残す。
