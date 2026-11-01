---
title: "条件が崩れたら即終了する collectWhile の仕組み"
description: "takeWhile などの土台になる内部関数。条件が偽になった瞬間に専用例外を投げて Flow を打ち切り、キャンセルとの取り違えにも備えている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Limit.kt
lines: [122, 140]
function: "Flow.collectWhile"
difficulty: 3
tags: [非同期, エラー処理, 標準ライブラリ]
---

## ひとことで

`collectWhile` は、Flow から値を受け取りながら、**条件 `predicate` が `false` を返した瞬間に収集をやめる** 内部用の関数です。
`takeWhile`（条件を満たす間だけ値を流す）や `first`（最初の 1 個だけ取る）のような「途中で打ち切る」操作の共通部品として使われています。

打ち切りには例外を使い、さらに **「打ち切りの例外」と「キャンセル」を取り違えない** ための一行が入っているのが見どころです。

## コード

```kotlin:line-numbers=122
// Internal building block for non-tailcalling flow-truncating operators
internal suspend inline fun <T> Flow<T>.collectWhile(crossinline predicate: suspend (value: T) -> Boolean) {
    val collector = object : FlowCollector<T> {
        override suspend fun emit(value: T) {
            // Note: we are checking predicate first, then throw. If the predicate does suspend (calls emit, for example)
            // the resulting code is never tail-suspending and produces a state-machine
            if (!predicate(value)) {
                throw AbortFlowException(this)
            }
        }
    }
    try {
        collect(collector)
    } catch (e: AbortFlowException) {
        e.checkOwnership(collector)
        // The task might have been cancelled before AbortFlowException was thrown.
        coroutineContext.ensureActive()
    }
}
```

## 前提知識

- **Flow と `collect`**: Flow は値を順番に流すもので、`collect(collector)` を呼ぶと、流れてきた値ごとに `collector.emit(値)` が呼ばれます。`FlowCollector` は `emit` を 1 つだけ持つインターフェースです。
- **`object : FlowCollector<T> { ... }`**: その場でインターフェースを実装した無名のオブジェクトを 1 個作る書き方（オブジェクト式）です。Java の無名クラスにあたります。
- **`inline` 関数**: 呼び出し元にコードが埋め込まれる関数です。引数のラムダも埋め込まれるので、ラムダのためのオブジェクトが作られません。
- **`crossinline`**: `inline` 関数のラムダを、別のオブジェクトの中（ここでは `emit` の中）から呼ぶときに付ける印です。「このラムダの中で `return` して外の関数ごと抜けることはできません」という約束になります。
- **`suspend`**: 一時停止できる関数の印です。
- **キャンセル**: コルーチン（軽量な並行処理の単位）は外から「もうやめて」と取り消されることがあります。`coroutineContext.ensureActive()` は、自分が取り消されていたら `CancellationException` を投げる関数です。

## 何をしているか

### 1. 条件を見て、だめなら例外を投げる collector を作る（124〜132 行目）

値が来るたびに `predicate(value)` を呼び、`false` なら `AbortFlowException(this)` を投げます。
`this` はこの無名オブジェクト自身です。**collector そのものを「持ち主の印」にしている** ので、別途目印を作る必要がありません。

### 2. 収集して、打ち切りを受け止める（133〜136 行目）

`collect(collector)` で上流から値を受け取り続けます。例外が飛んできたら `checkOwnership(collector)` で自分の collector が投げたものかを確認し、違えば投げ直します。

たとえば `flowOf(1, 2, 5, 3).takeWhile { it < 4 }` なら、

- `1` → 条件 `true`、下流へ流して続行
- `2` → 同上
- `5` → 条件 `false`、例外を投げて終了（`3` は作られもしない）

### 3. キャンセルされていないか最後に確認（137〜138 行目）

打ち切り例外を受け止めたあと、`ensureActive()` を呼んでいます。
コメントにある通り、**打ち切りの直前にコルーチン自体がキャンセルされていた** 可能性があるからです。その場合に何事もなかったように正常終了すると、キャンセルが握りつぶされてしまいます。最後に確認することで、キャンセルは確実に上へ伝わります。

## ここがすごい

- **collector 自身を目印にする**: `take` は `Any()` を別に作っていましたが、ここでは無名オブジェクトの `this` がすでに一意なので、それを流用しています。余計なオブジェクトが 1 つ減ります。
- **`inline` + `crossinline` でラムダのコストを消す**: `predicate` は呼び出し元に埋め込まれるので、`takeWhile` などを使っても関数オブジェクトの呼び出しが増えません。
- **例外とキャンセルの「すり抜け」を防ぐ**: 例外を制御に使うと、本物のエラーやキャンセルと混ざる危険があります。持ち主チェックと `ensureActive()` の二段構えで、**自分の打ち切りだけを正常終了にする** ことを保証しています。
- **コメントで設計の限界も書いてある**: 126〜127 行目には「条件を先に判定してから投げる形なので、`predicate` が中断すると状態機械ができる」と書かれています。だからこそ、速さが要る `take` は別実装にしてあるのです（同じファイルの 54〜57 行目）。

## まとめ

- 途中で打ち切る処理は、共通部品にまとめて「打ち切り例外」で実装できる。
- 一意なオブジェクトが既にあるなら、それをそのまま目印に使える。
- 例外で制御するときは、キャンセルなど本物の中断を隠してしまわないか必ず確認する。
- `inline` と `crossinline` を組み合わせると、ラムダを受け取る関数でも余計なコストがかからない。
