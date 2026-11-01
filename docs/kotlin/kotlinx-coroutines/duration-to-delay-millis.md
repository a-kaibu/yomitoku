---
title: "1 ナノ秒でも待つべきなら 1 ミリ秒にする切り上げ"
description: "Duration をミリ秒に変換する内部関数。999,999 ナノ秒を足してから切り捨てることで、端数を切り上げ、待ち時間が短くなりすぎないようにしている。"
language: kotlin
project: "kotlinx.coroutines"
repo: https://github.com/Kotlin/kotlinx.coroutines
license: Apache-2.0
copyright: "Copyright 2016-2025 JetBrains s.r.o and contributors"
commit: "7e0d1b3e9ca83652427ae00dda7d1673f058a743"
file: kotlinx-coroutines-core/common/src/Delay.kt
lines: [149, 158]
function: "Duration.toDelayMillis"
difficulty: 1
tags: [数値計算, 日時, イディオム]
format: 2
---

## ひとことで

`toDelayMillis()` は、Kotlin の `Duration`（時間の長さ）を、`delay` に渡すための **ミリ秒の整数** に変換する内部関数です。
ポイントは **切り上げ** をしていることで、`1.5` ミリ秒なら `2` ミリ秒、`1` ナノ秒でも `1` ミリ秒になります。「999,999 ナノ秒を足してから切り捨てる」という古典的な切り上げの技が使われています。

ついでに、すぐ上にある「コンテキストから時間待ち担当を取り出す」拡張プロパティも一緒に読みます。

## コード


::: code-group

```kotlin:line-numbers=149 [日本語訳]
internal val CoroutineContext.delay: Delay get() = get(ContinuationInterceptor) as? Delay ?: DefaultDelay

/**
 * このDuration をミリ秒に変換します。1 ミリ秒未満のナノ秒成分を持つ値は、
 * 次に大きいミリ秒へ切り上げられます。
 */
internal fun Duration.toDelayMillis(): Long = when (isPositive()) {
    true -> plus(999_999L.nanoseconds).inWholeMilliseconds
    false -> 0L
}
```

```kotlin:line-numbers=149 [原文]
internal val CoroutineContext.delay: Delay get() = get(ContinuationInterceptor) as? Delay ?: DefaultDelay

/**
 * Convert this duration to its millisecond value. Durations which have a nanosecond component less than
 * a single millisecond will be rounded up to the next largest millisecond.
 */
internal fun Duration.toDelayMillis(): Long = when (isPositive()) {
    true -> plus(999_999L.nanoseconds).inWholeMilliseconds
    false -> 0L
}
```

:::

## 前提知識

- **`Duration`**: Kotlin 標準ライブラリの「時間の長さ」を表す型です。`1500.microseconds` や `2.seconds` のように作れます。内部ではナノ秒単位の精度を持っています。
- **`inWholeMilliseconds`**: `Duration` を、小数点以下を **切り捨てた** ミリ秒の `Long` に変換します。`1.9` ミリ秒なら `1` です。
- **`999_999L.nanoseconds`**: 999,999 ナノ秒の `Duration` です。`_` は数字を読みやすく区切るための記号で、値には影響しません。`L` は `Long` 型の印です。1 ミリ秒 = 1,000,000 ナノ秒なので、これは「1 ミリ秒より 1 ナノ秒だけ短い時間」です。
- **`when (isPositive()) { true -> ...; false -> ... }`**: `when` に値を渡すと、その値に一致する分岐を選びます。`Boolean` なので `true` と `false` の 2 つで網羅できます。
- **拡張プロパティ `val CoroutineContext.delay`**: 既存の型 `CoroutineContext` に、外からプロパティを生やしています。`get(ContinuationInterceptor)` でディスパッチャを取り出し、それが `Delay` ならそれを、そうでなければ既定の `DefaultDelay` を返します。

## 何をしているか

### 1. 時間待ち担当を選ぶ

```kotlin:line-numbers=149
internal val CoroutineContext.delay: Delay get() = get(ContinuationInterceptor) as? Delay ?: DefaultDelay
```

ディスパッチャ自身が時間待ちを実装していればそれを使い、なければ既定のものを使います。`as? Delay ?: DefaultDelay` は「`Delay` にキャストできなければ既定値」という定番の書き方です。

### 2. 正なら切り上げてミリ秒にする

```kotlin:line-numbers=155
internal fun Duration.toDelayMillis(): Long = when (isPositive()) {
    true -> plus(999_999L.nanoseconds).inWholeMilliseconds
```

| 入力 | 999,999 ns を足す | 切り捨て | 結果 |
| --- | --- | --- | --- |
| 1 ns | 1,000,000 ns | 1 ms | 1 |
| 1 ms | 1.999999 ms | 1 ms | 1 |
| 1.5 ms | 2.499999 ms | 2 ms | 2 |
| 2 ms | 2.999999 ms | 2 ms | 2 |

ちょうどのミリ秒はそのまま、端数が少しでもあれば 1 繰り上がります。

### 3. 0 以下なら 0

```kotlin:line-numbers=157
    false -> 0L
```

負の時間や 0 は「待たない」なので 0 にします。

## ここがすごい

- **「足してから切り捨て」で切り上げる**: 整数の割り算で切り上げたいとき、`(a + b - 1) / b` と書くのが定番です。ここではその `b - 1` にあたる 999,999 ナノ秒を足しています。浮動小数点数を使わないので誤差が出ません。
- **切り上げにする理由**: `delay(1500.microseconds)` を切り捨てると 1 ミリ秒しか待たず、頼んだより早く再開してしまいます。「少なくとも指定した時間は待つ」という約束を守るには、切り上げが正解です。特に 1 ナノ秒を 0 ミリ秒にすると「まったく待たない」になってしまうのを防いでいます。
- **負の値を先に除外**: 負の値に 999,999 ナノ秒を足すと、0 に近い負の値が正になってしまうことがあります。`isPositive()` で先に分けることで、この落とし穴を避けています。
- **`as? ?:` の組み合わせ**: 「キャストできれば使い、できなければ既定値」を 1 行で書けるのは、Kotlin の安全キャストとエルビス演算子の組み合わせならではです。

## まとめ

- 整数で切り上げるには「割る数 − 1 を足してから切り捨てる」。
- 「最低でもこれだけ待つ」という約束には、切り上げが合う。
- 負の値は、足し算をする前に分けておくと安全。
