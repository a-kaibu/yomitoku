---
title: "/* から */ までの読み飛ばしを一度に行う"
description: "JSON を寛容に読むとき、/* と */ で囲まれたコメントを、閉じの印を探して一度に読み飛ばす skipToEndOfBlockComment。見つからなければ残りをすべて捨て、見つかったかを返す。"
language: kotlin
project: "Moshi"
repo: https://github.com/square/moshi
license: Apache-2.0
copyright: "Copyright (C) 2010 Square, Inc."
commit: "889013ec2edb8d8034902662a1dc8c4f3b3f8111"
file: moshi/src/main/java/com/squareup/moshi/-JsonUtf8Reader.kt
lines: [1142, 1147]
function: "JsonUtf8Reader.skipToEndOfBlockComment"
difficulty: 2
tags: [入出力, パース, 文字列処理]
format: 2
---

## ひとことで

`skipToEndOfBlockComment()` は、JSON を寛容な形で読むときに、`/* ... */` というコメントの **閉じの印まで** をまとめて読み飛ばす関数です。コメントの中身は、値として使わないので、捨ててしまえば十分です。

Moshi（JSON を Kotlin や Java のオブジェクトに変換するライブラリ）の読み取り側で、コメントを許すモードのときに使われます。

## コード

```kotlin:line-numbers=1142
  private fun skipToEndOfBlockComment(): Boolean {
    val index = source.indexOf(CLOSING_BLOCK_COMMENT)
    val found = index != -1L
    buffer.skip(if (found) index + CLOSING_BLOCK_COMMENT.size else buffer.size)
    return found
  }
```

## 前提知識

- **寛容な JSON（lenient）**: 標準の JSON では許されない書き方を、特別なモードで受け入れる仕組みです。コメントは、その一つです。
- **ブロックコメント**: `/*` で始まり、`*/` で終わる、複数行にわたるコメントです。
- **バッファ（`buffer`）**: 読み込んだデータを一時的に溜めておく箱です。`skip` で、先頭から指定の量を捨てられます。
- **`indexOf`**: バイト列の中で、指定したパターンが最初に現れる位置を返す関数です。見つからなければ `-1` になります。
- **`found`**: 閉じの印が見つかったかどうかを表す真偽値です。

## 何をしているか

### 1. 閉じの印の位置を探す

```kotlin:line-numbers=1143
    val index = source.indexOf(CLOSING_BLOCK_COMMENT)
```

入力の中から、コメントを閉じる印を探します。印の位置が分かれば、そこまで読み飛ばせます。

### 2. 見つかったかどうかを記録する

```kotlin:line-numbers=1144
    val found = index != -1L
```

見つからなければ `-1` になるので、それを真偽値に直します。

### 3. 見つかった所まで、見つからなければ全部捨てる

```kotlin:line-numbers=1145
    buffer.skip(if (found) index + CLOSING_BLOCK_COMMENT.size else buffer.size)
```

見つかったときは、閉じの印の最後まで進めます。見つからなければ、バッファにある残りをすべて捨てます。

```kotlin:line-numbers=1146
    return found
```

最後に、閉じの印が見つかったかを返します。呼び出し側は、この結果で「コメントが閉じていない」というエラーを出せます。

## ここがすごい

- **まとめて読み飛ばす**: 1 文字ずつ状態を調べながら進む代わりに、閉じの印をまとめて探します。長いコメントでも、速く進められます。
- **見つからなくても止まらない**: 見つからなければ残りを捨てて、結果だけを返します。エラーを出すかどうかは、呼び出し側が決めます。
- **印の長さを使う**: `index + CLOSING_BLOCK_COMMENT.size` で、印の長さを考慮して進めます。印を飛び越えたまま、次の読み取りに入ることがありません。
- **結果の受け渡しが明快**: 戻り値の真偽で、閉じたかどうかを伝えます。関数の中で例外を投げないので、読み取りの流れを途中で壊しません。

## まとめ

- `skipToEndOfBlockComment` は、`/* ... */` の閉じの印までを、一度に探して読み飛ばす。
- 見つからなければ残りを捨て、戻り値の `false` で呼び出し側に伝える。
- 印の長さを含めて進めるので、印を読み残すことがない。
