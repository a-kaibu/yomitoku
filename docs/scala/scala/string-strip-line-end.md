---
title: "行の終わりの改行だけを、1 文字ずつ見て取り除く"
description: "Scala 標準ライブラリの StringOps.stripLineEnd。末尾の改行（\\n、\\r、\\r\\n）が 1 つあれば取り除き、なければ元の文字列をそのまま返す。末尾の 1 文字だけを見るので、長い文字列でも速い。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/StringOps.scala"
lines: [666, 676]
format: 2
function: "StringOps.stripLineEnd"
difficulty: 2
tags: [文字列処理, 標準ライブラリ]
---

## ひとことで

Scala の標準ライブラリにある `stripLineEnd` は、文字列の末尾の改行を 1 つだけ取り除きます。改行は `\n`、`\r`、`\r\n` のどれかを扱います。改行がなければ、文字列をそのまま返します。

## コード

```scala:line-numbers=666
  def stripLineEnd: String =
    if (s.isEmpty) s
    else {
      var i = s.length - 1
      val last = apply(i)
      if (!isLineBreak(last)) s
      else {
        if (i > 0 && isLineBreak2(apply(i - 1), last)) i -= 1
        s.substring(0, i)
      }
    }
```

## 前提知識

- 改行には、`\n`（LF）と `\r`（CR）があります。Windows の行末は `\r\n` の 2 文字です。
- Scala の `StringOps` は、標準の `String` に便利な操作を足す仕組みです。`s.stripLineEnd` のように呼べます。
- `apply(i)` は、文字列の `i` 番目の文字を返します。Scala では `s(i)` と同じ意味です。
- `s.substring(0, i)` は、先頭から `i` 文字目の手前までを切り出す操作です。
- 「末尾だけ見る」は、文字列の長さに関係なく、最後の 1 〜 2 文字だけを調べる、という意味です。

## 何をしているか

### 1. 空の文字列はそのまま返す

まず、文字列が空かどうかを調べます。空なら、何も取り除く必要がないので、そのまま返します。

```scala:line-numbers=667
    if (s.isEmpty) s
```

### 2. 末尾の 1 文字が改行かを調べる

最後の位置 `i` の文字を取り出して、改行かどうかを調べます。改行でなければ、元の文字列 `s` を返します。

```scala:line-numbers=670
      val last = apply(i)
      if (!isLineBreak(last)) s
      else {
```

### 3. 改行なら、`\r\n` の 2 文字かを確かめる

末尾が改行のときは、その 1 つ前の文字も見ます。前の文字が `\r` で、今の文字が `\n` なら、2 文字を両方取り除くために `i` を 1 つ戻します。

```scala:line-numbers=673
        if (i > 0 && isLineBreak2(apply(i - 1), last)) i -= 1
        s.substring(0, i)
      }
```

最後に `substring(0, i)` で、改行の手前までを返します。

## ここがすごい

- 文字列の全体を調べるのではなく、末尾の 1 〜 2 文字だけを見ます。長い文章でも、ほとんど仕事をしません。
- `\r\n` を 1 つの改行として扱うので、Windows の行末でも、取り除き忘れがありません。
- 改行がない場合は、新しい文字列を作らずに `s` をそのまま返します。余分なコピーが起きません。
- 補助の関数 `isLineBreak` と `isLineBreak2` に分けてあるので、改行の定義が 1 か所にまとまります。

## まとめ

- 末尾の改行は、末尾の文字を見るだけで判定できます。
- `\r\n` の 2 文字を忘れずに扱うと、どの OS の行末でも正しく取り除けます。
- 変更がない場合は元の値を返すと、無駄なコピーを避けられます。
