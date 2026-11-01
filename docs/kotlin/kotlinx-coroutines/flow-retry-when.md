---
title: "do-while で Flow をまるごと再実行する retryWhen"
description: "上流で例外が起きたら、条件次第で Flow を最初から集め直す retryWhen。catchImpl と do-while ループの組み合わせだけで再試行を実現している。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Errors.kt
lines: [130, 146]
function: "Flow.retryWhen"
difficulty: 2
tags: [非同期, エラー処理, ネットワーク]
format: 2
---

## ひとことで

`retryWhen { cause, attempt -> ... }` は、Flow の上流で例外が起きたとき、**条件が真なら Flow を最初からもう一度集め直す** 演算子です。
ネットワーク通信が失敗したら 3 回まで、1 秒ずつ待ってやり直す、といったことが書けます。

中身は `do { ... } while (shallRetry)` のループで、例外を「戻り値として受け取る」部品 `catchImpl` と組み合わせることで、驚くほど短くなっています。

## コード

```kotlin:line-numbers=130
public fun <T> Flow<T>.retryWhen(predicate: suspend FlowCollector<T>.(cause: Throwable, attempt: Long) -> Boolean): Flow<T> =
    flow {
        var attempt = 0L
        var shallRetry: Boolean
        do {
            shallRetry = false
            val cause = catchImpl(this)
            if (cause != null) {
                if (predicate(cause, attempt)) {
                    shallRetry = true
                    attempt++
                } else {
                    throw cause
                }
            }
        } while (shallRetry)
    }
```

## 前提知識

- **Flow は何度でも集め直せる**: Flow（`flow { ... }` で作ったもの）は、`collect` を呼ぶたびに最初から実行されます。だから「もう一度 `collect` する」だけで再試行になります。
- **`catchImpl(this)`**: 同じファイルの内部関数で、上流を集めて下流へ流し、**上流で起きた例外を戻り値として返します**（例外がなければ `null`）。下流の例外は投げ直します。
- **`suspend FlowCollector<T>.(cause: Throwable, attempt: Long) -> Boolean`**: 「`FlowCollector` を `this` として、原因の例外と試行回数を受け取り、真偽値を返す、一時停止できる関数」の型です。`this` が下流への出口なので、条件の中で代わりの値を `emit` することもできます。また `delay` を呼んで待つこともできます。
- **`do { } while (条件)`**: 先に 1 回実行してから条件を調べるループです。
- **`0L`**: `Long`（64 ビット整数）型の 0 です。

## 何をしているか

### 1. 試行回数を用意する

```kotlin:line-numbers=132
        var attempt = 0L
        var shallRetry: Boolean
```

`attempt` は何回目の再試行かを数えます。最初は 0 です。

### 2. 集めてみる

```kotlin:line-numbers=134
        do {
            shallRetry = false
            val cause = catchImpl(this)
```

`shallRetry` を毎回 `false` に戻してから、`catchImpl` で上流を集めます。成功すれば `cause` は `null` で、ループを抜けて終わりです。

### 3. 失敗したら、やり直すか決める

```kotlin:line-numbers=137
            if (cause != null) {
                if (predicate(cause, attempt)) {
                    shallRetry = true
                    attempt++
                } else {
                    throw cause
                }
            }
```

`retryWhen { cause, attempt -> attempt < 3 }` の場合:

- 1 回目が失敗 → `attempt = 0`、`0 < 3` なので再試行。`attempt = 1`
- 2 回目が失敗 → `1 < 3` で再試行。`attempt = 2`
- 3 回目が失敗 → `2 < 3` で再試行。`attempt = 3`
- 4 回目が失敗 → `3 < 3` は偽なので、例外をそのまま投げる

## ここがすごい

- **例外を「値」として扱うと制御が楽になる**: `catchImpl` が例外を戻り値で返してくれるので、`retryWhen` は `try/catch` を書かずに、普通の `if` と `while` だけで再試行を組めています。
- **再帰ではなくループ**: 再試行を再帰で書くと、失敗のたびに呼び出しが積み重なり、何百回もやり直すとスタックがあふれます。`do-while` なら何回でも安全です。
- **条件の中で何でもできる**: 条件は `suspend` で、しかも `FlowCollector` が `this` なので、`delay(1000)` で待ってから `true` を返す（バックオフ）、ログを出す、代わりの値を `emit` してから `false` を返す、といったことが条件関数だけで書けます。
- **`retry` はこの関数の特殊版**: 同じファイルの `retry` は、`retryWhen { cause, attempt -> attempt < retries && predicate(cause) }` の 1 行で書かれています。汎用版を 1 つ作っておき、よく使う形を薄い包みで提供する設計です。

## まとめ

- 何度でも集め直せる Flow では、「もう一度 collect する」だけで再試行になる。
- 例外を戻り値で受け取る部品があると、再試行ループが `if` と `while` だけで書ける。
- 再試行は再帰ではなくループで書くと、回数が多くても安全。
