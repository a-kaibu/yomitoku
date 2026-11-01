---
title: "意味のないバッファ指定を無視する StateFlow の融合"
description: "StateFlow に buffer や conflate を重ねたときの処理。もともと最新値しか持たない StateFlow に、同じ効果の指定が来たら何も足さずに自分を返す。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/StateFlow.kt
lines: [421, 432]
function: "StateFlow.fuseStateFlow"
difficulty: 2
tags: [非同期, 最適化, API設計]
---

## ひとことで

Flow には `buffer(…)` や `conflate()`、`flowOn(…)` のような「受け渡し方を変える」演算子があります。kotlinx.coroutines は、これらを Flow の種類に合わせて **融合（fuse）** し、無駄な中間処理を作らないようにしています。

`fuseStateFlow` は StateFlow 用の融合で、**StateFlow にはもともと意味のない指定なら、何も足さずに自分自身を返す** 関数です。

## コード

```kotlin:line-numbers=421
internal fun <T> StateFlow<T>.fuseStateFlow(
    context: CoroutineContext,
    capacity: Int,
    onBufferOverflow: BufferOverflow
): Flow<T> {
    // state flow is always conflated so additional conflation does not have any effect
    assert { capacity != Channel.CONFLATED } // should be desugared by callers
    if ((capacity in 0..1 || capacity == Channel.BUFFERED) && onBufferOverflow == BufferOverflow.DROP_OLDEST) {
        return this
    }
    return fuseSharedFlow(context, capacity, onBufferOverflow)
}
```

## 前提知識

- **StateFlow**: 現在の値を 1 つ持ち、変化を通知する Flow です。購読者が遅いと途中の値は飛ばされ、最新の値だけが届きます。つまり **もともと「容量 1・古いものを捨てる」バッファ** と同じ振る舞いです。
- **バッファの容量（capacity）**: Flow の上流と下流の間に置く入れ物の大きさです。`Channel.BUFFERED` は既定の大きさ、`Channel.CONFLATED` は「常に最新 1 個だけ保持」の特別な値です。
- **`BufferOverflow.DROP_OLDEST`**: バッファがいっぱいのとき、いちばん古い値を捨てて新しい値を入れる方針です。
- **`capacity in 0..1`**: `in` は範囲に含まれるかを調べます。`0..1` は 0 以上 1 以下です。
- **`assert { ... }`**: 内部の前提が正しいかを、デバッグ時に確認するための関数です。

## 何をしているか

### 1. CONFLATED はここに来ない前提（426〜427 行目）

`conflate()` は呼び出し元で「容量 0 + DROP_OLDEST」に変換されている前提です。

### 2. 意味のない指定なら自分を返す（428〜430 行目）

容量が 0 か 1 か既定値で、方針が「古いものを捨てる」なら、StateFlow の振る舞いとまったく同じです。追加の処理は不要なので `this` を返します。

- `stateFlow.conflate()` → 自分そのもの
- `stateFlow.buffer(1, BufferOverflow.DROP_OLDEST)` → 自分そのもの

### 3. それ以外は SharedFlow と同じ融合へ（431 行目）

`buffer(10)`（10 個まで溜めて、溢れたら待つ）のように、StateFlow とは違う振る舞いを求められたら、一般の SharedFlow 用の融合処理に任せます。

## ここがすごい

- **何もしないのが最速**: `stateFlow.conflate()` を素直に実装すると、間にチャネルとコルーチンが 1 つ増えます。この関数のおかげで、効果のない指定はコストゼロになります。
- **型ごとの性質を活かす**: 「StateFlow はもともと最新値しか届けない」という性質を知っているからこそできる最適化です。融合の仕組みが `FusibleFlow` というインターフェースになっているので、Flow の種類ごとに最適な融合を用意できます。
- **利用者が気にしなくてよい**: 利用者が念のために `conflate()` を付けても損をしません。API の使い方に「付けると遅くなる」という落とし穴がないのは、よい設計です。
- **前提を `assert` で書いておく**: 427 行目は「CONFLATED はすでに変換済みのはず」という前提をコードで記録しています。もし将来の変更で前提が崩れれば、テストで気づけます。

## まとめ

- 同じ効果の処理を重ねても、型の性質を知っていれば省略できる。
- 「何もしないで自分を返す」は、いちばん速い最適化。
- 呼び出し側の前提は `assert` で書いておくと、壊れたときに気づける。
