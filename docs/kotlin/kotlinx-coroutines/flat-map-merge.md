---
title: "内側の Flow を同時に流す flatMapMerge"
description: "値ごとに作った Flow を、同時に最大 concurrency 個まで動かしながら 1 本に合流させる flatMapMerge。既定の並列数を持ち、map と flattenMerge の組み合わせとして書かれている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Merge.kt
lines: [66, 70]
function: "Flow.flatMapMerge"
difficulty: 3
tags: [非同期, 並行処理, 関数型]
format: 2
---

## ひとことで

`flatMapMerge()` は、Flow の各値を **別の Flow に変換し、その内側の Flow を同時に動かして 1 本に合流させる** 関数です。`flatMapConcat` が 1 つずつ順番に流すのに対して、こちらは複数の内側の Flow を並べて動かします。

同時に動かす数の上限を `concurrency` で指定できます。省略すると、既定の並列数が使われます。

## コード

```kotlin:line-numbers=66
public fun <T, R> Flow<T>.flatMapMerge(
    concurrency: Int = DEFAULT_CONCURRENCY,
    transform: suspend (value: T) -> Flow<R>
): Flow<R> =
    map(transform).flattenMerge(concurrency)
```

## 前提知識

- **`flatMapConcat` との違い**: 順番に 1 つずつ流すのが `flatMapConcat`、同時に流すのが `flatMapMerge` です。値の順番が保証されるかどうかが、大きな違いです。
- **`DEFAULT_CONCURRENCY`**: 既定の同時実行数を表す定数です。引数を省略したときに使われます。
- **`flattenMerge`**: 入れ子の Flow を、同時に動かしながら 1 本にする関数です。この関数の中で呼ばれています。
- **`concurrency`**: 同時に収集される内側の Flow の最大数です。上限を超えると、空きができるまで待ちます。
- **`@ExperimentalCoroutinesApi`**: まだ仕様が変わる可能性がある API に付く印です。

## 何をしているか

### 1. 既定の並列数

```kotlin:line-numbers=67
    concurrency: Int = DEFAULT_CONCURRENCY,
```

並列数を省略すると、`DEFAULT_CONCURRENCY` が使われます。利用者は、必要なときだけ数を指定します。

### 2. 変換してから合流させる

```kotlin:line-numbers=70
    map(transform).flattenMerge(concurrency)
```

まず `map(transform)` で、各値を内側の Flow に変えます。そのあと `flattenMerge` が、並列数の上限を守りながら、それらを同時に動かして 1 本にまとめます。

## ここがすごい

- **並列数の上限を持つ**: 同時に動く Flow の数に上限があるので、大量の値が来ても、資源を使い切りません。
- **既定値で手軽に使える**: `concurrency` を省略すれば、特別な設定なしに並列処理が動きます。
- **分解して理解できる**: `map` と `flattenMerge` の組み合わせなので、それぞれの役割を別々に読めます。
- **順番は保証されない**: 同時に動くので、先に作られた内側の Flow が後から終わることがあります。順番が大切な処理には、`flatMapConcat` を使う必要があります。

## まとめ

- `flatMapMerge` は、各値を Flow に変え、その内側の Flow を最大 `concurrency` 個まで同時に動かす。
- 既定の並列数があり、省略すると `DEFAULT_CONCURRENCY` が使われる。
- 実装は `map(transform).flattenMerge(concurrency)` の 1 行で、順番は保証されない。
