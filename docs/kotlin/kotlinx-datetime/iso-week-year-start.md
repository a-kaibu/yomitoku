---
title: "週の年が始まる日を求める startOfIsoWeekYear"
description: "ISO 8601 の週の年の始まりを、1 月 4 日を含む週の月曜日として求める startOfIsoWeekYear。1 行で日付を前に戻すだけの短い関数。"
language: kotlin
project: "kotlinx-datetime"
repo: https://github.com/Kotlin/kotlinx-datetime
license: Apache-2.0
copyright: "Copyright 2019-2025 JetBrains s.r.o. and contributors."
commit: "00831dc5ab0aa9df7f383e9f92591339d9e55c28"
file: core/common/src/LocalIsoWeekDate.kt
lines: [453, 454]
function: "startOfIsoWeekYear"
difficulty: 1
tags: [日時, 数値計算, イディオム]
format: 2
---

## ひとことで

`startOfIsoWeekYear()` は、ISO 8601 の **週の年（week-based year）が始まる日** を求める関数です。その年の第 1 週の月曜日を返します。

週の番号を計算するときに、「その年の第 1 週がいつ始まるか」の基準点として使われます。

## コード

```kotlin:line-numbers=453
private fun startOfIsoWeekYear(weekYear: Int): LocalDate =
    LocalDate(weekYear, 1, 4).previousOrSame(DayOfWeek.MONDAY)
```

## 前提知識

- **ISO 8601 の第 1 週**: 「1 月 4 日を含む週」が、その年の第 1 週です。週は月曜日から始まります。
- **週の年（week-based year）**: 普通の暦の年とは別に、週の番号に合わせて数える年です。12 月の終わりが次の年の第 1 週に入ることがあります。
- **`LocalDate(year, month, day)`**: 年、月、日から、日付を 1 つ作る書き方です。`LocalDate(weekYear, 1, 4)` は、その年の 1 月 4 日です。
- **`previousOrSame(DayOfWeek.MONDAY)`**: 指定の日付から見て、その日か、直前にある指定の曜日を返すメソッドです。「その日を含む週の月曜日」を求めるのに使えます。

## 何をしているか

### 1 月 4 日を基準に、月曜日まで戻す

```kotlin:line-numbers=454
    LocalDate(weekYear, 1, 4).previousOrSame(DayOfWeek.MONDAY)
```

まず、1 月 4 日を作ります。その日がすでに月曜日なら、そのまま返します。月曜日でなければ、直前の月曜日まで戻ります。

この式で、1 月 4 日を含む週の月曜日が求まります。それが、その週の年の始まりです。

### 例

ある年の 1 月 4 日が水曜日なら、直前の月曜日は 2 日前の 1 月 2 日です。その年の第 1 週は 1 月 2 日から始まります。1 月 1 日と 2 日は、前の年の週番号に属することになります。

## ここがすごい

- **1 行で「週の基準点」が決まる**: 1 月 4 日という規則と、「月曜日まで戻る」という操作を組み合わせるだけで、年の始まりが求まります。
- **`previousOrSame` の意味が名前に表れる**: 「同じ日か、前の指定の曜日」なので、1 月 4 日がすでに月曜日なら、その日自身が年の始まりになります。余計な分岐を書かずに済んでいます。
- **規則を式で表す**: 「1 月 4 日を含む週」という日本語の説明を、そのまま 2 つの呼び出しで書いています。読み手は規則を、式からすぐ確かめられます。
- **後続の計算の起点**: 週の番号はこの日からの差で決まるので、この関数の正しさが全体の正しさを支えています。だからこそ、短く明確に書かれています。

## まとめ

- `startOfIsoWeekYear` は、1 月 4 日を含む週の月曜日を、その年の週の年の始まりとして返す。
- `previousOrSame` で、その日か直前の月曜日まで戻ることで、規則を 1 行で表している。
- 週の番号の計算は、この日からの差で行われる。
