---
title: "テストの報告からキャンセルの痕跡を取り除く"
description: "Turbine のテストで、終わったときに残ったイベントの報告から、キャンセルによる例外だけを取り除く関数。本当の失敗だけを報告に残す。"
language: kotlin
project: "Turbine"
repo: https://github.com/cashapp/turbine
license: Apache-2.0
copyright: "Copyright (C) 2022 Square, Inc."
commit: "8c4e8c9b391d75ac9d7a168cca34b1bf99ed2cb0"
file: src/commonMain/kotlin/app/cash/turbine/Turbine.kt
lines: [286, 291]
function: "UnconsumedEventReport.stripCancellations"
difficulty: 2
tags: [テスト, エラー処理, 並行処理]
format: 2
---

## ひとことで

Turbine は、Kotlin の `Flow` を **テストするためのライブラリ** です。テストの最後に、受け取らなかった値や例外（未消費のイベント）を報告します。

`stripCancellations` は、その報告から **キャンセルによる例外（`CancellationException`）だけを取り除く** 関数です。キャンセルは、テストの後始末で普通に起きるものなので、本当の失敗と見分けて、報告には残さないようにしています。

## コード

```kotlin:line-numbers=286
  fun stripCancellations(): UnconsumedEventReport<T> =
    UnconsumedEventReport(
      unconsumed = unconsumed.filter { (it as? Event.Error)?.throwable !is CancellationException },
      name = name,
      cause = cause?.takeUnless { it is CancellationException },
    )
```

## 前提知識

- **`CancellationException`**: コルーチンが取り消されたことを表す例外です。取り消しは失敗ではなく、普通の終わり方の 1 つです。
- **未消費のイベント**: テストの中で、`awaitItem()` などで受け取られずに残った値や例外です。テストが想定外の値を見逃していないかを調べるために報告されます。
- **`filter`**: 条件に合うものだけを残すリストの関数です。
- **`as?` と `takeUnless`**: `as?` は安全なキャストで、型が違えば `null` を返します。`takeUnless` は、条件に当てはまれば `null`、そうでなければ元の値を返します。
- **新しい値を作る**: `UnconsumedEventReport(...)` を、必要な項目を入れて作り直しています。

## 何をしているか

### 1. 未消費のイベントから、キャンセルの例外を除く

```kotlin:line-numbers=288
      unconsumed = unconsumed.filter { (it as? Event.Error)?.throwable !is CancellationException },
```

`Event.Error` の例外が `CancellationException` なら、そのイベントを報告から外します。それ以外（普通の値や、本当の失敗）は残します。

### 2. 原因の例外も、キャンセルなら取り除く

```kotlin:line-numbers=290
      cause = cause?.takeUnless { it is CancellationException },
```

報告の原因（`cause`）がキャンセルなら、`null` にして外します。

### 3. 名前は変えずに、新しい報告を作る

```kotlin:line-numbers=289
      name = name,
```

テストの名前は、そのまま引き継ぎます。元の報告は変えず、新しい報告を返します。

## ここがすごい

- **本当の失敗だけを見せる**: テストの後始末でのキャンセルを報告しても、誰の役にも立ちません。キャンセルを除くことで、見るべき失敗に集中できます。
- **元の報告を壊さない**: `filter` や `takeUnless` は新しいリストや値を返すので、元の報告は変わりません。
- **変換が 1 つの関数に集まる**: キャンセルを除く判断が、この関数の中だけにあります。どの場所でキャンセルを除くかが、後から探しやすくなっています。
- **例外の型で判断する**: 例外のメッセージではなく、型（`CancellationException`）で見分けるので、文字列の変更に影響されません。

## まとめ

- テストの報告からは、キャンセルの例外だけを取り除く。
- 元のデータは変えず、新しい報告を作って返す。
- 例外は、メッセージではなく型で判断すると確実である。
