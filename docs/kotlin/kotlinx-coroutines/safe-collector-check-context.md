---
title: "emit が別のコルーチンから呼ばれていないかを確かめる checkContext"
description: "Flow の emit が正しいコルーチンから呼ばれているかを確かめる関数。各コンテキスト要素を収集時と比べ、Job の親子をさかのぼって、別のコルーチンからの emit を見つけて例外にする。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/internal/SafeCollector.common.kt
lines: [22, 90]
function: "SafeCollector.checkContext"
difficulty: 3
tags: [並行処理, エラー処理, 防御的プログラミング]
format: 2
---

## ひとことで

Flow の `emit` は、**値を流すコルーチンを 1 つに決めておく** という約束があります。`coroutineScope { launch { emit(1) }; launch { emit(2) } }` のように、子のコルーチンから同時に `emit` すると、約束が破られます。

`checkContext` は、`emit` のたびに「今のコンテキストが、`collect` したときのものと同じ流れか」を確かめる関数です。違っていれば、わかりやすいエラーを投げます。

## コード


::: code-group

```kotlin:line-numbers=22 [日本語訳]
@JvmName("checkContext") // スタックトレースを見やすくするため
internal fun SafeCollector<*>.checkContext(currentContext: CoroutineContext) {
    val result = currentContext.fold(0) fold@{ count, element ->
        val key = element.key
        val collectElement = collectContext[key]
        if (key !== Job) {
            return@fold if (element !== collectElement) Int.MIN_VALUE
            else count + 1
        }

        val collectJob = collectElement as Job?
        val emissionParentJob = (element as Job).transitiveCoroutineParent(collectJob)
        /*
         * 次のようなコードは禁止されている。'emit' はデフォルトではスレッドセーフではないため。
         * ```
         * coroutineScope {
         *     launch {
         *         emit(1)
         *     }
         *
         *     launch {
         *         emit(2)
         *     }
         * }
         * ```
         * 並行して emit する必要があるなら 'channelFlow' を使う。
         * （または、`withContext` などでコンテキストを動的に切り替えたい場合）
         *
         * 別のコルーチンから収集することは許される。たとえば:
         * ```
         * coroutineScope {
         *     val channel = produce {
         *         collect { value ->
         *             send(value)
         *         }
         *     }
         *     channel.consumeEach { value ->
         *         emit(value)
         *     }
         * }
         * ```
         * は、まったく正しい書き方である。
         */
        if (emissionParentJob !== collectJob) {
            error(
                "Flow invariant is violated:\n" +
                        "\t\tEmission from another coroutine is detected.\n" +
                        "\t\tChild of $emissionParentJob, expected child of $collectJob.\n" +
                        "\t\tFlowCollector is not thread-safe and concurrent emissions are prohibited.\n" +
                        "\t\tTo mitigate this restriction please use 'channelFlow' builder instead of 'flow'"
            )
        }

        /*
         * collectJob が null（EmptyCoroutineContext、たとえば `suspend fun main` から実行された場合）なら、不変条件は保たれる
         * （共通の親は「null」になる）。しかし、個数の確認が失敗するので、
         * EmptyCoroutineContext から収集された Flow では Job の要素を数えないようにする
         */
        if (collectJob == null) count else count + 1
    }
    if (result != collectContextSize) {
        error(
            "Flow invariant is violated:\n" +
                    "\t\tFlow was collected in $collectContext,\n" +
                    "\t\tbut emission happened in $currentContext.\n" +
                    "\t\tPlease refer to 'flow' documentation or use 'flowOn' instead"
        )
    }
}
```

```kotlin:line-numbers=22 [原文]
@JvmName("checkContext") // For prettier stack traces
internal fun SafeCollector<*>.checkContext(currentContext: CoroutineContext) {
    val result = currentContext.fold(0) fold@{ count, element ->
        val key = element.key
        val collectElement = collectContext[key]
        if (key !== Job) {
            return@fold if (element !== collectElement) Int.MIN_VALUE
            else count + 1
        }

        val collectJob = collectElement as Job?
        val emissionParentJob = (element as Job).transitiveCoroutineParent(collectJob)
        /*
         * Code like
         * ```
         * coroutineScope {
         *     launch {
         *         emit(1)
         *     }
         *
         *     launch {
         *         emit(2)
         *     }
         * }
         * ```
         * is prohibited because 'emit' is not thread-safe by default. Use 'channelFlow' instead if you need concurrent emission
         * or want to switch context dynamically (e.g. with `withContext`).
         *
         * Note that collecting from another coroutine is allowed, e.g.:
         * ```
         * coroutineScope {
         *     val channel = produce {
         *         collect { value ->
         *             send(value)
         *         }
         *     }
         *     channel.consumeEach { value ->
         *         emit(value)
         *     }
         * }
         * ```
         * is a completely valid.
         */
        if (emissionParentJob !== collectJob) {
            error(
                "Flow invariant is violated:\n" +
                        "\t\tEmission from another coroutine is detected.\n" +
                        "\t\tChild of $emissionParentJob, expected child of $collectJob.\n" +
                        "\t\tFlowCollector is not thread-safe and concurrent emissions are prohibited.\n" +
                        "\t\tTo mitigate this restriction please use 'channelFlow' builder instead of 'flow'"
            )
        }

        /*
         * If collect job is null (-> EmptyCoroutineContext, probably run from `suspend fun main`), then invariant is maintained
         * (common transitive parent is "null"), but count check will fail, so just do not count job context element when
         * flow is collected from EmptyCoroutineContext
         */
        if (collectJob == null) count else count + 1
    }
    if (result != collectContextSize) {
        error(
            "Flow invariant is violated:\n" +
                    "\t\tFlow was collected in $collectContext,\n" +
                    "\t\tbut emission happened in $currentContext.\n" +
                    "\t\tPlease refer to 'flow' documentation or use 'flowOn' instead"
        )
    }
}
```

:::

## 前提知識

- **`CoroutineContext`**: コルーチンの設定の集まりです。Job（取り消しの管理）、ディスパッチャ（どのスレッドで動かすか）などの要素を持ちます。`fold` で全要素を順に畳み込めます。
- **`Job` の親子関係**: `launch` や `coroutineScope` で作られたコルーチンは、親の Job を持ちます。`transitiveCoroutineParent` は、「殻」（`coroutineScope` などが作る範囲）を飛ばして、本当の持ち主をたどります。
- **`collectContext`**: 収集を始めたときのコンテキストです。`emit` のときのコンテキストと比べます。
- **`fold(0) { count, element -> ... }`**: 初期値 0 から、各要素を順に畳み込む関数です。`return@fold` で、その要素の処理だけを抜けます。
- **`SafeCollector`**: `emit` が約束を守っているかを検査する収集者です。

## 何をしているか

### 1. 要素ごとに、収集時と同じかを確かめる

`Job` 以外の要素は、収集時のものと同じオブジェクトかを比べます。違えば `Int.MIN_VALUE` を返し、最後の比較で失敗します。

```kotlin:line-numbers=26
        val collectElement = collectContext[key]
```

### 2. Job は親子関係をさかのぼって確かめる

`Job` の要素は、`transitiveCoroutineParent` で「殻」を飛ばした持ち主を求めます。その持ち主が、収集を始めた Job と同じでなければ、ほかのコルーチンからの `emit` です。

```kotlin:line-numbers=33
        val emissionParentJob = (element as Job).transitiveCoroutineParent(collectJob)
```

```kotlin:line-numbers=65
        if (emissionParentJob !== collectJob) {
```

ここで例外を投げるので、`launch` の中から `emit` した場合は、すぐに分かります。エラーメッセージは、`channelFlow` を使うよう案内しています。

### 3. 最後に、要素の個数を比べる

すべての要素を数えた結果が、収集時の要素の個数と一致するかを確かめます。違えば、コンテキストが途中で変わっているということなので、`flowOn` の使用を案内します。

```kotlin:line-numbers=82
    if (result != collectContextSize) {
```

## ここがすごい

- **禁止を実行時に確かめる**: 「並行して `emit` しない」という約束は、型だけでは守れません。実行時に親子関係を確かめることで、違反をすぐ見つけられます。
- **許される形も正しく区別する**: 別のコルーチンから `collect` して、その値を `emit` する形は正しい書き方です。親の Job が同じなので、検査を通ります。
- **殻を飛ばして判定する**: `coroutineScope` の中で `emit` するのは正しいので、殻を飛ばしてから比べます。こうしないと、正しい使い方まで誤りになってしまいます。
- **わかりやすいエラー**: 例外のメッセージに、代わりに使うべき `channelFlow` や `flowOn` を書いています。エラーを見た人が、次に何をすればよいか分かるようになっています。

## まとめ

- 「値を流すコルーチンは 1 つ」という約束は、実行時に親子関係を確かめて守る。
- 殻を飛ばして持ち主を比べると、正しい書き方を誤りにしない。
- エラーには、正しい代わりの方法を書いておくと親切である。
