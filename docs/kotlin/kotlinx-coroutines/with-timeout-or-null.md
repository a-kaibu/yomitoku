---
title: "入れ子のタイムアウトを取り違えない withTimeoutOrNull"
description: "時間内に終わらなければ null を返す withTimeoutOrNull。捕まえた例外がどのタイムアウトのものかを、例外が持つコルーチンの参照で確かめている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/Timeout.kt
lines: [151, 168]
function: "withTimeoutOrNull"
difficulty: 3
tags: [非同期, エラー処理, 防御的プログラミング]
format: 2
---

## ひとことで

`withTimeoutOrNull(1000) { ... }` は、ブロックが **1 秒以内に終われば結果を、終わらなければ `null` を返す** 関数です。
タイムアウトは内部では `TimeoutCancellationException` という例外で表されます。この関数はその例外を捕まえて `null` に変えるのですが、**捕まえた例外が本当に自分のタイムアウトのものか** を確かめているのがポイントです。

## コード


::: code-group

```kotlin:line-numbers=151 [日本語訳]
public suspend fun <T> withTimeoutOrNull(timeMillis: Long, block: suspend CoroutineScope.() -> T): T? {
    if (timeMillis <= 0L) return null

    var coroutine: TimeoutCoroutine<T?, T?>? = null
    try {
        return suspendCoroutineUninterceptedOrReturn { uCont ->
            val timeoutCoroutine = TimeoutCoroutine(timeMillis, uCont)
            coroutine = timeoutCoroutine
            setupTimeout(timeoutCoroutine, block)
        }
    } catch (e: TimeoutCancellationException) {
        // 自分のタイムアウトの例外なら null を返す。それ以外（入れ子の withTimeout など）は上位へ伝える
        if (e.coroutine === coroutine) {
            return null
        }
        throw e
    }
}
```

```kotlin:line-numbers=151 [原文]
public suspend fun <T> withTimeoutOrNull(timeMillis: Long, block: suspend CoroutineScope.() -> T): T? {
    if (timeMillis <= 0L) return null

    var coroutine: TimeoutCoroutine<T?, T?>? = null
    try {
        return suspendCoroutineUninterceptedOrReturn { uCont ->
            val timeoutCoroutine = TimeoutCoroutine(timeMillis, uCont)
            coroutine = timeoutCoroutine
            setupTimeout(timeoutCoroutine, block)
        }
    } catch (e: TimeoutCancellationException) {
        // Return null if it's our exception, otherwise propagate it upstream (e.g. in case of nested withTimeouts)
        if (e.coroutine === coroutine) {
            return null
        }
        throw e
    }
}
```

:::

## 前提知識

- **タイムアウトと取り消し**: kotlinx.coroutines では、時間切れになるとブロックのコルーチンが取り消され、`TimeoutCancellationException` が投げられます。
- **`suspend CoroutineScope.() -> T`**: 「`CoroutineScope` を `this` にして実行する、一時停止できる関数」の型です。ブロックの中で `launch` などが使えます。
- **`suspendCoroutineUninterceptedOrReturn { uCont -> ... }`**: 低レベルの中断の仕組みです。ブロックが「中断した」という印を返せば中断し、普通の値を返せばそのまま続行します。
- **`TimeoutCoroutine`**: 内部のコルーチンクラスで、ブロックを実行しつつ、時間が来たら自分を取り消します。
- **`setupTimeout(...)`**: タイマーを予約してブロックを開始する内部関数です。
- **`===`**: 同じオブジェクトかどうかを比べます。
- **ローカル変数をラムダから書き換える**: `coroutine` は `var` で、ラムダの中から代入しています。Kotlin では、ラムダは外側の `var` を読み書きできます。

## 何をしているか

### 1. 0 以下なら即 null

```kotlin:line-numbers=152
    if (timeMillis <= 0L) return null
```

待つ時間がないので、ブロックを実行せずに `null` を返します。

### 2. タイムアウト用のコルーチンを作って開始

```kotlin:line-numbers=157
            val timeoutCoroutine = TimeoutCoroutine(timeMillis, uCont)
            coroutine = timeoutCoroutine
            setupTimeout(timeoutCoroutine, block)
```

作った `TimeoutCoroutine` を `coroutine` 変数に覚えておきます。

### 3. タイムアウト例外を捕まえて仕分ける

```kotlin:line-numbers=161
    } catch (e: TimeoutCancellationException) {
        // 自分のタイムアウトの例外なら null を返す。それ以外（入れ子の withTimeout など）は上位へ伝える
        if (e.coroutine === coroutine) {
            return null
        }
        throw e
    }
```

例外が持っている `coroutine` が、さっき覚えたものと **同じオブジェクト** なら、自分のタイムアウトなので `null` を返します。違えば投げ直します。

### 入れ子の例

```kotlin
withTimeout(500) {                 // 外側: 500ms
    withTimeoutOrNull(1000) {      // 内側: 1000ms
        delay(2000)
    }
}
```

500ms で外側の `withTimeout` が時間切れになります。その例外は内側の `withTimeoutOrNull` を通り抜けますが、例外の `coroutine` は外側のものなので、内側はそれを `null` に変えずに投げ直します。もし確かめずに `null` にしていたら、外側のタイムアウトが握りつぶされ、処理が続いてしまいます。

## ここがすごい

- **例外に「発生源」を持たせる**: 同じ種類の例外でも、どこで起きたかを例外自身が知っていれば、受け取る側が見分けられます。Flow の `take` が使っていた「持ち主の印」と同じ考え方です。
- **外側の意図を壊さない**: 外側の時間制限は、内側の処理がどうであれ守られなければいけません。参照の比較 1 回で、それを保証しています。
- **0 以下の特別扱い**: 時間がないのにコルーチンを作ったりタイマーを予約したりするのは無駄なので、最初に返しています。`withTimeout`（例外を投げる版）と挙動をそろえつつ、`null` を返す版らしい結果にしています。
- **低レベル API で余計な層を作らない**: `suspendCoroutineUninterceptedOrReturn` を使い、ブロックがすぐ終わる場合は中断せずに結果を返せるようにしています。

## まとめ

- 同じ種類の例外が入れ子で起こりうるなら、例外に発生源を持たせて、受け取る側で確かめる。
- 自分のものでない例外は、そのまま投げ直す。
- 時間 0 のような境界は、重い準備をする前に処理する。
