---
title: "改行の種類を数えて、各行の先頭位置を記録する"
description: "FastParse の lineNumberLookup。\\r\\n や \\n\\r などの改行を 1 つとして数えながら、各行が始まる位置を配列にする。1 回の走査で終わる小さな状態機械。"
language: scala
project: "FastParse"
repo: https://github.com/com-lihaoyi/fastparse
license: "MIT"
copyright: "Copyright (c) 2014 Li Haoyi (haoyi.sg@gmail.com)"
commit: "475d042bc267c53e3ac7d383dc01271cdb4862a6"
file: "fastparse/src/fastparse/internal/Util.scala"
lines: [49, 77]
format: 2
function: "lineNumberLookup"
difficulty: 3
tags: [文字列処理, 状態機械, 標準ライブラリ]
---

## ひとことで

Scala のパーサライブラリ FastParse の内部関数 `lineNumberLookup` です。文字列を 1 回だけ先頭から読み、各行が始まる位置を配列にして返します。`\r\n` のような 2 文字の改行は、1 つの改行として扱います。エラーの行番号を後で調べるための表になります。

## コード

::: code-group

```scala:line-numbers=49 [日本語訳]
  def lineNumberLookup(data: String): Array[Int] = {
    val lineStarts = ArrayBuffer[Int](0)
    var i = 0
    var col = 1
    // 直前に見た文字を保存します。\r\n か \n\r の組を見たばかりなら -1 を入れます。
    var state: Int = 0
    while (i < data.length){
      val char = data(i)
      if (char == '\r' && state == '\n' || char == '\n' && state == '\r'){
        col += 1
        state = -1
      } else if (state == '\r' || state == '\n' || state == -1) {
        lineStarts.append(i)
        col = 1
        state = char
      }else{
        col += 1
        state = char
      }

      i += 1
    }

    if (state == '\r' || state == '\n' || state == -1) {
      lineStarts.append(i)
    }

    lineStarts.toArray
  }
```

```scala:line-numbers=49 [原文]
  def lineNumberLookup(data: String): Array[Int] = {
    val lineStarts = ArrayBuffer[Int](0)
    var i = 0
    var col = 1
    // Stores the previous char we saw, or -1 if we just saw a \r\n or \n\r pair
    var state: Int = 0
    while (i < data.length){
      val char = data(i)
      if (char == '\r' && state == '\n' || char == '\n' && state == '\r'){
        col += 1
        state = -1
      } else if (state == '\r' || state == '\n' || state == -1) {
        lineStarts.append(i)
        col = 1
        state = char
      }else{
        col += 1
        state = char
      }

      i += 1
    }

    if (state == '\r' || state == '\n' || state == -1) {
      lineStarts.append(i)
    }

    lineStarts.toArray
  }
```

:::

## 前提知識

- 改行には、`\n`（LF）、`\r`（CR）、`\r\n`（Windows の形式）などがあります。
- `ArrayBuffer[Int](0)` は、最初に 0 を入れた可変の配列です。0 は最初の行の先頭位置です。
- 「状態機械」は、今の状態と次の文字によって、動きを決める仕組みです。ここでは `state` 変数がその状態を表します。
- `data(i)` は文字列の i 番目の文字を取り出します。
- `toArray` は、可変の配列を普通の配列に変換します。

## 何をしているか

### 1. 直前の文字と組になる改行を見る

`\r\n` や `\n\r` の組を見つけたら、行の番号を増やさずに、`state` を -1 にします。2 文字をまとめて 1 つの改行として扱うためです。

```scala:line-numbers=57
      if (char == '\r' && state == '\n' || char == '\n' && state == '\r'){
        col += 1
        state = -1
```

### 2. 改行のあとの最初の文字で行を始める

前の文字が改行だったとき（または直前が組の改行だったとき）、今の位置 `i` を新しい行の先頭として記録します。

```scala:line-numbers=60
      } else if (state == '\r' || state == '\n' || state == -1) {
        lineStarts.append(i)
        col = 1
        state = char
```

### 3. 最後の行の扱い

文字列の終わりで、直前が改行だった場合は、末尾の位置も行の先頭として追加します。ファイルの最後が改行で終わるときに、空の行を数えるための処理です。

## ここがすごい

- 1 回の走査だけで、行の数も行の先頭も同時に求めます。文字列を行ごとに分けてから数えるより、メモリも時間も少なくなります。
- `\r\n` を 1 つにまとめる処理が、`state` の値 -1 だけで表されています。特別な変数を増やさずに、状態を 1 つの整数で持っています。
- 文字の種類で状態を切り替える作りは、正規表現を使わずに、手で書いた状態機械の典型です。
- 結果は `Array[Int]` で返すので、後から行番号を二分探索で求められます。エラー位置を表示するときの速さにつながります。

## まとめ

- 改行を数えるには、直前の文字を状態として覚えると、2 文字の改行を正しく扱えます。
- 1 回の走査で、行の先頭位置の表が作れます。
- 整数 1 つの状態で、小さな状態機械は十分に書けます。
