---
title: "SQL に値を書かず、パラメーターとして渡す"
description: "SQL の文に文字列の値を直接書かず、パラメーターとして登録する appendStringArgument。値は SQL の一部として解釈されないので、文の形を壊す心配がない。"
language: kotlin
project: "Exposed"
repo: https://github.com/JetBrains/Exposed
license: Apache-2.0
copyright: "Copyright 2000-2025 JetBrains s.r.o."
commit: "cb643693947c86745cf45414dd9dfb07249c82bc"
file: exposed-core/src/main/kotlin/org/jetbrains/exposed/v1/core/vendors/VendorDialect.kt
lines: [134, 136]
function: "QueryBuilder.appendStringArgument"
difficulty: 2
tags: [防御的プログラミング, データ構造, 型システム]
format: 2
---

## ひとことで

`appendStringArgument` は、SQL の文を組み立てるときに、文字列の値を **文の中に書き写さず、「パラメーター」として別に登録する** 関数です。文の中には、値の場所を示す印だけが残ります。

前の記事の `appendStringLiteral` は、値を文字列リテラルとして直接書きました。こちらは、値を文の外で渡すので、引用符の扱いを心配せずに済みます。Exposed は、できるだけこちらの方法を使うように作られています。

## コード

```kotlin:line-numbers=134
internal fun QueryBuilder.appendStringArgument(value: String) {
    registerArgument(TextColumnType(), value)
}
```

## 前提知識

- **パラメーター（バインド変数）**: SQL の文とは別に、値をデータベースへ渡す仕組みです。文の中には `?` などの印が残り、値は後から別に送られます。
- **SQL インジェクション**: 利用者の入力などを SQL の文に直接混ぜると、入力の中の文字が SQL の命令として読まれてしまう攻撃です。パラメーターを使うと、この問題を防げます。
- **`registerArgument`**: `QueryBuilder` に値と、その値の型を登録する関数です。登録された値は、文の印の位置に対応づけられます。
- **`TextColumnType()`**: 文字列を表す列の型です。登録する値が文字列であることを、データベースに伝えるために使われます。
- **`internal` な拡張関数**: 同じモジュールの中で使われる、`QueryBuilder` の機能です。

## 何をしているか

### 1. 値の型を指定して登録する

```kotlin:line-numbers=135
    registerArgument(TextColumnType(), value)
```

文字列の値を、`TextColumnType` という型と一緒に登録します。この関数は、SQL の文字列の書き出しを行いません。文の中には、登録した値の位置を示す印が後で入ります。

### 2. 値は SQL の一部にならない

登録された値は、データベースに別の経路で渡されます。そのため、値の中にどんな引用符や記号が含まれていても、SQL の命令として解釈されることはありません。値は、常に「データ」として扱われます。

## ここがすごい

- **値と命令を分けて渡す**: SQL の文は文の部分だけで決まり、値は別に届きます。混ざることがないので、安全性が仕組みで保たれています。
- **引用符の処理が要らない**: 前の記事の `appendStringLiteral` では、引用符を重ねる処理が必要でした。こちらは、その処理そのものが不要です。方言ごとの引用符の違いも、気にせずに済みます。
- **型を一緒に渡す**: 値の型を `TextColumnType` で明示するので、データベースは、どんな型として値を扱えばよいかを知ることができます。
- **1 行で済む簡潔さ**: 処理の中身は、登録の 1 行だけです。安全性の仕組みを、データベースの側の機能に任せています。

## まとめ

- 値は SQL の文に書き写さず、パラメーターとして別に渡すと、命令として解釈される心配がなくなる。
- 引用符を扱う処理を書かずに済むので、方言の違いの影響も受けにくい。
- 値の型を一緒に渡すと、データベースが正しく値を扱える。
