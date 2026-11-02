---
title: "行頭の区切り文字を外して、複数行の文字列をきれいにする"
description: "Scala の StringOps.stripMargin。各行の先頭の空白と制御文字を飛ばし、「|」があればそれを取り除く。改行は残すので、複数行の文字列を読みやすく書ける。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/StringOps.scala"
lines: [757, 769]
format: 2
function: "StringOps.stripMargin"
difficulty: 2
tags: [文字列処理, 標準ライブラリ, イディオム]
---

## ひとことで

Scala の `stripMargin` は、複数行の文字列の各行から、行頭にある区切り文字（既定では `|`）を取り除きます。ソースコードの中でインデントを揃えて書いた文字列を、きれいに整形するための関数です。改行は、そのまま残します。

## コード

```scala:line-numbers=757
  def stripMargin(marginChar: Char): String = {
    val sb = new JStringBuilder(s.length)
    for (line <- linesWithSeparators) {
      val len = line.length
      var index = 0
      while (index < len && line.charAt(index) <= ' ') index += 1
      val stripped =
        if (index < len && line.charAt(index) == marginChar) line.substring(index + 1)
        else line
      sb.append(stripped)
    }
    sb.toString
  }
```

## 前提知識

- 複数行の文字列は、ソースコードの中で `"""` で囲んで書けます。インデントを揃えると、ソースが読みやすくなります。
- `StringBuilder` は、文字列を少しずつ組み立てるための可変の入れ物です。`append` で後ろに足します。
- `linesWithSeparators` は、改行の文字を含んだまま行ごとに分けたものを返します。
- `charAt(index) <= ' '` は、空白や制御文字（タブや改行を含む）を判定するための比較です。
- `substring(index + 1)` は、位置 `index + 1` 以降の文字列を取り出します。

## 何をしているか

### 1. 行頭の空白と制御文字を飛ばす

各行について、先頭から空白と制御文字を飛ばします。`<= ' '` は、ASCII の空白記号より小さい文字をすべて含むので、タブも含まれます。

```scala:line-numbers=762
      while (index < len && line.charAt(index) <= ' ') index += 1
```

### 2. 区切り文字があれば、その後ろだけを残す

飛ばした位置の文字が区切り文字 `marginChar` なら、その 1 文字を取り除いて後ろを残します。区切り文字でなければ、その行は変えずに残します。

```scala:line-numbers=764
        if (index < len && line.charAt(index) == marginChar) line.substring(index + 1)
        else line
```

### 3. 改行を残して、結果をつなげる

整形した各行を `StringBuilder` に順に足し、最後に文字列にします。`linesWithSeparators` を使っているので、改行の文字もそのまま残ります。

## ここがすごい

- 改行の扱いを `linesWithSeparators` に任せることで、改行の種類（`\n` か `\r\n` か）を気にせず、元の形を保ったまま処理できます。
- 区切り文字がない行は、そのまま残すので、途中に普通の行が混ざっていても壊しません。
- `StringBuilder` の大きさを最初に決めておくと、途中の再割り当てが減ります。
- 空白の判定を `<= ' '` の 1 つの比較で済ませています。文字の種類ごとの判定を書かなくて済む、短い書き方です。

## まとめ

- 複数行の文字列は、各行の先頭の区切りを飛ばしながら、改行を残して整形できます。
- 改行は元のまま残すと、どの環境でも形を崩しません。
- 文字の範囲を 1 つの比較で判定すると、コードが短くなります。
