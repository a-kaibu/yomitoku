---
title: "スコープの殻をさかのぼる tailrec と、検査なしの unsafeFlow"
description: "Job の親を、coroutineScope が作る殻の分だけさかのぼる tailrec 関数と、ライブラリ内部用に検査を省いた Flow を 1 つのオブジェクト式で作る unsafeFlow。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/internal/SafeCollector.common.kt
lines: [92, 110]
function: "transitiveCoroutineParent / unsafeFlow"
difficulty: 2
tags: [非同期, 再帰, 最適化]
format: 2
---

## ひとことで

ここには、Flow の内部を支える 2 つの小さな関数があります。

- `transitiveCoroutineParent`: ある Job から親をたどり、`coroutineScope { }` などが作った「殻」をすべて飛ばして、**本当の持ち主の Job** を探す関数です。`emit` が正しいコルーチンから呼ばれているかを確かめるのに使われます。
- `unsafeFlow`: `emit` の検査を省いた、ライブラリ内部用の軽い Flow を作る関数です。

## コード


::: code-group

```kotlin:line-numbers=92 [日本語訳]
internal tailrec fun Job?.transitiveCoroutineParent(collectJob: Job?): Job? {
    if (this === null) return null
    if (this === collectJob) return this
    if (this !is ScopeCoroutine<*>) return this
    return parent.transitiveCoroutineParent(collectJob)
}

/**
 * Flow の結果の実行コンテキストを検査しない、flow ビルダーの類似物。
 * 呼び出し元のコンテキストを信頼できる、ライブラリ自身の演算子で使う。
 */
@PublishedApi
internal inline fun <T> unsafeFlow(crossinline block: suspend FlowCollector<T>.() -> Unit): Flow<T> {
    return object : Flow<T> {
        override suspend fun collect(collector: FlowCollector<T>) {
            collector.block()
        }
    }
}
```

```kotlin:line-numbers=92 [原文]
internal tailrec fun Job?.transitiveCoroutineParent(collectJob: Job?): Job? {
    if (this === null) return null
    if (this === collectJob) return this
    if (this !is ScopeCoroutine<*>) return this
    return parent.transitiveCoroutineParent(collectJob)
}

/**
 * An analogue of the [flow] builder that does not check the context of execution of the resulting flow.
 * Used in our own operators where we trust the context of invocations.
 */
@PublishedApi
internal inline fun <T> unsafeFlow(crossinline block: suspend FlowCollector<T>.() -> Unit): Flow<T> {
    return object : Flow<T> {
        override suspend fun collect(collector: FlowCollector<T>) {
            collector.block()
        }
    }
}
```

:::

## 前提知識

- **Job と親子関係**: コルーチンは親子の木構造を作り、`Job` の `parent` で親をたどれます。
- **`ScopeCoroutine`**: `coroutineScope { }` や `withContext` が内部で作るコルーチンです。新しい「別のコルーチン」ではなく、同じ流れの中の範囲を表します。
- **拡張関数 `Job?.transitiveCoroutineParent(...)`**: `null` かもしれない `Job` に対して呼べる拡張関数です。中では `this` が `null` のこともあります。
- **`tailrec`**: 関数の最後で自分自身を呼ぶ再帰を、コンパイラがループに変換する指定です。
- **`!is`**: 「その型ではない」という型チェックです。
- **`object : Flow<T> { ... }`**: その場でインターフェースを実装した無名オブジェクトを作る式です。
- **`inline` と `crossinline`**: `inline` は呼び出し元にコードを展開します。`crossinline` は、展開されるラムダを別のオブジェクトの中（ここでは `collect` の中）から呼ぶための印です。
- **`suspend FlowCollector<T>.() -> Unit`**: collector を `this` にして実行する、一時停止できる関数です。ブロックの中で `emit(...)` と書けます。

## 何をしているか

### transitiveCoroutineParent: 殻を飛ばす

```kotlin:line-numbers=93
    if (this === null) return null
    if (this === collectJob) return this
    if (this !is ScopeCoroutine<*>) return this
    return parent.transitiveCoroutineParent(collectJob)
```

1. `null` なら `null` を返す。
2. 探している Job そのものなら、それを返す。
3. 殻（`ScopeCoroutine`）でなければ、それが本当の持ち主なので返す。
4. 殻なら、その親で同じことを繰り返す。

`collect` を呼んだコルーチンを J とし、`flow { coroutineScope { coroutineScope { emit(1) } } }` と書いた場合、`emit` 時の Job は「殻 → 殻 → J」とつながっています。2 つの殻を飛ばすと J にたどり着くので、正しいと判定されます。`launch { emit(1) }` なら、`launch` が作った Job は殻ではないので、そこで止まり、J とは違うと判定されます。

### unsafeFlow: 検査なしの Flow

```kotlin:line-numbers=104
internal inline fun <T> unsafeFlow(crossinline block: suspend FlowCollector<T>.() -> Unit): Flow<T> {
    return object : Flow<T> {
        override suspend fun collect(collector: FlowCollector<T>) {
            collector.block()
        }
    }
}
```

`collect` が呼ばれたら、渡された collector を `this` にしてブロックを実行するだけの Flow を作ります。公開版の `flow { }` が使う `SafeCollector` の検査がありません。

## ここがすごい

- **殻だけを飛ばす**: 親を最後までたどるのではなく、`ScopeCoroutine` の間だけさかのぼるので、「同じ流れの中の範囲」と「別のコルーチン」を正確に区別できます。
- **`tailrec` でスタックを消費しない**: 殻が何重になっていても、ループとして動くので安全です。終了条件を先に書き、最後の行で自分を呼ぶだけ、という末尾再帰の典型的な形です。
- **内部用の軽い Flow**: ライブラリ自身が書く演算子は、決まりを守っていることが分かっているので、検査は無駄です。`unsafeFlow` を使うことで、`map` や `filter` などの基本の演算子が軽く動きます。一方、利用者のブロックを実行するときは `SafeCollector` に切り替える、という使い分けがライブラリ全体で行われています。
- **`inline` でもクラスは増える**: `unsafeFlow` は `inline` ですが、中で `object : Flow<T>` を作っているので、呼び出し箇所ごとに無名クラスが作られます。その代わり、ブロックの呼び出しはクラスの中に直接埋め込まれ、ラムダのオブジェクトを介さずに済みます。

## まとめ

- 親をたどるときは、「意味のある境界」まででやめると正しい判定ができる。
- 終了条件を先に書き、最後に自分を呼ぶ形にすれば、`tailrec` でループにできる。
- 安全検査は利用者のコードに対して行い、ライブラリ内部の確実なコードでは省くと速くなる。
