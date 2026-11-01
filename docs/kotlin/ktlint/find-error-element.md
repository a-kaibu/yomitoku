---
title: "構文木の中から最初の構文エラーを探す"
description: "Kotlin の構文木を深さ優先でたどり、最初に見つかった構文エラーの要素を返す findErrorElement。見つからなければ null を返す再帰の探索。"
language: kotlin
project: "ktlint"
repo: https://github.com/pinterest/ktlint
license: MIT
copyright: "Copyright 2026 Ktlint, Copyright 2019-2026 Pinterest, Inc., Copyright 2016-2019 Stanley Shyiko"
commit: "5775b58d0f996e84c9c67205342f1c5620de6a4a"
file: ktlint-rule-engine/src/main/kotlin/io/github/ktlint/core/rule/engine/internal/RuleExecutionContext.kt
lines: [332, 337]
function: "PsiElement.findErrorElement"
difficulty: 2
tags: [パース, 再帰, 防御的プログラミング]
format: 2
---

## ひとことで

`findErrorElement()` は、Kotlin のコードを解析した **構文木（コードの構造を木の形にしたもの）** の中から、**最初の構文エラー** を見つける関数です。見つかればそのエラーの要素を返し、なければ `null` を返します。

ktlint（Kotlin の書式を検査するツール）は、コードを解析して構文木を作ったあと、この関数でエラーを探します。見つかれば、その位置を添えた解析エラーの例外を投げ、書式の検査には進みません。

## コード

```kotlin:line-numbers=332
        private fun PsiElement.findErrorElement(): PsiErrorElement? =
            if (this is PsiErrorElement) {
                this
            } else {
                children.firstNotNullOfOrNull { it.findErrorElement() }
            }
```

## 前提知識

- **構文木（PSI）**: コードの文法的な構造を、親と子の関係で表した木です。関数は、その中に式や文を子として持ちます。
- **`PsiErrorElement`**: 解析の途中で、文法に合わない部分が見つかったときに作られる要素です。
- **`children`**: ある要素が直接持っている子の要素の並びです。
- **`firstNotNullOfOrNull`**: 列の要素を変換し、最初に `null` でない結果を返す関数です。見つかった時点で止まります。
- **再帰**: 関数の中で、自分自身を子の要素に対して呼ぶ書き方です。木を深いところまでたどれます。

## 何をしているか

### 1. 自分がエラーなら、それを返す

```kotlin:line-numbers=333
            if (this is PsiErrorElement) {
                this
```

今の要素が `PsiErrorElement` なら、それ自体を結果として返します。

### 2. そうでなければ、子をたどる

```kotlin:line-numbers=336
                children.firstNotNullOfOrNull { it.findErrorElement() }
```

子の要素を順番に調べ、それぞれで同じ `findErrorElement` を呼びます。最初に `null` でない結果が出た時点で、その結果を返します。どの子にもエラーがなければ、結果は `null` になります。

## ここがすごい

- **深さ優先で最初の 1 つ**: 子をたどる順番が、コードの書かれた順番と同じです。ファイルの上の方にあるエラーが、先に見つかります。
- **見つかった時点で止まる**: `firstNotNullOfOrNull` は、最初の一致で探索を終えます。残りの子や枝を、無駄にたどることがありません。
- **再帰の形がそのまま木の構造に対応**: 「自分がエラーか、子のどれかがエラーか」という定義を、そのまま関数にしています。読み手にとって、木の構造と関数の形が一致して分かりやすいです。
- **`null` で見つからないことを表す**: 例外ではなく `null` で返すので、エラーがないのが普通の状態として扱えます。

## まとめ

- `findErrorElement` は、構文木を深さ優先でたどり、最初の `PsiErrorElement` を返す。
- 子の中の最初の一致で止まるので、無駄な探索が少ない。
- 見つからなければ `null` を返し、エラーがないことを普通の状態として扱う。
