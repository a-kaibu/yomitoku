---
title: "囲んでも直らない名前を見つけて止める failIfEscapeInvalid"
description: "囲んだ名前に、Kotlin の識別子に使えない記号が残っていないかを確かめる failIfEscapeInvalid。囲んでも直らない記号があれば、例外で止めて生成を失敗させる。"
language: kotlin
project: "KotlinPoet"
repo: https://github.com/square/kotlinpoet
license: Apache-2.0
copyright: "Copyright (C) 2015 Square, Inc."
commit: "537e8fac8fdecff22aad801a33557aa0d46b5730"
file: kotlinpoet/src/commonMain/kotlin/com/squareup/kotlinpoet/Util.kt
lines: [291, 298]
function: "String.failIfEscapeInvalid"
difficulty: 3
tags: [防御的プログラミング, 文字列処理, 型システム]
format: 2
---

## ひとことで

`failIfEscapeInvalid()` は、名前をバッククォートで囲んだあとに、**それでも使えない記号が残っていないか** を確かめる関数です。残っていれば例外で止めて、おかしなコードを生成しないようにします。

KotlinPoet は、名前にどんな文字が入っていても、できるだけ囲んで直そうとします。しかし、囲んでも Kotlin の識別子として正しくならない記号があります。その記号を見つけるのが、この関数の役目です。

## コード


::: code-group

```kotlin:line-numbers=291 [日本語訳]
private fun String.failIfEscapeInvalid() {
  // バッククォートで囲んだ識別子は、不正な文字を検査しない。
  // 囲んでも、常に正しい識別子になるとは限らないため。
  require(alreadyEscaped() || none { it in ILLEGAL_CHARACTERS_TO_ESCAPE }) {
    "Can't escape identifier $this because it contains illegal characters: " +
      ILLEGAL_CHARACTERS_TO_ESCAPE.intersect(this.toSet()).joinToString("")
  }
}
```

```kotlin:line-numbers=291 [原文]
private fun String.failIfEscapeInvalid() {
  // Don't check for illegal characters in escaped identifiers, even though escaping doesn't always
  // make an invalid identifier valid.
  require(alreadyEscaped() || none { it in ILLEGAL_CHARACTERS_TO_ESCAPE }) {
    "Can't escape identifier $this because it contains illegal characters: " +
      ILLEGAL_CHARACTERS_TO_ESCAPE.intersect(this.toSet()).joinToString("")
  }
}
```

:::

## 前提知識

- **`require`**: 条件が満たされないときに、例外を投げて止める関数です。引数の前提を確かめるのに使われます。
- **`alreadyEscaped()`**: 名前がすでにバッククォートで囲まれているかを返す関数です。囲まれていれば、中身の検査は省きます。
- **`none { ... }`**: 列の中に、条件を満たす要素が 1 つもないかを調べる関数です。
- **`ILLEGAL_CHARACTERS_TO_ESCAPE`**: 識別子に使えない記号の集合です。`.` や `/` や `:` などが入っています。
- **`intersect`**: 2 つの集合の共通部分を取る関数です。どの記号が問題だったかを、エラーメッセージに入れるために使われています。

## 何をしているか

### 囲みの有無で検査を分ける

```kotlin:line-numbers=294
  require(alreadyEscaped() || none { it in ILLEGAL_CHARACTERS_TO_ESCAPE }) {
```

囲まれている名前は、検査せずに通します。囲まれていない名前では、不正な記号が 1 つもないことを確かめます。`||` の左側が真なら、右側は調べられません。

### 不正な記号を名指しする

エラーのメッセージには、名前と、問題になった記号がそろって表示されます。どの記号を直せばよいかが、利用者にすぐ分かるようになっています。

## ここがすごい

- **囲みの有無で扱いを変える**: 囲まれた名前は、利用者が意図して囲んだものとして信頼します。囲まれていない名前だけを厳しく検査する、という使い分けです。
- **問題の場所をそのまま伝える**: 例外のメッセージに、不正な記号を並べて出します。推測させず、直す手がかりを渡しています。
- **`require` で早めに止める**: 不正な名前から、壊れたコードを生成する前に例外で止めます。失敗の原因が生成の途中で分かるので、調べやすくなります。
- **コメントで意図を残す**: 囲んでも直らない場合があると、コメントで説明されています。後から読む人が、検査を省いている理由を理解できます。

## まとめ

- `failIfEscapeInvalid` は、囲んだあとも残る不正な記号を見つけて、例外で生成を止める。
- 囲まれている名前は信頼し、囲まれていない名前だけを厳しく検査する。
- エラーメッセージに問題の記号を出して、直す手がかりを利用者に渡す。
