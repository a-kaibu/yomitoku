---
title: "大文字小文字がずれた名前だけを強制的に囲む"
description: "データベースの既定の大文字小文字の扱いと、名前の書き方が食い違うときだけ、引用符で囲んで元の書き方を保つ quoteIdentifierWhenWrongCaseOrNecessary。それ以外は通常の判定に任せる。"
language: kotlin
project: "Exposed"
repo: https://github.com/JetBrains/Exposed
license: Apache-2.0
copyright: "Copyright 2000-2025 JetBrains s.r.o."
commit: "cb643693947c86745cf45414dd9dfb07249c82bc"
file: exposed-core/src/main/kotlin/org/jetbrains/exposed/v1/core/statements/api/IdentifierManagerApi.kt
lines: [160, 167]
function: "IdentifierManagerApi.quoteIdentifierWhenWrongCaseOrNecessary"
difficulty: 3
tags: [文字列処理, API設計, 防御的プログラミング]
format: 2
---

## ひとことで

`quoteIdentifierWhenWrongCaseOrNecessary()` は、SQL に書く名前の **大文字と小文字の扱い** を調べて、必要なら引用符で囲む関数です。多くのデータベースは、引用符のない名前を、決まった大文字小文字に変えて扱います。そのため、書いた名前と扱いが食い違うと、別の名前を指してしまうことがあります。

## コード

```kotlin:line-numbers=160
    fun quoteIdentifierWhenWrongCaseOrNecessary(identity: String): String {
        val inProperCase = inProperCase(identity)
        return if (shouldQuoteIdentifier(identity) && inProperCase != identity) {
            quote(identity)
        } else {
            quoteIfNecessary(inProperCase)
        }
    }
```

## 前提知識

- **大文字小文字の扱い**: データベースによっては、引用符のない名前をすべて大文字（または小文字）に変えます。引用符で囲むと、書いたとおりの大文字小文字が使われます。
- **`inProperCase`**: 名前を、そのデータベースで正しい大文字小文字の形に直す関数です。
- **`shouldQuoteIdentifier`**: その名前を引用符で囲むべきかを判断する関数です。
- **`quote`**: 名前を引用符で囲む関数です。前の記事の `quoteIfNecessary` とは違い、必ず囲みます。
- **`quoteIfNecessary`**: 必要なときだけ囲む関数です。

## 何をしているか

### 1. 正しい大文字小文字の形を求める

```kotlin:line-numbers=161
        val inProperCase = inProperCase(identity)
```

名前を、データベースの流儀に合う形に直します。これが、元の名前と違うかどうかで、後の判断が決まります。

### 2. 囲むべき名前で、形が食い違うなら囲む

```kotlin:line-numbers=162
        return if (shouldQuoteIdentifier(identity) && inProperCase != identity) {
            quote(identity)
```

囲むべき名前で、かつ正しい形と書いた形が違う場合は、書いたとおりの名前を引用符で囲みます。こうすると、大文字小文字の変換を受けずに、書いた名前がそのまま使われます。

### 3. それ以外は通常の判定

```kotlin:line-numbers=165
            quoteIfNecessary(inProperCase)
```

そうでなければ、正しい形の名前を使い、必要なときだけ囲みます。

## ここがすごい

- **書いたとおりを保つ**: 大文字小文字の食い違いがあるときだけ囲むので、データベースの変換による名前のずれを防げます。
- **条件が 2 段に分かれている**: 囲むべきかどうかと、形が違うかどうかの 2 つを組み合わせています。どちらか一方だけでは、正しい結果になりません。
- **通常の道は簡単なまま**: 食い違いがなければ、普通の判定に任せるので、ほとんどの名前は余計な引用符を付けません。
- **例外的な場面を明示**: 「強制的に囲む」という特別な場合を、関数名そのものに書いています。読む人が、この関数の目的をすぐに理解できます。

## まとめ

- `quoteIdentifierWhenWrongCaseOrNecessary` は、大文字小文字の扱いが食い違う名前だけを引用符で囲み、書いたとおりに保つ。
- 食い違いがなければ、前の記事の `quoteIfNecessary` と同じ通常の判定を使う。
- 囲むべき名前かと、形が違うかの 2 つの条件を、両方満たしたときだけ強制的に囲む。
