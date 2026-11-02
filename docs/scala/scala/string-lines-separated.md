---
title: "改行で区切った行を、コピーせずに 1 行ずつ切り出す"
description: "Scala 標準ライブラリの StringOps の内部関数 linesSeparated。改行（\\n、\\r、\\r\\n）の位置を見て、文字列の一部を substring で切り出す。Iterator を作って、行を 1 つずつ返す。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/StringOps.scala"
lines: [692, 711]
format: 2
function: "StringOps.linesSeparated"
difficulty: 3
tags: [文字列処理, イテレータ, 標準ライブラリ]
---

## ひとことで

Scala の `StringOps` には、文字列を行ごとに取り出す `lines` や `linesIterator` があります。その中心にあるのが `linesSeparated` です。改行の位置を探しながら、行を 1 つずつ `Iterator` として返します。全体を配列に分けてから返すのではありません。

## コード

```scala:line-numbers=692
  private def linesSeparated(stripped: Boolean): Iterator[String] = new AbstractIterator[String] {
    def hasNext: Boolean = !done
    def next(): String = if (done) Iterator.empty.next() else advance()

    private[this] val len = s.length
    private[this] var index = 0
    @inline private def done = index >= len
    private def advance(): String = {
      val start = index
      while (!done && !isLineBreak(apply(index))) index += 1
      var end   = index
      if (!done) {
        val c = apply(index)
        index += 1
        if (!done && isLineBreak2(c, apply(index))) index += 1
        if (!stripped) end = index
      }
      s.substring(start, end)
    }
  }
```

## 前提知識

- `Iterator` は、要素を 1 つずつ取り出す仕組みです。`hasNext` で続きがあるかを確かめ、`next()` で次の要素を取ります。
- `AbstractIterator` は、`hasNext` と `next` を書くだけで `Iterator` になる、標準ライブラリの基底の型です。
- `substring(start, end)` は、文字列の `start` から `end` の手前までを切り出します。コピーを作るので、切り出した分だけ新しい文字列が生まれます。
- `private[this] var index` は、今どこまで読んだかを覚えておく変数です。外からは見えません。
- `stripped` は、改行の文字を行の末尾に残すかを決める引数です。`lines` では取り除き、`linesWithSeparators` では残します。

## 何をしているか

### 1. 読んだ位置を覚えておくための変数を用意する

`len` は文字列の長さ、`index` は今の読む位置です。`done` は、末尾まで読み終わったかを表す判定です。

```scala:line-numbers=697
    private[this] var index = 0
    @inline private def done = index >= len
    private def advance(): String = {
      val start = index
```

### 2. 改行の手前まで、位置を進める

`advance` は 1 行ぶんを読みます。まず `start` に今の位置を覚えておき、改行の文字が見つかるまで `index` を進めます。

```scala:line-numbers=700
      val start = index
      while (!done && !isLineBreak(apply(index))) index += 1
      var end   = index
      if (!done) {
```

### 3. 改行を読み飛ばし、行を切り出す

改行の文字を 1 つ読み、もし `\r\n` なら、続けて `\n` も読み飛ばします。`stripped` が偽なら、改行まで含めた位置を行の終わりにします。最後に `substring` で行を切り出して返します。

```scala:line-numbers=704
        val c = apply(index)
        index += 1
        if (!done && isLineBreak2(c, apply(index))) index += 1
        if (!stripped) end = index
      }
      s.substring(start, end)
```

## ここがすごい

- 行の位置を 1 回の走査で見つけて、そのまま切り出します。行の一覧を先に作らないので、大きな文字列でも最初の行はすぐに返ります。
- `hasNext` は `done` を見るだけで答えられます。次の行を探すのは `next()` を呼んだときだけなので、遅延評価になっています。
- `\r\n` と `\r` と `\n` を 1 か所の条件で扱います。改行の種類が増えても、この関数だけを直せば済みます。
- `stripped` の 1 つの引数で、2 つの API（改行を除く版と、残す版）を共通の関数で作っています。

## まとめ

- 文字列を行に分けるには、改行の位置を探しながら、必要な行だけを順に返すと効率的です。
- `Iterator` の中で状態を持つと、遅延した行の取り出しが書けます。
- 改行の扱いを 1 つの関数に集めると、仕様の違いを引数で切り替えられます。
