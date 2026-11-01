---
title: "世代番号でまとめて受け取る combine の内側"
description: "複数の Flow の最新値を組み合わせる combine の本体。各 Flow を別コルーチンで集めてチャネルに送り、1 バイトの「世代番号」で同じ Flow の値を 2 つ取らないよう束ねて処理する。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/internal/Combine.kt
lines: [11, 80]
function: "combineInternal"
difficulty: 3
tags: [非同期, 並行処理, 最適化]
---

## ひとことで

`combine(flowA, flowB) { a, b -> ... }` は、複数の Flow の **それぞれの最新値を組み合わせて** 新しい値を作る演算子です。どれか 1 つが新しい値を流すたびに、全員の最新値でブロックが呼ばれます（ただし、全員が少なくとも 1 回は値を流してから）。

`combineInternal` はその本体です。各 Flow を別のコルーチンで集めてチャネル（コルーチン間の管）に送り、受け取る側では **「世代番号（epoch）」を使って、届いている値をまとめて取り込んでから 1 回だけ計算する** 工夫をしています。

## コード

```kotlin:line-numbers=11
@PublishedApi
internal suspend fun <R, T> FlowCollector<R>.combineInternal(
    flows: Array<out Flow<T>>,
    arrayFactory: () -> Array<T?>?, // Array factory is required to workaround array typing on JVM
    transform: suspend FlowCollector<R>.(Array<T>) -> Unit
): Unit = flowScope { // flow scope so any cancellation within the source flow will cancel the whole scope
    val size = flows.size
    if (size == 0) return@flowScope // bail-out for empty input
    val latestValues = arrayOfNulls<Any?>(size)
    latestValues.fill(UNINITIALIZED) // Smaller bytecode & faster than Array(size) { UNINITIALIZED }
    val resultChannel = Channel<Update>(size)
    val nonClosed = LocalAtomicInt(size)
    var remainingAbsentValues = size
    for (i in 0 until size) {
        // Coroutine per flow that keeps track of its value and sends result to downstream
        launch {
            try {
                flows[i].collect { value ->
                    resultChannel.send(Update(i, value))
                    yield() // Emulate fairness, giving each flow chance to emit
                }
            } finally {
                // Close the channel when there is no more flows
                if (nonClosed.decrementAndGet() == 0) {
                    resultChannel.close()
                }
            }
        }
    }

    /*
     * Batch-receive optimization: read updates in batches, but bail-out
     * as soon as we encountered two values from the same source
     */
    val lastReceivedEpoch = ByteArray(size)
    var currentEpoch: Byte = 0
    while (true) {
        ++currentEpoch
        // Start batch
        // The very first receive in epoch should be suspending
        var element = resultChannel.receiveCatching().getOrNull() ?: break // Channel is closed, nothing to do here
        while (true) {
            val index = element.index
            // Update values
            val previous = latestValues[index]
            latestValues[index] = element.value
            if (previous === UNINITIALIZED) --remainingAbsentValues
            // Check epoch
            // Received the second value from the same flow in the same epoch -- bail out
            if (lastReceivedEpoch[index] == currentEpoch) break
            lastReceivedEpoch[index] = currentEpoch
            element = resultChannel.tryReceive().getOrNull() ?: break
        }

        // Process batch result if there is enough data
        if (remainingAbsentValues == 0) {
            /*
             * If arrayFactory returns null, then we can avoid array copy because
             * it's our own safe transformer that immediately deconstructs the array
             */
            val results = arrayFactory()
            if (results == null) {
                transform(latestValues as Array<T>)
            } else {
                (latestValues as Array<T?>).copyInto(results)
                transform(results as Array<T>)
            }
        }
    }
}
```

## 前提知識

- **Flow とチャネル**: Flow は値を順に流すもの、チャネル（`Channel`）はコルーチン同士で値を受け渡す管です。`send` で送り、`receiveCatching()` で受け取ります（閉じていれば失敗が返る）。`tryReceive()` は待たずに受け取り、何もなければ失敗を返します。
- **`flowScope { ... }` と `launch { ... }`**: 子コルーチンを起動できる範囲を作り、その中で `launch` で子コルーチンを起動します。範囲の中の 1 つが失敗すると、全体が取り消されます。
- **`IndexedValue`**: 「何番目か」と「値」の組です。9 行目で `Update` という別名を付けています。
- **`UNINITIALIZED`**: 「まだ値が来ていない」を表す番兵オブジェクトです。
- **`ByteArray` と `Byte`**: 8 ビット整数の配列と、その要素の型です。`++currentEpoch` は 127 を超えると -128 に戻ります（あふれて一周する）。
- **`?: break`**: 左が `null` ならループを抜けます。

## 何をしているか

### 1. Flow ごとにコルーチンを起動（17〜39 行目）

`i` 番目の Flow を集め、値が来たら `(i, 値)` をチャネルに送ります。送るたびに `yield()` で順番を譲り、1 つの Flow ばかりが送り続けないようにしています（30 行目）。すべての Flow が終わったら、チャネルを閉じます。

### 2. 世代ごとに値をまとめて取り込む（45〜63 行目）

世代番号を 1 つ進め、まず 1 つ目の値を **待って** 受け取ります（51 行目）。その後は待たずに、チャネルに溜まっている値を次々取り込みます（62 行目）。

ただし、同じ世代の中で **同じ Flow から 2 個目の値** が来たら、そこで区切ります（60 行目）。値を上書きしてしまうと、1 個目が計算に使われずに消えてしまうからです。

### 3. 全員そろっていれば計算（66〜78 行目）

まだ 1 回も値を流していない Flow があれば計算しません。そろっていれば、最新値の配列でブロックを呼びます。

A と B を組み合わせ、チャネルに `(A, 1)`, `(B, "x")`, `(A, 2)` が溜まっていた場合:

- 世代 1: `(A, 1)` を受信 → `(B, "x")` を受信 → `(A, 2)` は A の 2 個目なので、取り込んでから区切る
- 計算は `(2, "x")` の 1 回

…となりそうですが、実は 60 行目の判定は「値を配列に入れたあと」なので、`(A, 2)` は配列に入り、ループを抜けます。結果として `(1, "x")` は計算されません。取り込みの区切りは「同じ Flow から 2 個目が来たら」なので、溜まった値をまとめて、無駄な中間計算を減らしています。

## ここがすごい

- **まとめて取り込んで計算を減らす**: 値が来るたびに計算すると、溜まった分だけ何度もブロックが呼ばれます。待たずに受け取れる分を一気に取り込んでから 1 回計算することで、計算の回数を減らしています。
- **1 バイトの世代番号**: 「この世代でこの Flow から受け取ったか」を `Boolean` の配列で持つと、世代が変わるたびに全部を `false` に戻す必要があります。世代番号を覚えておけば、番号を 1 つ進めるだけで全部がリセットされたことになります。`Byte` なので一周しますが、同じ番号に戻るまでに 256 世代かかるので問題ありません。
- **小さな最適化も明記**: 20 行目のコメントは「`Array(size) { UNINITIALIZED }` より `fill` のほうがバイトコードが小さく速い」と書いています。
- **終わりの判定はチャネルに任せる**: すべての Flow が終わったら、最後の 1 つがチャネルを閉じます（34〜35 行目）。受け取る側は、閉じたことを `?: break` で知るだけです。

## まとめ

- 待たずに受け取れる値をまとめて取り込むと、計算の回数を減らせる。
- 「今回受け取ったか」のフラグは、世代番号にすると一括リセットが番号 1 つの更新で済む。
- 複数の生産者は、最後の 1 人がチャネルを閉じるようにカウンタで管理する。
