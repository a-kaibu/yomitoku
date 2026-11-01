---
title: "contract で「必ず 1 回だけ呼ぶ」を伝える withLock"
description: "Mutex のロックを取ってブロックを実行し、必ず解放する withLock。try/finally に加え、Kotlin の contract でブロックがちょうど 1 回呼ばれることをコンパイラに教えている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/sync/Mutex.kt
lines: [116, 127]
function: "Mutex.withLock"
difficulty: 2
tags: [並行処理, 非同期, 型システム, イディオム]
---

## ひとことで

`mutex.withLock { ... }` は、コルーチン用のロック `Mutex` を取ってブロックを実行し、**終わったら必ず解放する** 関数です。
ブロックの途中で例外が起きても、`finally` でロックは解放されます。

もう 1 つの工夫が **contract（契約）** です。「このブロックは、この場でちょうど 1 回だけ呼ばれる」とコンパイラに伝えることで、ブロックの中で `val` 変数に値を代入するような書き方が許されるようになります。

## コード

```kotlin:line-numbers=116
@OptIn(ExperimentalContracts::class)
public suspend inline fun <T> Mutex.withLock(owner: Any? = null, action: () -> T): T {
    contract {
        callsInPlace(action, InvocationKind.EXACTLY_ONCE)
    }
    lock(owner)
    return try {
        action()
    } finally {
        unlock(owner)
    }
}
```

## 前提知識

- **`Mutex`**: 同時に 1 つのコルーチンしか入れない区間を作るためのロックです。`lock()` は取れるまで **中断して待ち**（スレッドを止めない）、`unlock()` で解放します。
- **`owner`**: 誰がロックを持っているかを示す任意のオブジェクトです。デバッグや二重ロックの検出に使えます。省略すると `null` です。
- **`suspend inline fun`**: 一時停止でき、しかも呼び出し元に展開される関数です。`action` は普通のラムダ（`suspend` ではない）ですが、`inline` なので中で `suspend` 関数を呼べます。
- **`try { } finally { }`**: 途中で例外が起きても `finally` を必ず実行します。`try` は式なので、`return try { action() } ...` で `action()` の結果を返せます。
- **`contract { callsInPlace(action, InvocationKind.EXACTLY_ONCE) }`**: Kotlin の契約機能です。「`action` はこの関数の中で、ちょうど 1 回呼ばれる」とコンパイラに宣言します。実行時には何もしません。`@OptIn(ExperimentalContracts::class)` は実験的機能を使う宣言です。

## 何をしているか

### 1. 契約を宣言（118〜120 行目）

### 2. ロックを取る（121 行目）

他のコルーチンが持っていれば、解放されるまで中断して待ちます。

### 3. ブロックを実行して、必ず解放（122〜126 行目）

```kotlin
val mutex = Mutex()
var counter = 0
repeat(1000) {
    launch { mutex.withLock { counter++ } }
}
```

1000 個のコルーチンが同時に `counter++` しても、ロックのおかげで 1 つずつ実行され、最後は必ず 1000 になります。

### contract があると何がうれしいか

```kotlin
val result: Int
mutex.withLock { result = compute() }
println(result)
```

契約がないと、コンパイラは「ブロックが呼ばれないかも」「2 回呼ばれるかも」と考え、`val` への代入や、その後の `result` の使用をエラーにします。`EXACTLY_ONCE` の契約があるので、このコードが通ります。

## ここがすごい

- **解放忘れが起きない**: `lock()` と `unlock()` を手で書くと、途中の `return` や例外で解放を忘れがちです。`withLock` にまとめておけば、利用者は解放を意識する必要がありません。
- **`inline` で普通の制御構文のように**: `inline` なので、ブロックの中から外側の関数を `return` で抜けることもできます。また、ラムダのためのオブジェクトも作られません。
- **契約で「言語の組み込み構文」と同じ扱いに**: `if` や `try` の中で `val` を初期化できるのは、コンパイラが「必ず 1 回実行される」と分かっているからです。契約を書くことで、ライブラリの関数も同じ扱いを受けられます。標準ライブラリの `run` や `let` も同じ契約を持っています。
- **ブロック自体は `suspend` ではない**: 引数 `action` は `() -> T` ですが、`inline` で展開されるので、中で `delay` などの `suspend` 関数を呼べます。型をシンプルに保ちつつ、使い勝手を損ねていません。

## まとめ

- ロックの取得と解放は、`try/finally` で包んだ 1 つの関数にまとめると解放漏れがなくなる。
- `contract` で「ちょうど 1 回呼ぶ」と宣言すると、ブロック内での `val` 初期化などが許される。
- `inline` 関数は、引数のラムダを言語の制御構文と同じ感覚で使えるようにする。
