---
title: "年が 53 週まであるかを一つの式で決める"
description: "ISO 8601 の週番号で、その年が 53 週まであるかを判定する isIsoWeekLeapYear。年の番号から作る p という小さな式を 2 回使い、負の年でも正しく割り算する floorDiv を使っている。"
language: kotlin
project: "kotlinx-datetime"
repo: https://github.com/Kotlin/kotlinx-datetime
license: Apache-2.0
copyright: "Copyright 2019-2025 JetBrains s.r.o. and contributors."
commit: "00831dc5ab0aa9df7f383e9f92591339d9e55c28"
file: core/common/src/LocalIsoWeekDate.kt
lines: [457, 461]
function: "isIsoWeekLeapYear"
difficulty: 3
tags: [数値計算, 日時, イディオム]
format: 2
---

## ひとことで

`isIsoWeekLeapYear()` は、ISO 8601 の週番号で、その年が **53 週まであるか** を判定する関数です。普通の年は 52 週で終わり、一部の年だけ 53 週目が存在します。その年を、年の番号だけから計算で決めています。

kotlinx-datetime（日付と時刻を扱うライブラリ）の、週の番号を求める処理の中で使われています。「閏年」と呼ばれますが、2 月 29 日の閏年とは別のものです。

## コード


::: code-group

```kotlin:line-numbers=457 [日本語訳]
private fun isIsoWeekLeapYear(weekYear: Int): Boolean {
    // `y` は約 -10^9〜10^9 なので、途中の計算値は Int に収まる
    fun p(y: Int) = (y + y.floorDiv(4) - y.floorDiv(100) + y.floorDiv(400)).mod(7)
    return p(weekYear) == 4 || p(weekYear - 1) == 3
}
```

```kotlin:line-numbers=457 [原文]
private fun isIsoWeekLeapYear(weekYear: Int): Boolean {
    // `y` is approx. -10^9..10^9, so the intermediate values below fit into an Int
    fun p(y: Int) = (y + y.floorDiv(4) - y.floorDiv(100) + y.floorDiv(400)).mod(7)
    return p(weekYear) == 4 || p(weekYear - 1) == 3
}
```

:::

## 前提知識

- **ISO 8601 の週**: 月曜から始まる週で、年の最初の週は「1 月 4 日を含む週」と決められています。そのため、年の初めの数日が前年の週に属することがあります。
- **閏年（うるう年）の判定**: 西暦の閏年は、4 で割り切れる年で、100 で割り切れる年は除き、400 で割り切れる年は含みます。この考え方を、週の判定にも使っています。
- **`floorDiv`**: 割り算を、0 に向かって切り捨てるのではなく、小さいほうへ切り捨てる関数です。負の年でも、規則どおりの値になります。
- **`mod(7)`**: 7 で割ったあまりを、常に 0 以上の値で返す計算です。曜日を 0〜6 で表すときに使えます。
- **ローカル関数**: 関数の中に書いた関数です。`p` は、この関数の中だけで使われます。

## 何をしているか

### 1. 小さな式 p を作る

```kotlin:line-numbers=459
    fun p(y: Int) = (y + y.floorDiv(4) - y.floorDiv(100) + y.floorDiv(400)).mod(7)
```

`p` は、年 `y` から 0〜6 のどれかの値を返す、ISO 8601 の規則を表す補助の式です。4、100、400 で割った商を使って、閏年の数え方を組み込んでいます。

### 2. 53 週の条件を当てる

```kotlin:line-numbers=460
    return p(weekYear) == 4 || p(weekYear - 1) == 3
```

`p(weekYear)` が 4、または前の年の `p` が 3 なら、その年は 53 週まであります。どちらか一方でも当てはまれば真になるので、`||` で結んでいます。

## ここがすごい

- **巨大な表を持たずに済む**: 「どの年が 53 週か」を一覧にしておく必要がありません。年の番号を式に入れるだけで、どんな年でも判定できます。
- **負の年でも正しく動く**: `floorDiv` を使っているので、紀元前のような負の年でも、切り捨ての向きがずれません。通常の割り算の `/` では、負の数の商がずれてしまうので、この選び方が大切です。
- **式を 1 回だけ作る**: `p` を同じ形で 2 回呼ぶだけで済むように、ローカル関数にまとめています。計算の意味が一箇所に集まります。
- **コメントで範囲の理由を残す**: 年の範囲が約 10 億までなので、途中の計算が `Int` に収まる、という前提が書かれています。数値の型の限界を、先に確かめた上での実装です。

## まとめ

- `isIsoWeekLeapYear` は、年の番号から式 `p` を使って、その年が 53 週まであるかを判定する。
- 判定には `floorDiv` を使い、負の年でも閏年の規則が正しく働くようにしている。
- 数値の範囲の前提をコメントに残し、`Int` で計算が溢れないことを示している。
