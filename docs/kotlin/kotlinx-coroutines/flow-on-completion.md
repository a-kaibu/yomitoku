---
title: "失敗後の emit を封じる ThrowingCollector と onCompletion"
description: "Flow の完了時に処理を実行する onCompletion。失敗したときは emit すると即例外になる collector を渡し、finally と同じ順序の感覚を保っている。"
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
---

## ひとことで

`onCompletion { cause -> ... }` は、Flow が **終わったとき**（正常終了でも、失敗やキャンセルでも）にブロックを実行する演算子です。`cause` には、失敗なら例外、正常終了なら `null` が入ります。
正常終了なら、ブロックの中で `emit("Done")` のように最後の値を追加で流せます。

工夫は失敗時です。下流がもう壊れているのに値を流そうとすると話がおかしくなるので、**`emit` を呼んだ瞬間に元の例外を投げる collector**（`ThrowingCollector`）を渡しています。

## コード

```kotlin:line-numbers=138
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

`ThrowingCollector` と `invokeSafely` は同じファイルの 199〜215 行目にあります。前者は `emit` されると持っている例外 `e` を投げるだけの collector、後者は `action` を実行し、そこで別の例外が起きたら元の例外を suppressed として付けて投げる関数です。

## 前提知識

- **Flow と collector**: Flow は値を順に流すもので、受け取り口が `FlowCollector` です。`emit(値)` を呼ぶと、その値が下流に届きます。
- **`unsafeFlow { ... }`**: 検査を省いた内部用の Flow ビルダーです。ブロックの中の `this` は下流の collector です。
- **`collect(this)`**: 上流の値を、そのまま下流（`this`）へ流す書き方です。中継するだけなので速く動きます。
- **`suspend FlowCollector<T>.(cause: Throwable?) -> Unit`**: 「collector を `this` にして、原因（`null` かもしれない例外）を受け取る、一時停止できる関数」の型です。
- **`SafeCollector`**: 利用者のコードが `emit` するときに、正しい使い方かを検査する collector です。
- **`addSuppressed`**: 例外に、関連する別の例外をくっつける仕組みです。

## 何をしているか

### 1. 上流をそのまま流す（141〜142 行目）

普段は上流の値をそのまま下流へ流します。

### 2. 失敗したら、emit 禁止で action を呼ぶ（143〜151 行目）

上流か下流で例外 `e` が起きたら、`ThrowingCollector(e)` を `this` として `action(e)` を呼びます。
`action` の中で `emit` しようとすると、その場で `e` が投げられます。`action` が終われば、元の例外 `e` を投げ直します。

### 3. 正常終了なら、普通に action を呼ぶ（152〜158 行目）

`SafeCollector` を作って `action(null)` を呼びます。ここでは `emit` が普通に使えるので、`flowOf("a", "b").onCompletion { emit("Done") }` は `a, b, Done` を流します。

## ここがすごい

- **`finally` と同じ感覚を守る**: 144〜148 行目のコメントの通り、失敗後に値が流れると「処理が終わったはずなのに値が届く」という、`try/finally` ではありえない順序になってしまいます。`emit` を封じる collector を渡すだけで、それを防いでいます。
- **禁止を「型を変えずに」実現**: `action` の型は変えず、渡す collector を差し替えるだけで「この状況では `emit` できない」を実現しています。ルールをオブジェクトに持たせる、設計パターンでいう **ヌルオブジェクト** の変形のような発想です。
- **例外の情報を失わない**: `action` の中でさらに例外が起きても、`invokeSafely` が元の例外を suppressed として付けるので、最初の失敗の原因が消えません。
- **場面ごとの collector**: 中継は検査なしで速く、利用者のコードには `SafeCollector`、失敗時には `ThrowingCollector`。同じ `FlowCollector` という型の別実装を使い分けているのがよく分かる例です。

## まとめ

- 完了時の処理は、正常終了と失敗で「できること」を変える必要がある。
- 引数で渡すオブジェクトを差し替えるだけで、利用者のコードの振る舞いを制限できる。
- 後始末中に起きた例外は、元の例外に suppressed として付けて情報を残す。
