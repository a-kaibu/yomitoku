---
title: "長い文章を幅に合わせて折り返す wrapText"
description: "文字列を指定した幅で折り返し、段落ごとに間を空ける wrapText。最初の行と 最初の行以外で別々の字下げを付けられる。"
language: kotlin
project: "Clikt"
repo: https://github.com/ajalt/clikt
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "fa2e48c54995a88d492f05568a64889d99994877"
file: clikt/src/commonMain/kotlin/com/github/ajalt/clikt/output/text.kt
lines: [5, 23]
function: "String.wrapText"
difficulty: 2
tags: [文字列処理, イディオム, 防御的プログラミング]
format: 2
---

## ひとことで

`wrapText()` は、長い文字列を **指定した幅で折り返す** 関数です。Clikt のヘルプ表示で、画面の幅に合わせて文章を整えるために使われています。

段落ごとに分けてから、それぞれを折り返します。段落と段落のあいだには空行を入れます。最初の行と 最初の行以外で、別々の字下げを付けられるのも特徴です。

## コード

```kotlin:line-numbers=5
internal fun String.wrapText(
    sb: StringBuilder,
    width: Int = 78,
    initialIndent: String = "",
    subsequentIndent: String = "",
) {
    require(initialIndent.length < width) { "initialIndent >= width: ${initialIndent.length} >= $width" }
    require(subsequentIndent.length < width) { "subsequentIndent >= width: ${subsequentIndent.length} >= $width" }

    for ((i, paragraph) in splitParagraphs(this).withIndex()) {
        if (i > 0) sb.append("\n\n")
        sb.wrapParagraph(
            paragraph,
            width,
            if (i == 0) initialIndent else subsequentIndent,
            subsequentIndent
        )
    }
}
```

## 前提知識

- **拡張関数 `String.wrapText`**: `String` に後から足された関数です。`text.wrapText(sb, ...)` と呼べます。
- **`StringBuilder`**: 文字列を少しずつ組み立てるための箱です。結果は直接この箱に書き込まれます。
- **デフォルト引数**: `width = 78` のように、省略したときの値を決めておく仕組みです。呼び出し側は必要なものだけを書けます。
- **`require`**: 条件が満たされないとき、例外を投げて止める関数です。引数の誤りを早めに知らせるために使われます。
- **`withIndex()`**: 列の要素と、その番号（0 から始まる）を一緒に取り出せるようにする関数です。

## 何をしているか

### 1. 字下げが幅より小さいことを確かめる

```kotlin:line-numbers=11
    require(initialIndent.length < width) { "initialIndent >= width: ${initialIndent.length} >= $width" }
```

最初の字下げが、折り返しの幅より狭くなければ、そもそも文字を置けません。その場合は例外で止めます。最初の行以外の字下げも同じように確かめます。

### 2. 段落ごとに折り返す

```kotlin:line-numbers=14
    for ((i, paragraph) in splitParagraphs(this).withIndex()) {
```

まず `splitParagraphs` で段落に分け、番号付きで順番に取り出します。番号 `i` は、最初の段落かどうかを判定するために使います。

```kotlin:line-numbers=15
        if (i > 0) sb.append("\n\n")
```

2 つ目以降の段落の前には、空行を入れます。

```kotlin:line-numbers=16
        sb.wrapParagraph(
            paragraph,
            width,
            if (i == 0) initialIndent else subsequentIndent,
            subsequentIndent
        )
```

段落ごとの折り返しを、別の関数に任せています。最初の段落だけ最初の字下げを使い、残りは 最初の行以外の字下げを使います。

## ここがすごい

- **段落を先に分ける**: 折り返しの処理は、段落の中だけを見ればよくなります。空行の扱いを、この関数の中でまとめて決められます。
- **字下げを 2 種類持てる**: 箇条書きのように、最初の行だけ記号を付けて残りを字下げする、という書き方がそのまま表せます。
- **前提を先に確かめる**: `require` で、字下げが幅より狭いことを先に確かめています。おかしな引数で、途中の処理が意味不明な結果にならないようにしています。
- **`StringBuilder` を引数で受け取る**: 結果を新しい文字列として返すのではなく、既存の箱に書き足します。大きなヘルプ文を組み立てるときに、無駄な文字列のコピーを減らせます。

## まとめ

- `wrapText` は、段落ごとに指定の幅で折り返し、段落の間に空行を入れる。
- 最初の行と 最初の行以外で、別の字下げを指定できる。
- 引数の前提を `require` で確かめてから、本来の処理を始める。
