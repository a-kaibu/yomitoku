---
title: "行の終わりまで読み飛ばす skipToEndOfLine"
description: "寛容な JSON の行コメントを、改行の文字が現れるところまで読み飛ばす skipToEndOfLine。改行が見つからなければ残りをすべて捨てる。"
language: kotlin
project: "Moshi"
repo: https://github.com/square/moshi
license: Apache-2.0
copyright: "Copyright (C) 2010 Square, Inc."
commit: "889013ec2edb8d8034902662a1dc8c4f3b3f8111"
file: moshi/src/main/java/com/squareup/moshi/-JsonUtf8Reader.kt
lines: [1136, 1139]
function: "JsonUtf8Reader.skipToEndOfLine"
difficulty: 2
tags: [入出力, パース, 文字列処理]
format: 2
---

## ひとことで

`skipToEndOfLine()` は、JSON を寛容な形で読むときに、`//` で始まる **行コメント** を読み飛ばすための関数です。改行の文字が現れるところまで進めます。

Moshi（JSON を Kotlin や Java のオブジェクトに変換するライブラリ）の読み取り側で使われます。

## コード

```kotlin:line-numbers=1136
  private fun skipToEndOfLine() {
    val index = source.indexOfElement(LINEFEED_OR_CARRIAGE_RETURN)
    buffer.skip(if (index != -1L) index + 1 else buffer.size)
  }
```

## 前提知識

- **行コメント**: `//` から行の終わりまでを、コメントとして扱う書き方です。寛容な JSON で受け入れられます。
- **改行の文字**: 行の終わりを表す文字です。`\n`（改行）と `\r`（復帰）の 2 種類があります。Windows では `\r\n` の組で書かれます。
- **`indexOfElement`**: 指定した文字のどれかが最初に現れる位置を返す関数です。見つからなければ `-1` を返します。
- **`buffer.skip`**: 読み込みの箱から、先頭の指定した量を捨てる関数です。
- **`LINEFEED_OR_CARRIAGE_RETURN`**: 改行と復帰の 2 種類を、まとめて表す定数です。

## 何をしているか

### 1. 改行の位置を探す

```kotlin:line-numbers=1137
    val index = source.indexOfElement(LINEFEED_OR_CARRIAGE_RETURN)
```

`\n` か `\r` のどちらかが最初に現れる位置を探します。どちらでもよいので、1 回の検索で済みます。

### 2. 改行の次まで捨てる

```kotlin:line-numbers=1138
    buffer.skip(if (index != -1L) index + 1 else buffer.size)
```

改行が見つかったら、その 1 文字の次まで読み飛ばします。見つからなければ、残りをすべて捨てます。

### 具体例

次のような入力を考えます。

```
{"a": 1} // メモ
{"b": 2}
```

最初の `{"a": 1}` を読んだあと、空白を飛ばした先に `//` が見つかります。そこで行コメントとみなし、`メモ` の文字と改行をまとめて読み飛ばします。次に読み取るのは、改行の次の行の `{` です。こうして、コメントが値の列の間に入っていても、読み取りの流れは乱れません。

コメントの中身は、どの値にも対応しないので、捨てても困ることがありません。捨てる範囲を改行で区切ることで、コメントがどこまで続くかが、誰にでも分かる形になります。もし改行がないまま入力が終われば、残りの文字がすべて捨てられ、読み取りは終わりに向かいます。

## ここがすごい

- **2 種類の改行を 1 回で探す**:: `\n` と `\r` を別々に探すと、2 回の検索が必要です。どちらか先に来た方を見つけるので、効率が良くなります。
- **改行の次まで進める理由**: 改行そのものを捨てておくと、次の読み取りが自然に始まります。
- **`\r\n` の扱いは呼び出し側へ**: 関数の説明にあるとおり、`\r\n` の `\n` は、呼び出し側の空白として読み飛ばされます。この関数は、最初に見つかった改行で止まるだけです。
- **見つからなくても終わる**: 最後まで改行がなくても、残りを捨てて終わります。ファイルの最後の行がコメントでも、問題なく読めます。

## まとめ

- `skipToEndOfLine` は、行コメントを、改行の文字の次まで読み飛ばす。
- `\n` と `\r` のどちらでも止まるように、1 回の検索で探す。
- `\r\n` の後半は、呼び出し側が空白として扱う前提になっている。
