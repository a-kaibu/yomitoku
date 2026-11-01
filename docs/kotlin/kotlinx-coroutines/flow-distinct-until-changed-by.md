---
title: "「まだ何も来ていない」を表す NULL 印と二重適用の省略"
description: "連続する重複を取り除く distinctUntilChanged の本体。null も正しく扱える番兵オブジェクトと、同じ操作の重ねがけを省く工夫が入っている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Distinct.kt
lines: [53, 77]
function: "Flow.distinctUntilChangedBy"
difficulty: 2
tags: [非同期, イディオム, 最適化, 標準ライブラリ]
format: 2
---

## ひとことで

`distinctUntilChanged` は、Flow の中で **直前と同じ値が続いたら捨てる** 操作です。
たとえば `1, 1, 2, 2, 2, 1` は `1, 2, 1` になります（最後の `1` は直前の `2` と違うので残ります）。

ここで取り上げる `distinctUntilChangedBy` とクラス `DistinctFlowImpl` はその本体です。**「まだ 1 個も来ていない」状態を `null` と区別する番兵** と、**同じ操作を 2 回重ねても 1 回分しか働かない** 工夫が入っています。

## コード


::: code-group

```kotlin:line-numbers=53 [日本語訳]
private fun <T> Flow<T>.distinctUntilChangedBy(
    keySelector: (T) -> Any?,
    areEquivalent: (old: Any?, new: Any?) -> Boolean
): Flow<T> = when {
    this is DistinctFlowImpl<*> && this.keySelector === keySelector && this.areEquivalent === areEquivalent -> this // 同じ設定なら、そのまま返す
    else -> DistinctFlowImpl(this, keySelector, areEquivalent)
}

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

```kotlin:line-numbers=53 [原文]
private fun <T> Flow<T>.distinctUntilChangedBy(
    keySelector: (T) -> Any?,
    areEquivalent: (old: Any?, new: Any?) -> Boolean
): Flow<T> = when {
    this is DistinctFlowImpl<*> && this.keySelector === keySelector && this.areEquivalent === areEquivalent -> this // same
    else -> DistinctFlowImpl(this, keySelector, areEquivalent)
}

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

:::

`NULL` は同じライブラリの `NullSurrogate.kt` で定義されている、内部用の特別なオブジェクトです（`Symbol("NULL")`）。

## 前提知識

- **Flow**: 値を順番に流す仕組みです。`collect { value -> ... }` で 1 個ずつ受け取り、`emit(value)` で下流に流します。
- **`Any?`**: Kotlin のすべての型の親が `Any`、それに `?` を付けた `Any?` は「何でも入るし、`null` も入る」型です。Kotlin では `?` が付いた型だけが `null` を持てます。
- **関数型 `(T) -> Any?`**: 「`T` を受け取って `Any?` を返す関数」を表す型です。`keySelector` はそういう関数を受け取る引数です。
- **`when { 条件 -> 値; else -> 値 }`**: 上から順に条件を調べ、最初に当てはまった値を返す式です。if-else の連なりを短く書けます。
- **`is`**: 型チェックです。`this is DistinctFlowImpl<*>` は「この Flow は `DistinctFlowImpl` か」を調べ、真ならその後は自動でその型として扱えます（スマートキャスト）。
- **`===`**: 「同じオブジェクトそのものか」（参照の同一性）を調べます。`==` は「中身が等しいか」です。
- **`@JvmField`**: JVM 上で getter を作らず、フィールドを直接公開する指定です。わずかに速くなります。

## 何をしているか

### 1. 同じ操作の重ねがけを見抜く

```kotlin:line-numbers=56
): Flow<T> = when {
    this is DistinctFlowImpl<*> && this.keySelector === keySelector && this.areEquivalent === areEquivalent -> this // same
    else -> DistinctFlowImpl(this, keySelector, areEquivalent)
```

`flow.distinctUntilChanged().distinctUntilChanged()` と 2 回書いても、2 回目は何も取り除けません。
この条件は、元の Flow がすでに `DistinctFlowImpl` で、**キー関数も比較関数もまったく同じオブジェクト（`===`）** なら、新しく包まずに `this` をそのまま返します。
既定の関数は次の定義で 1 個だけ作られて共有されているので、引数なしの `distinctUntilChanged()` どうしなら必ず一致します。

```kotlin:line-numbers=42
private val defaultKeySelector: (Any?) -> Any? = { it }

private val defaultAreEquivalent: (Any?, Any?) -> Boolean = { old, new -> old == new }
```

### 2. 直前のキーを番兵で初期化する

```kotlin:line-numbers=67
        var previousKey: Any? = NULL
```

`previousKey` の初期値は `null` ではなく `NULL` という特別なオブジェクトです。
もし `null` で初期化すると、最初の値が本当に `null` だったとき「直前と同じ」と判定されて捨てられてしまいます。

### 3. 1 個ずつキーを比べる

```kotlin:line-numbers=68
        upstream.collect { value ->
            val key = keySelector(value)
            @Suppress("UNCHECKED_CAST")
            if (previousKey === NULL || !areEquivalent(previousKey, key)) {
                previousKey = key
                collector.emit(value)
            }
        }
```

`1, 1, 2` が来る場合:

- `1` → `previousKey` は `NULL`（まだ何もない）なので流す。`previousKey = 1`
- `1` → `areEquivalent(1, 1)` が真なので捨てる
- `2` → `areEquivalent(1, 2)` が偽なので流す。`previousKey = 2`

`NULL` との比較は `===` で行うので、利用者の `equals` 実装に左右されません。

## ここがすごい

- **番兵オブジェクトで「値なし」と `null` を区別**: 「まだ値がない」を表すのに `null` や `Boolean` のフラグを使うと、`null` が正当な値になれる型で壊れるか、変数が 1 つ増えます。ライブラリ専用の `NULL` オブジェクトなら、利用者の値と絶対にぶつかりません。
- **無駄な重ねがけを 1 行で省く**: 同じ設定の `DistinctFlowImpl` を二重に包んでも結果は同じなので、包まずに返します。比較を `===` にしているのは、「同じ関数かどうか」を中身で判断する方法がないからで、既定の関数を共有オブジェクトにしておくことでこの最適化が効くようになっています。
- **あえて `inline` にしない**: 元のファイルには、この関数は非 inline だという説明があります。`inline` にすると呼び出しごとに専用クラスが作られてアプリが大きくなります。`distinctUntilChanged` と `distinctUntilChangedBy` の両方で **1 つの実装クラスを共有** するための選択です。

## まとめ

- 「まだ値がない」を表すには、`null` ではなく専用の番兵オブジェクトを使うと安全。
- 結果が変わらない重ねがけは、同一性チェックで省ける。そのために既定値を共有オブジェクトにしておく。
- `inline` は速いがコードが増える。共有したい実装はあえて通常の関数にする判断もある。
