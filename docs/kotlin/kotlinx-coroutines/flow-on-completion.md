---
title: "正常終了と失敗のどちらでも呼ばれる onCompletion"
description: "Flow が終わったときに必ず実行する処理を登録する onCompletion。失敗時は投げるだけの収集者で後始末をし、正常終了時は安全な収集者で実行する。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Emitters.kt
lines: [138, 159]
function: "Flow.onCompletion"
difficulty: 3
tags: [非同期, エラー処理, 設計パターン]
format: 2
---

## ひとことで

`flow.onCompletion { cause -> ... }` は、Flow が **終わったとき** に 1 回だけ処理を実行する演算子です。正常に終わったときは `cause` が `null`、失敗したときは原因の例外が渡ります。

`finally` に似ていますが、Flow では後始末の処理の中で **値を流せる** という違いがあります。そのため、正常終了と失敗で、呼び方を分けています。

## コード


::: code-group

```kotlin:line-numbers=138 [日本語訳]
public fun <T> Flow<T>.onCompletion(
    action: suspend FlowCollector<T>.(cause: Throwable?) -> Unit
): Flow<T> = unsafeFlow { // 注意: ここでは unsafe flow を使うが、完了時のアクションを呼ぶには安全な収集者を使う
    try {
        collect(this)
    } catch (e: Throwable) {
        /*
         * 下流が失敗しているとき、完了の処理から要素が出ないように、投げるだけの収集者を使う。
         * そうしないと、`finally` では表せない、順番どおりでない振る舞いになるおそれがある。
         * 完了の処理で要素が流れると、順番が崩れてしまうためである。
         */
        ThrowingCollector(e).invokeSafely(action, e)
        throw e
    }
    // 正常終了の場合
    val sc = SafeCollector(this, currentCoroutineContext())
    try {
        sc.action(null)
    } finally {
        sc.releaseIntercepted()
    }
}
```

```kotlin:line-numbers=138 [原文]
public fun <T> Flow<T>.onCompletion(
    action: suspend FlowCollector<T>.(cause: Throwable?) -> Unit
): Flow<T> = unsafeFlow { // Note: unsafe flow is used here, but safe collector is used to invoke completion action
    try {
        collect(this)
    } catch (e: Throwable) {
        /*
         * Use throwing collector to prevent any emissions from the
         * completion sequence when downstream has failed, otherwise it may
         * lead to a non-sequential behaviour impossible with `finally`
         */
        ThrowingCollector(e).invokeSafely(action, e)
        throw e
    }
    // Normal completion
    val sc = SafeCollector(this, currentCoroutineContext())
    try {
        sc.action(null)
    } finally {
        sc.releaseIntercepted()
    }
}
```

:::

## 前提知識

- **`Flow` の完了**: Flow は、すべての値を流し終えて正常に終わるか、途中で例外により失敗して終わります。どちらの場合も、`collect` の呼び出しが終わります。
- **`FlowCollector`**: 値を受け取る側（下流）です。`emit` で値を渡します。
- **`unsafeFlow`**: 検査を省いた軽い Flow を作る内部関数です（この記事の範囲外の詳細）。
- **`SafeCollector`**: 中で `emit` が正しいコルーチンから呼ばれているかを検査する収集者です。利用者のブロックを実行するときに使います。
- **`ThrowingCollector`**: `emit` されたら例外を投げる収集者です。ここでは、完了の処理で値を流させないために使います。
- **`invokeSafely`**: 収集者の中で、ブロックを安全に呼ぶための拡張関数です。

## 何をしているか

### 1. 失敗したとき: 投げるだけの収集者で後始末する

上流か下流で例外が起きたら、`catch` で受け取ります。完了の処理は、`ThrowingCollector` を使って呼びます。

```kotlin:line-numbers=149
        ThrowingCollector(e).invokeSafely(action, e)
        throw e
```

完了の処理の中で `emit` が呼ばれると、その時点で例外になります。こうして、失敗した後に値が流れることを防ぎます。終わったあと、元の例外を `throw e` で投げ直します。

### 2. 正常終了のとき: 安全な収集者で完了の処理を呼ぶ

正常に終わった場合は、`SafeCollector` を作って、`cause` に `null` を渡して完了の処理を呼びます。

```kotlin:line-numbers=153
    val sc = SafeCollector(this, currentCoroutineContext())
    try {
        sc.action(null)
    } finally {
        sc.releaseIntercepted()
    }
```

完了の処理が中で `emit` すると、その値は下流へ流れます。`finally` で `releaseIntercepted()` を呼び、後始末をします。

## ここがすごい

- **失敗時と正常時で使う収集者を分ける**: 失敗時は、値を流すと順番が崩れるので、値が流れない収集者を使います。正常時は、値を流してもよいので、安全な収集者で検査しながら呼びます。同じ `onCompletion` の中で、場面ごとに最適な道を選んでいます。
- **`finally` では表せない振る舞い**: `finally` は値を流せません。`onCompletion` は完了の処理で値を流せるので、「最後に 1 つ値を足す」といった使い方ができます。その代わり、失敗時には値が流れないように守っています。
- **元の例外を保つ**: 完了の処理が例外を投げても、最後に `throw e` で元の失敗を投げ直すので、原因が消えません。

## まとめ

- 完了時の処理は、正常終了と失敗で、使う収集者を分けると安全に作れる。
- 失敗時は、後から値を流せないように「投げるだけの収集者」を使う。
- 元の例外は、後始末のあとで投げ直し、原因が消えないようにする。
