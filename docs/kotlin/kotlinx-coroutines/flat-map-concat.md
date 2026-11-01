---
title: "1 つずつ順番に内側の Flow を流す flatMapConcat"
description: "値ごとに別の Flow を作り、前の Flow が終わってから次を始める flatMapConcat。map と flattenConcat の組み合わせとして 1 行で書かれている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Merge.kt
lines: [42, 43]
function: "Flow.flatMapConcat"
difficulty: 2
tags: [非同期, 関数型, 遅延評価]
format: 2
---

## ひとことで

`flatMapConcat()` は、Flow の各値を **別の Flow に変換し、その内側の Flow を 1 つずつ順番に流す** 関数です。前の内側の Flow が完全に終わってから、次の内側の Flow を始めます。

値の順番が、そのまま守られるのが特徴です。たとえば、ファイル名の一覧から、順番にファイルを読み込んで中身を流す、という処理に向いています。

## コード

```kotlin:line-numbers=42
public fun <T, R> Flow<T>.flatMapConcat(transform: suspend (value: T) -> Flow<R>): Flow<R> =
    map(transform).flattenConcat()
```

## 前提知識

- **Flow**: 非同期に値を 1 つずつ流す仕組みです。値が流れてくる間、途中で一時停止しても構いません。
- **`map`**: 各値を、別の値に変える操作です。ここでは、値を別の Flow に変えるために使います。
- **Flow of Flow**: 「Flow の値が、さらに Flow である」という入れ子の形です。そのままでは扱いにくいので、平らにする操作が必要です。
- **`flattenConcat`**: 入れ子の Flow を、1 つずつ順番に平らにする関数です。次の記事で扱います。
- **`@ExperimentalCoroutinesApi`**: まだ仕様が変わる可能性がある API に付く印です。使うときは、その前提を理解しておく必要があります。

## 何をしているか

### 1. 値を Flow に変える

```kotlin:line-numbers=43
    map(transform).flattenConcat()
```

この 1 行が、関数の中身のすべてです。まず `map(transform)` で、各値を内側の Flow に変えます。そのあと `flattenConcat()` で、それらを 1 つずつ順番に流します。

### 2. 関数の宣言

```kotlin:line-numbers=42
public fun <T, R> Flow<T>.flatMapConcat(transform: suspend (value: T) -> Flow<R>): Flow<R> =
```

`transform` は、中断できる関数（`suspend`）です。内側の Flow を作るときに、時間のかかる処理をしても構いません。

## ここがすごい

- **1 行で意味が伝わる**: 「変換してから平らにする」という意味が、`map` と `flattenConcat` の組み合わせに、そのまま表れています。
- **順番が必ず守られる**: 内側の Flow を次々に収集するので、結果の順番は、もとの値の順番と一致します。
- **実装を再利用**: 新しい仕組みを作らず、既存の 2 つの関数の組み合わせです。動きを理解したいときは、それぞれの関数だけ読めば済みます。
- **並列にしたいときは別の関数**: 内側の Flow を同時に動かしたいときは、`flatMapMerge` を使います。順番を守るかどうかで、使い分けます。

## まとめ

- `flatMapConcat` は、各値を Flow に変え、その内側の Flow を 1 つずつ順番に流す。
- 実装は `map(transform).flattenConcat()` という 1 行の組み合わせ。
- 順番を守りたいときに使い、同時に動かしたいときは `flatMapMerge` を選ぶ。
