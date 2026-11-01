---
title: "ヘッダーの等しさを、名前と値の並びで比べる"
description: "HTTP ヘッダーの集まりを、名前と値の並び全体で比べる commonEquals と、そのハッシュ値を作る commonHashCode。並びの順番も含めて判定する。"
language: kotlin
project: "OkHttp"
repo: https://github.com/square/okhttp
license: Apache-2.0
copyright: "this work for additional information regarding copyright ownership."
commit: "16fb6aef3aee1c4645fc8d24af01f8a4dc128ebf"
file: okhttp/src/commonJvmAndroid/kotlin/okhttp3/internal/-HeadersCommon.kt
lines: [50, 52]
function: "Headers.commonEquals, Headers.commonHashCode"
difficulty: 1
tags: [ハッシュ, データ構造, 型システム]
format: 2
---

## ひとことで

`commonEquals` と `commonHashCode` は、OkHttp の `Headers`（HTTP ヘッダーの集まり）が、**等しいかどうかとハッシュ値をどう決めるか** を定める 2 つの関数です。

`Headers` は内部で、名前と値を 1 本の配列に、名前、値、名前、値、の順で並べて持っています。この 2 つの関数は、その配列の中身をそのまま比べ、そのまま使ってハッシュ値を作ります。

## コード

```kotlin:line-numbers=50
internal fun Headers.commonEquals(other: Any?): Boolean = other is Headers && namesAndValues.contentEquals(other.namesAndValues)

internal fun Headers.commonHashCode(): Int = namesAndValues.contentHashCode()
```

## 前提知識

- **`Headers`**: HTTP のヘッダーを表す OkHttp の型です。名前と値の組を、順番を保って持ちます。
- **`is` と `&&`**: `other is Headers` は、相手が `Headers` かを確かめる型の判定です。`&&` で、型が合っているときだけ中身を比べます。
- **`Array<String>` の `contentEquals`**: 配列の要素を、順番に 1 つずつ比べる標準の関数です。配列どうしの `==` は参照の比較なので、これが必要になります。
- **`contentHashCode`**: 配列の中身から、ハッシュ値を作る標準の関数です。`contentEquals` と対になっています。
- **`internal`**: 同じモジュールの中からだけ使える可視性の指定です。

## 何をしているか

### 1. 相手が Headers で、中身が同じか

```kotlin:line-numbers=50
internal fun Headers.commonEquals(other: Any?): Boolean = other is Headers && namesAndValues.contentEquals(other.namesAndValues)
```

相手が `Headers` であるかを確かめてから、名前と値の配列を `contentEquals` で比べます。配列の要素は、順番どおりに比べられます。

### 2. 中身からハッシュ値を作る

```kotlin:line-numbers=52
internal fun Headers.commonHashCode(): Int = namesAndValues.contentHashCode()
```

配列の中身から、ハッシュ値を作ります。`commonEquals` が等しいと判定した 2 つの `Headers` は、必ず同じハッシュ値になります。

## ここがすごい

- **順番が意味を持つ**: HTTP のヘッダーは、同じ名前が複数あっても、並びが違えば別のものとして扱われることがあります。配列の比較は順番を見るので、この扱いと合います。
- **比較とハッシュ値を組で作る**: 等しいものは同じハッシュ値になる、という約束を、2 つの関数が同じ配列を元に作っているので、確実に守られます。
- **標準の関数に任せる**: 配列の中身を比べる処理を、自分では書かず、標準の `contentEquals` と `contentHashCode` を使っています。
- **型を確かめてから比べる**: `is Headers` を先に確かめるので、違う型との比較でも例外になりません。

## まとめ

- 内部の配列をそのまま比べると、順番を含めた等しさが簡単に判定できる。
- 等しさとハッシュ値は、同じ配列から作ると、約束が自然に守られる。
- 配列どうしは、`==` ではなく `contentEquals` で比べる。
