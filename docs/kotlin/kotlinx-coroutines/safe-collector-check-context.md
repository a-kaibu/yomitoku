---
title: "別のコルーチンからの emit を見抜く Flow の検査"
description: "flow ビルダーの中で、collect と違うコルーチンやコンテキストから emit していないかを調べる関数。コンテキストの要素を fold で数え、Job だけは親をたどって比べる。"
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
tags: [非同期, 防御的プログラミング, エラー処理]
---

## ひとことで

`flow { ... }` で作った Flow には、**「`emit` は、`collect` を呼んだのと同じコルーチン・同じコンテキストで行うこと」** という決まりがあります。これを破ると、下流の処理が予期しないスレッドで動いたり、同時に呼ばれて壊れたりします。

`checkContext` は、その決まりが守られているかを `emit` のたびに確かめる関数です。破られていれば、どう直せばよいかまで書いたエラーメッセージを出します。

## コード

```kotlin:line-numbers=22
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

## 前提知識

- **コルーチンのコンテキスト（`CoroutineContext`）**: コルーチンの設定の集まりです。ディスパッチャ（どのスレッドで動くか）、`Job`（取り消しや親子関係）、名前などの「要素」が、キーごとに 1 つずつ入っています。`context[key]` で取り出せます。
- **`fold(初期値) { 累積値, 要素 -> ... }`**: コンテキストの要素を 1 つずつ見て、値を累積していく関数です。
- **`fold@` と `return@fold`**: ラムダにラベルを付け、そのラムダの 1 回分だけを抜けて値を返す書き方です。
- **`Int.MIN_VALUE`**: `Int` の最小値です。ここでは「一致しない要素があった」という印として使い、以降の数え上げでも元に戻らない大きな負の値にしています。
- **`ScopeCoroutine`**: `coroutineScope { }` などが内部で作るコルーチンです。新しい親子関係を作るのではなく、「同じコルーチンの中の範囲」とみなせます。
- **`tailrec`**: 末尾で自分を呼ぶ再帰をループに変換する指定です。
- **`error(メッセージ)`**: `IllegalStateException` を投げます。

## 何をしているか

### 1. 要素ごとに比べて数える（24〜81 行目）

`emit` したときのコンテキスト（`currentContext`）の要素を 1 つずつ、`collect` したときのコンテキスト（`collectContext`）の同じキーの要素と比べます。

- Job 以外の要素: 同じオブジェクトなら数を 1 増やし、違えば `Int.MIN_VALUE` にします（27〜30 行目）。
- Job: そのまま比べると、`emit` の中で `coroutineScope { }` を使っただけでも違う Job になってしまいます。そこで `transitiveCoroutineParent` で、`ScopeCoroutine` をさかのぼって本当の親を探し、それが `collect` 側の Job と同じかを確かめます（32〜73 行目）。違えば「別のコルーチンから emit している」というエラーです。

### 2. 数が一致するか確かめる（82〜89 行目）

数え上げた結果が、`collect` 側のコンテキストの要素数と一致しなければ、「コンテキストが違う」というエラーです。メッセージで `flowOn` を使うよう案内します。

### よくある誤りの例

```kotlin
flow {
    withContext(Dispatchers.IO) { emit(1) }  // ディスパッチャが違う → エラー
}
flow {
    launch { emit(1) }                       // 別コルーチン → エラー
}
```

## ここがすごい

- **数え上げで「完全一致」を判定**: 要素が 1 つずつ同じかを調べ、最後に数が合うかを見れば、「余計な要素も足りない要素もない」ことまで確認できます。一致しない要素を `Int.MIN_VALUE` にするのは、その後いくら足しても正しい数に戻らないようにするためです。
- **Job だけ特別扱い**: `coroutineScope` は同じコルーチンの中の範囲なので、それで Job が変わっても決まりは破られていません。`ScopeCoroutine` だけをさかのぼる `transitiveCoroutineParent` で、正当な使い方を誤ってエラーにしないようにしています。
- **直し方まで教えるエラー**: メッセージには、何が起きたか（別のコルーチンから emit）だけでなく、どうすればよいか（`channelFlow` を使う、`flowOn` を使う）まで書かれています。
- **毎回の検査を軽く**: 実際の `emit` では、前回と同じコンテキストなら検査を省く仕組みが JVM 版の `SafeCollector` にあります。この関数は、コンテキストが変わったときだけ呼ばれます。

## まとめ

- 「同じであること」の確認は、要素ごとの一致を数え、総数が合うかで判定できる。
- 正当な例外（ここでは `coroutineScope`）を誤ってエラーにしないよう、特別扱いを入れる。
- エラーメッセージには、原因と直し方の両方を書く。
