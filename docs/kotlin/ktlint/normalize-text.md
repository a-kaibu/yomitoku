---
title: "改行の形をそろえて BOM を取り除く normalizeText"
description: "検査の前に、Windows の改行（\\r\\n）と古い Mac の改行（\\r）を \\n にそろえ、先頭の BOM（目に見えない目印の文字）を取り除く normalizeText。順番が大事な小さな前処理。"
language: kotlin
project: "ktlint"
repo: https://github.com/pinterest/ktlint
license: MIT
copyright: "Copyright 2026 Ktlint, Copyright 2019-2026 Pinterest, Inc., Copyright 2016-2019 Stanley Shyiko"
commit: "5775b58d0f996e84c9c67205342f1c5620de6a4a"
file: ktlint-rule-engine/src/main/kotlin/io/github/ktlint/core/rule/engine/internal/RuleExecutionContext.kt
lines: [320, 330]
function: "RuleExecutionContext.normalizeText"
difficulty: 2
tags: [文字列処理, 防御的プログラミング, 可読性]
format: 2
---

## ひとことで

`normalizeText()` は、コードの文字列を検査にかける前に、**改行の形をそろえて、先頭の BOM を取り除く** 関数です。ktlint（Kotlin の書式を検査するツール）が、コードを解析する前に通す前処理です。

Windows のファイルは `\r\n`、古い Mac のファイルは `\r`、Unix は `\n` で行を区切ります。どのファイルでも同じ扱いにするために、すべて `\n` に直します。

## コード

```kotlin:line-numbers=320
        private fun normalizeText(text: String): String =
            text
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .let {
                    if (it.startsWith(UTF8_BOM)) {
                        it.replaceFirst(UTF8_BOM, "")
                    } else {
                        it
                    }
                }
```

## 前提知識

- **改行の文字**: `\n`（改行、LF）と `\r`（復帰、CR）があります。`\r\n` は、Windows で使われる 2 文字の組です。
- **BOM（Byte Order Mark）**: UTF-8 のファイルの先頭に付くことがある、目に見えない目印の文字です。文字列の先頭に現れると、表示には出ませんが、検査の結果をずらすことがあります。
- **`replace`**: 文字列の中のある部分を、別の文字列に置き換える関数です。すべての一致が置き換わります。
- **`let`**: 値を `it` として受け取り、ブロックの結果を返す関数です。メソッドを連鎖させる途中で、条件分岐を入れるのに使えます。
- **`replaceFirst`**: 最初に一致した部分だけを置き換える関数です。

## 何をしているか

### 1. 2 種類の改行を \n にそろえる

```kotlin:line-numbers=322
                .replace("\r\n", "\n")
```

まず、`\r\n` の組を `\n` にします。

```kotlin:line-numbers=323
                .replace("\r", "\n")
```

そのあと、残った `\r` を `\n` にします。古い Mac の形式を、ここで受け止めます。

### 2. 先頭に BOM があれば取り除く

```kotlin:line-numbers=324
                .let {
                    if (it.startsWith(UTF8_BOM)) {
                        it.replaceFirst(UTF8_BOM, "")
                    } else {
                        it
                    }
                }
```

`let` で、改行をそろえた文字列を受け取ります。先頭が BOM で始まっていれば、その最初の 1 つを取り除きます。BOM がなければ、文字列をそのまま返します。

## ここがすごい

- **順番で結果が変わる**: `\r\n` を先に `\n` にしておくので、後で `\r` を置き換えるとき、`\r\n` の `\r` が二重に `\n` になることがありません。順番を入れ替えると、空行が余計に増えてしまいます。
- **改行の方式を 1 つにまとめる**: どの OS で作られたファイルでも、検査の中では同じ `\n` の形になります。ルールの作者は、改行の違いを気にしなくて済みます。
- **BOM を先頭だけで判定**: `startsWith` で確かめてから、最初の 1 つだけを取り除きます。文字列の途中にある同じ文字には触れません。
- **`let` で条件を連鎖に入れる**: 改行の置き換えの流れを崩さず、BOM の判定を最後に 1 つの式として書いています。

## まとめ

- `normalizeText` は、`\r\n` と `\r` を `\n` にそろえ、先頭の BOM を取り除く。
- 改行の置き換えは、`\r\n` を先に処理する順番が大切で、入れ替えると結果がずれる。
- BOM は先頭の 1 つだけを取り除き、途中の文字には触れない。
