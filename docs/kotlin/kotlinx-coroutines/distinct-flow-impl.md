---
title: "直前と違う値だけを流す DistinctFlowImpl"
description: "Flow で、直前に流した値（またはキー）と同じなら捨てて、違うときだけ下流へ流す DistinctFlowImpl。最初の値は必ず流すために、特別な印 NULL を使う。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Distinct.kt
lines: [61, 77]
function: "DistinctFlowImpl.collect"
difficulty: 3
tags: [非同期, 遅延評価, イテレータ]
format: 2
---

## ひとことで

`DistinctFlowImpl` は、Flow（非同期に流れてくる値の列）の中で、**直前に流した値と同じなら捨てて、違うときだけ流す** 仕組みを実装したクラスです。`distinctUntilChanged()` や `distinctUntilChangedBy()` が、その裏で使っています。

たとえば、画面の状態が「読み込み中、読み込み中、完了、完了」と流れてきても、「読み込み中、完了」だけを下流に渡せます。

## コード

```kotlin:line-numbers=61
private class DistinctFlowImpl<T>(
    private val upstream: Flow<T>,
    @JvmField val keySelector: (T) -> Any?,
    @JvmField val areEquivalent: (old: Any?, new: Any?) -> Boolean
): Flow<T> {
    override suspend fun collect(collector: FlowCollector<T>) {
        var previousKey: Any? = NULL
        upstream.collect { value ->
            val key = keySelector(value)
            @Suppress("UNCHECKED_CAST")
            if (previousKey === NULL || !areEquivalent(previousKey, key)) {
                previousKey = key
                collector.emit(value)
            }
        }
    }
}
```

## 前提知識

- **Flow**: 値を 1 つずつ、非同期に流していく仕組みです。`collect` で受け取り、`emit` で流します。
- **`upstream` と下流**: `upstream` は、この Flow に値を流している元の Flow です。下流は、この Flow から値を受け取る側です。
- **`keySelector`**: 値から、比べるためのキーを取り出す関数です。値そのものを比べたくないときに使います。
- **`areEquivalent`**: 2 つのキーが同じ扱いかを判定する関数です。
- **`NULL`**: 「まだ何も流していない」ことを表す特別な印です。`null` は正当なキーになりうるので、別の印を使っています。

## 何をしているか

### 1. 直前のキーを覚えておく

```kotlin:line-numbers=67
        var previousKey: Any? = NULL
```

最初は、比べる相手がまだないことを `NULL` で表します。こうしておくと、最初の値は必ず流れます。

### 2. 上流の値を 1 つずつ見る

```kotlin:line-numbers=68
        upstream.collect { value ->
            val key = keySelector(value)
```

上流から値が来るたびに、キーを取り出します。

### 3. 違うときだけ流す

```kotlin:line-numbers=71
            if (previousKey === NULL || !areEquivalent(previousKey, key)) {
```

まだ何も流していないか、直前のキーと違う場合だけ、中の処理に入ります。

```kotlin:line-numbers=72
                previousKey = key
                collector.emit(value)
```

今のキーを覚えてから、値を下流に流します。同じキーの値は、ここに来ないので流れません。

## ここがすごい

- **比べるのはキーだけ**: 比較の対象をキーに絞れるので、値が大きいオブジェクトでも、キーだけを比べれば済みます。
- **最初の値を特別扱いしない**: `NULL` という印を使うことで、「最初は必ず流す」という条件を、比較の式の中に入れられます。
- **`===` で印を見分ける**: `NULL` かどうかは、同一性で判定しています。中身の値と混ざる心配がありません。
- **状態は 1 回の収集ごと**: `previousKey` は `collect` の中の変数です。流れを何度収集しても、前回の結果が混ざることはありません。

## まとめ

- `DistinctFlowImpl` は、直前に流したキーと同じ値を捨て、違うときだけ下流に流す。
- 最初の値を必ず流すために、`NULL` という特別な印を使う。
- 比較はキーで行い、`collect` の中の変数で直前の状態を覚えておく。
