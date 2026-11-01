---
title: "文章を段落に切り分ける splitParagraphs"
description: "ヘルプ文の文字列を段落ごとに切り分ける splitParagraphs。コードブロックの中は改行を保ち、普通の文は空行や改行で区切る。正規表現の位置を進めながら 1 回ずつ切り出す。"
language: kotlin
project: "Clikt"
repo: https://github.com/ajalt/clikt
license: Apache-2.0
copyright: "Copyright 2018 AJ Alt"
commit: "fa2e48c54995a88d492f05568a64889d99994877"
file: clikt/src/commonMain/kotlin/com/github/ajalt/clikt/output/text.kt
lines: [35, 56]
function: "splitParagraphs"
difficulty: 3
tags: [文字列処理, 正規表現, 状態機械]
format: 2
---

## ひとことで

`splitParagraphs()` は、長い説明文を **段落ごとのリストに切り分ける** 関数です。Clikt（コマンドラインツールを作るためのライブラリ）が、コマンドのヘルプ文を表示するときに使っています。

普通の文は空行や改行で区切ります。一方、三連バッククォート（```）で囲まれた部分は、コード例として扱い、中の改行をそのまま残します。この 2 つを 1 本のループで見分けるのがこの関数の見どころです。

## コード

```kotlin:line-numbers=35
internal fun splitParagraphs(text: String): List<String> {
    val paragraphs = mutableListOf<String>()
    var i = TEXT_START_REGEX.find(text)?.range?.first ?: return emptyList()
    while (i < text.length) {
        val range = if (text.startsWith("```", startIndex = i)) {
            PRE_P_END_REGEX.find(text, i + 3)?.let {
                (it.range.first + 3)..it.range.last
            }
        } else {
            PLAIN_P_END_REGEX.find(text, i)?.let {
                when {
                    it.value.startsWith(NEL) -> it.range.first + 1..it.range.first + 1
                    it.value.endsWith("```") -> it.range.first..(it.range.last - 3)
                    else -> it.range
                }
            }
        } ?: text.length..text.length
        paragraphs += text.substring(i, range.first)
        i = range.last + 1
    }
    return paragraphs
}
```

## 前提知識

- **正規表現（Regex）**: 文字列の中から、決まった形の部分を探すための書き方です。`find(text, i)` は、位置 `i` から後ろで最初に一致した部分を返します。
- **`range`**: 一致した部分の開始と終了の位置です。`range.first` が開始、`range.last` が終了の位置を表します。
- **`?:`（エルビス演算子）**: 左側が `null` なら右側を使う書き方です。`?: return emptyList()` は、一致しなければ空のリストを返します。
- **`?.let { ... }`**: 左側が `null` でなければ、その値を `it` としてブロックを実行する書き方です。`null` のときは何もせず `null` になります。
- **`startsWith` と `endsWith`**: 文字列が特定の文字列で始まる、または終わるかを調べるメソッドです。

## 何をしているか

### 1. 最初の文字の位置を探す

```kotlin:line-numbers=37
    var i = TEXT_START_REGEX.find(text)?.range?.first ?: return emptyList()
```

空白でない最初の文字の位置を `i` に入れます。文字がなければ、段落も作らずに空のリストを返します。

### 2. 段落の終わりを見つけるまでループする

```kotlin:line-numbers=38
    while (i < text.length) {
```

`i` が文字列の最後に届くまで、段落を 1 つずつ切り出します。

### 3. コードブロックか普通の文かで探し方を変える

```kotlin:line-numbers=39
        val range = if (text.startsWith("```", startIndex = i)) {
```

今いる位置から三連バッククォートが始まっていれば、コードブロックとして終わりを探します。そうでなければ、普通の段落として探します。

### 4. 普通の段落の終わりを見つける

```kotlin:line-numbers=44
            PLAIN_P_END_REGEX.find(text, i)?.let {
```

空行や改行、あるいはコードブロックの開始の直前を、正規表現で探します。見つかった一致の中身によって、区切る位置を決め直します。

```kotlin:line-numbers=46
                    it.value.startsWith(NEL) -> it.range.first + 1..it.range.first + 1
```

一致が `NEL`（改行に似た特殊な文字）で始まる場合は、その文字の直後で区切ります。

### 5. 段落を切り出して、位置を進める

```kotlin:line-numbers=51
        } ?: text.length..text.length
```

一致しなければ、文字列の最後までを 1 つの段落とみなします。

```kotlin:line-numbers=52
        paragraphs += text.substring(i, range.first)
        i = range.last + 1
```

`i` から区切りの位置までを段落として追加し、`i` を区切りの次へ進めます。これを繰り返すと、最後の段落まで順に切り出されます。

## ここがすごい

- **1 本のループで 2 種類を扱う**: コードブロックと普通の文を、同じ `while` の中で分けています。どちらの場合も「`i` から区切りまでを切り出し、`i` を進める」という同じ後始末になっています。
- **正規表現を事前に作っておく**: `PLAIN_P_END_REGEX` などは、ファイルの先頭で一度だけ作られています。毎回作り直すと遅くなるので、この書き方は効率的です。
- **空の入力に強い**: 最初の文字が見つからなければ、ループに入らず空のリストを返します。特別な分岐を増やさずに済みます。
- **`range` の扱いで区切りを微調整できる**: 区切りの位置を `range` で表すと、「どこまでを段落に入れるか」を後から細かく変えられます。`NEL` や三連バッククォートの扱いは、この仕組みのおかげで短く書けています。

## まとめ

- `splitParagraphs` は、文章を段落に切り分け、コードブロックの中の改行は残す。
- 正規表現の一致位置を使って、切り出す範囲と次の開始位置を決める。
- 1 本のループで、普通の文とコードブロックの両方を扱える。
