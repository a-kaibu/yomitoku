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
format: 2
---

## ひとことで

`combine(flowA, flowB) { a, b -> ... }` は、複数の Flow の **それぞれの最新値を組み合わせて** 新しい値を作る演算子です。どれか 1 つが新しい値を流すたびに、全員の最新値でブロックが呼ばれます（ただし、全員が少なくとも 1 回は値を流してから）。

`combineInternal` はその本体です。各 Flow を別のコルーチンで集めてチャネル（コルーチン間の管）に送り、受け取る側では **「世代番号（epoch）」を使って、同じ Flow からの値を 1 世代に 1 回までに区切りながら取り込み、その後に 1 回だけ計算する** 工夫をしています。

## コード


::: code-group

```kotlin:line-numbers=11 [日本語訳]
@PublishedApi
internal suspend fun <R, T> FlowCollector<R>.combineInternal(
    flows: Array<out Flow<T>>,
    arrayFactory: () -> Array<T?>?, // 配列の作成関数。JVM での配列の型の制約を回避するために必要
    transform: suspend FlowCollector<R>.(Array<T>) -> Unit
): Unit = flowScope { // 元の Flow でキャンセルが起きたら、範囲全体をキャンセルするための flowScope
    val size = flows.size
    if (size == 0) return@flowScope // 入力が空なら何もせず終了
    val latestValues = arrayOfNulls<Any?>(size)
    latestValues.fill(UNINITIALIZED) // Array(size) { UNINITIALIZED } より、バイトコードが小さく速い
    val resultChannel = Channel<Update>(size)
    val nonClosed = LocalAtomicInt(size)
    var remainingAbsentValues = size
    for (i in 0 until size) {
        // Flow ごとのコルーチン。自分の値を管理し、結果を下流へ送る
        launch {
            try {
                flows[i].collect { value ->
                    resultChannel.send(Update(i, value))
                    yield() // 公平性のため。各 Flow が送る機会を得られるようにする
                }
            } finally {
                // もう Flow がなくなったら、チャネルを閉じる
                if (nonClosed.decrementAndGet() == 0) {
                    resultChannel.close()
                }
            }
        }
    }

    /*
     * バッチ受信の最適化: 更新をまとめて読むが、
     * 同じ送信元から 2 個目の値に出会ったら、すぐに区切る
     */
    val lastReceivedEpoch = ByteArray(size)
    var currentEpoch: Byte = 0
    while (true) {
        ++currentEpoch
        // バッチの開始
        // 世代の最初の受信は、待つ必要がある（中断する）
        var element = resultChannel.receiveCatching().getOrNull() ?: break // チャネルが閉じられた。ここでは何もしない
        while (true) {
            val index = element.index
            // 値を更新する
            val previous = latestValues[index]
            latestValues[index] = element.value
            if (previous === UNINITIALIZED) --remainingAbsentValues
            // 世代を確かめる
            // 同じ世代で同じ Flow から 2 個目の値を受け取った。ここで区切る
            if (lastReceivedEpoch[index] == currentEpoch) break
            lastReceivedEpoch[index] = currentEpoch
            element = resultChannel.tryReceive().getOrNull() ?: break
        }

        // 十分なデータがあれば、バッチの結果を処理する
        if (remainingAbsentValues == 0) {
            /*
             * arrayFactory が null を返すなら、配列のコピーを省ける。
             * 独自の安全な変換関数が、配列をすぐ分解するため
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

```kotlin:line-numbers=11 [原文]
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

:::

## 前提知識

- **Flow とチャネル**: Flow は値を順に流すもの、チャネル（`Channel`）はコルーチン同士で値を受け渡す管です。`send` で送り、`receiveCatching()` で受け取ります（閉じていれば失敗が返る）。`tryReceive()` は待たずに受け取り、何もなければ失敗を返します。
- **`flowScope { ... }` と `launch { ... }`**: 子コルーチンを起動できる範囲を作り、その中で `launch` で子コルーチンを起動します。範囲の中の 1 つが失敗すると、全体が取り消されます。
- **`IndexedValue`**: 「何番目か」と「値」の組です。ファイルの先頭で `Update` という別名を付けています。
- **`UNINITIALIZED`**: 「まだ値が来ていない」を表す番兵オブジェクトです。
- **`Byte` の世代番号**: 8 ビット整数です。`++currentEpoch` は 127 を超えると -128 に戻ります（あふれて一周する）。
- **`?: break`**: 左が `null` ならループを抜けます。

## 何をしているか

### 1. Flow ごとにコルーチンを起動する

`i` 番目の Flow を集め、値が来たら `(i, 値)` をチャネルに送ります。送るたびに `yield()` で順番を譲り、1 つの Flow ばかりが送り続けないようにしています。

```kotlin:line-numbers=28
                flows[i].collect { value ->
                    resultChannel.send(Update(i, value))
```

### 2. すべての Flow が終わったら、チャネルを閉じる

最後の 1 つが終わると、カウンタが 0 になってチャネルを閉じます。受け取る側は、閉じたことを `?: break` で知ります。

```kotlin:line-numbers=34
                if (nonClosed.decrementAndGet() == 0) {
                    resultChannel.close()
                }
```

### 3. 世代の中で、届いている値をまとめて取り込む

各世代の最初の受信だけは待ちます。その後は、チャネルに溜まっている値を待たずに取り込みます。

```kotlin:line-numbers=55
            val previous = latestValues[index]
            latestValues[index] = element.value
            if (previous === UNINITIALIZED) --remainingAbsentValues
```

「まだ値が来ていなかった Flow」なら、未受信の数を 1 つ減らします。全員の値が届いたかどうかは、この数が 0 になったかで分かります。

### 4. 同じ Flow から 2 個目が来たら、その世代を区切る

世代番号を記録しておき、同じ世代で同じ Flow からもう一度届いたら、取り込みをそこで止めます。

```kotlin:line-numbers=60
            if (lastReceivedEpoch[index] == currentEpoch) break
            lastReceivedEpoch[index] = currentEpoch
            element = resultChannel.tryReceive().getOrNull() ?: break
```

`A` と `B` が次の順でチャネルに溜まっていた場合:

- 世代 1 の最初: `(A, 1)` を受信 → 記録する
- 続けて `(B, "x")` を受信 → 記録する
- 続けて `(A, 2)` を受信 → A は同じ世代で 2 個目なので、値を入れてから区切る
- 計算は `(2, "x")` の 1 回だけ

### 5. 全員そろっていれば計算する

まだ 1 回も値を流していない Flow があれば計算しません。そろっていれば、最新値の配列でブロックを呼びます。

```kotlin:line-numbers=71
            val results = arrayFactory()
            if (results == null) {
                transform(latestValues as Array<T>)
            } else {
```

## ここがすごい

- **まとめて取り込んで計算を減らす**: 値が来るたびに計算すると、溜まった分だけ何度もブロックが呼ばれます。待たずに受け取れる分を一気に取り込んでから 1 回計算することで、計算の回数を減らしています。
- **世代の区切りで公平さを保つ**: 1 つの Flow が速く値を送り続けても、1 世代には各 Flow 1 個ずつ分しか進まないので、ほかの Flow が飢えることはありません。
- **1 バイトの世代番号**: 「この世代でこの Flow から受け取ったか」を `Boolean` の配列で持つと、世代が変わるたびに全部を `false` に戻す必要があります。世代番号を覚えておけば、番号を 1 つ進めるだけで全部がリセットされたことになります。`Byte` なので一周しますが、同じ番号に戻るまでに 256 世代かかります。
- **コピーを省く分岐**: `arrayFactory` が `null` を返すときは、配列をコピーせずに直接渡せます。`arrayFactory` は、JVM で配列の型を扱うための仕掛けです。
- **終わりの判定はチャネルに任せる**: すべての Flow が終わったら、最後の 1 つがチャネルを閉じます。受け取る側は閉じたことを `?: break` で知るだけです。

## まとめ

- 待たずに受け取れる値をまとめて取り込むと、計算の回数を減らせる。
- 世代の区切りを 1 世代 1 個ずつにすると、速い送信元に全体が引きずられない。
- 「今回受け取ったか」は、世代番号を 1 つ進めるだけで全部リセットできる。
- 複数の生産者は、最後の 1 人がチャネルを閉じるようにカウンタで管理する。
