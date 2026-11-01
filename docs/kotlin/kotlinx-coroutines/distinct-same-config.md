---
title: "同じ設定の Flow を二重に包まない"
description: "同じキー選択と比較の関数で、すでに distinct 用の Flow を作っていれば、その Flow をそのまま返す distinctUntilChangedBy の内部。無駄なラップを防ぐ。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/flow/operators/Distinct.kt
lines: [53, 59]
function: "distinctUntilChangedBy"
difficulty: 2
tags: [非同期, 最適化, イディオム]
format: 2
---

## ひとことで

`distinctUntilChangedBy` の内部にある、`private` の関数です。すでに同じ設定で作られた `DistinctFlowImpl` の上に、**もう一度同じ処理を重ねない** ようにしています。

同じ設定を 2 回適用しても、結果は変わりません。だから、二重に包む代わりに、そのまま返すほうが無駄がなくなります。

## コード


::: code-group

```kotlin:line-numbers=53 [日本語訳]
private fun <T> Flow<T>.distinctUntilChangedBy(
    keySelector: (T) -> Any?,
    areEquivalent: (old: Any?, new: Any?) -> Boolean
): Flow<T> = when {
    this is DistinctFlowImpl<*> && this.keySelector === keySelector && this.areEquivalent === areEquivalent -> this // 同じ設定なら、作り直さない
    else -> DistinctFlowImpl(this, keySelector, areEquivalent)
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
```

:::

## 前提知識

- **`DistinctFlowImpl`**: 直前と違う値だけを流す Flow の実装です。前の記事で扱いました。
- **`is` チェック**: 値の型が特定のクラスかどうかを調べる書き方です。`this is DistinctFlowImpl<*>` は、この Flow が `DistinctFlowImpl` かを判定します。
- **`===`**: 2 つの値が、同じオブジェクトを指しているかを調べる書き方です。中身が似ているかではなく、同一かどうかを見ます。
- **`when` 式**: 条件を上から順に調べて、最初に当てはまった枝の値を返します。
- **`else`**: どの条件にも当てはまらないときの枝です。

## 何をしているか

### 1. 同じ設定かを確かめる

```kotlin:line-numbers=57
    this is DistinctFlowImpl<*> && this.keySelector === keySelector && this.areEquivalent === areEquivalent -> this
```

3 つの条件を同時に確かめます。この Flow が `DistinctFlowImpl` であり、キー選択の関数も比較の関数も、同じオブジェクトであるとき、そのまま `this` を返します。

### 2. 違えば新しく作る

```kotlin:line-numbers=58
    else -> DistinctFlowImpl(this, keySelector, areEquivalent)
```

上の条件に当てはまらなければ、新しい `DistinctFlowImpl` を作って返します。

## ここがすごい

- **関数の同一性で比べる**: 関数の中身ではなく、`===` でオブジェクトとしての同一性を比べています。同じ関数オブジェクトを渡していれば、確実に同じ設定と判断できます。
- **二重に包まない**: 同じ設定を重ねると、流れる値を調べる処理が増えるだけで、結果は変わりません。この関数は、その無駄を防ぎます。
- **短い分岐で意図が見える**: `when` の 2 つの枝で、「作り直すか、そのまま使うか」が一目で分かります。
- **`private` で隠している**: 外からは `distinctUntilChangedBy` の公開版を使うので、この判断は利用者から見えません。

## まとめ

- `distinctUntilChangedBy` の内部では、同じ設定の `DistinctFlowImpl` なら、そのまま返す。
- 比べるのは関数オブジェクトの同一性で、同じ設定なら二重に包まない。
- 違えば新しく作り、どちらの場合も結果は同じ Flow になる。
