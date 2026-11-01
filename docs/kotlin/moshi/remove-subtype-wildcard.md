---
title: "ワイルドカードの上限だけを取り出す removeSubtypeWildcard"
description: "Java のジェネリクスの「? extends X」を X に直す Moshi の関数。下限がある「? super X」や、ワイルドカードでない型は、そのまま返す。"
language: kotlin
project: "Moshi"
repo: https://github.com/square/moshi
license: Apache-2.0
copyright: "Copyright (C) 2014 Square, Inc."
commit: "889013ec2edb8d8034902662a1dc8c4f3b3f8111"
file: moshi/src/main/java/com/squareup/moshi/internal/Util.kt
lines: [196, 203]
function: "Type.removeSubtypeWildcard"
difficulty: 2
tags: [型システム, ジェネリクス, リフレクション]
format: 2
---

## ひとことで

Java のジェネリクスには、`List<? extends Number>` のように **型の範囲を指定する書き方（ワイルドカード）** があります。Moshi は JSON を Kotlin や Java の型に変換するときに、この型の情報を読み取ります。

`removeSubtypeWildcard` は、`? extends X` という形のワイルドカードを **上限の型 `X`** に直します。それ以外の型は、何もせずにそのまま返します。

## コード

```kotlin:line-numbers=196
internal fun Type.removeSubtypeWildcard(): Type {
  if (this !is WildcardType) return this
  val lowerBounds = lowerBounds
  if (lowerBounds.isNotEmpty()) return this
  val upperBounds = upperBounds
  require(upperBounds.size == 1)
  return upperBounds[0]
}
```

## 前提知識

- **`Type`**: Java のリフレクションで、型を表すインターフェースです。クラスそのものや、ジェネリクスを含む型を表します。
- **`WildcardType`**: ワイルドカードの型を表すインターフェースです。`? extends X`（上限 `X`）や `? super X`（下限 `X`）の情報を持ちます。
- **上限（upper bound）と下限（lower bound）**: `? extends X` は、`X` より下の型（`X` を含む）を指します。`? super X` は、`X` より上の型を指します。
- **`require(条件)`**: 条件が偽なら引数エラーにします。前提が崩れていないかを確かめます。
- **`is` と `as` の違い**: `is` は型を調べるだけで、`this !is WildcardType` のように使えば、以降で型が確定します（スマートキャスト）。

## 何をしているか

### 1. ワイルドカードでなければ、そのまま返す

```kotlin:line-numbers=197
  if (this !is WildcardType) return this
```

普通のクラス（`String` など）や、ジェネリクスを含む型（`List<String>` など）は、そのまま返します。ここで早く抜けるので、ほとんどの型では何もしません。

### 2. 下限があれば、そのまま返す

```kotlin:line-numbers=198
  val lowerBounds = lowerBounds
  if (lowerBounds.isNotEmpty()) return this
```

`? super X` は下限を持つので、上限だけを取り出す処理の対象外です。そのまま返します。

### 3. 上限を取り出す

```kotlin:line-numbers=200
  val upperBounds = upperBounds
  require(upperBounds.size == 1)
  return upperBounds[0]
```

上限が 1 つだけであることを `require` で確かめてから、その型を返します。Java のワイルドカードでは、上限を指定しないときも `Object` が 1 つ入るため、通常は 1 つだけになります。

## ここがすごい

- **早く抜ける順番**: ワイルドカードかどうか、次に下限があるかを順に確かめます。対象外の型を早く返すので、読みやすく、無駄な処理がありません。
- **型の性質を確かめる**: 上限が 1 つという前提を `require` で確かめているので、前提が崩れたときにすぐ分かります。
- **型の書き方を統一する**: ワイルドカードを上限の型に直すと、変換の後の処理は 1 種類の型だけを扱えます。JSON の値を読むアダプタを、型ごとに分けなくて済みます。
- **同じ関数で 2 つの場合**: ワイルドカードでない型も、下限のあるワイルドカードも、どちらも「そのまま返す」で統一されています。

## まとめ

- 型の範囲の指定は、上限の型だけを取り出せば、その後の処理が単純になる。
- 対象外のものは早く返し、前提は `require` で確かめる。
- 下限のあるワイルドカードは、上限だけを扱う処理の対象にしない。
