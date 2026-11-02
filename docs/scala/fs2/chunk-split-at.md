---
title: "2 つに分けるとき、範囲外の位置は元のチャンクを流用する"
description: "fs2 の Chunk.splitAt。位置 n が 0 以下や要素数以上なら、コピーを作らず元のチャンクや空のチャンクを返す。それ以外だけ実際に分ける。"
language: scala
project: "fs2"
repo: https://github.com/typelevel/fs2
license: "MIT"
copyright: "Copyright (c) 2013 Functional Streams for Scala"
commit: "e6e15a88629f1dd6525c5a7e85c817cba3f22d0c"
file: "core/shared/src/main/scala/fs2/Chunk.scala"
lines: [305, 308]
format: 2
function: "Chunk.splitAt"
difficulty: 2
tags: [データ構造, 最適化, 防御的プログラミング]
---

## ひとことで

fs2 の `Chunk` は、要素をまとめて持つ不変の入れ物です。`splitAt` は、位置 `n` でチャンクを 2 つに分けます。`n` が範囲の外にあるときは、コピーをせずに元のチャンクや空のチャンクを返します。`take` や `drop` も、この `splitAt` の上に作られています。

## コード

```scala:line-numbers=305
  def splitAt(n: Int): (Chunk[O], Chunk[O]) =
    if (n <= 0) (Chunk.empty, this)
    else if (n >= size) (this, Chunk.empty)
    else splitAtChunk_(n)
```

## 前提知識

- `Chunk[O]` は、`O` 型の要素を順番に持つ、まとめ単位のデータです。
- `(Chunk[O], Chunk[O])` は、2 つのチャンクを組にした値です。
- `Chunk.empty` は、要素が 1 つもない空のチャンクです。
- `size` は、チャンクの要素数です。
- `n <= 0` や `n >= size` は、分割する位置が範囲の外にある場合を指します。

## 何をしているか

### 1. 位置が 0 以下なら、左は空、右は元のチャンク

`n` が 0 以下のときは、分ける意味がありません。左は空のチャンク、右は元のチャンクをそのまま返します。

```scala:line-numbers=306
    if (n <= 0) (Chunk.empty, this)
```

### 2. 位置が要素数以上なら、左は元のチャンク、右は空

`n` が要素数以上のときも、同じように分ける必要がありません。左に全部、右に何もない形を返します。

```scala:line-numbers=307
    else if (n >= size) (this, Chunk.empty)
```

### 3. 範囲の中のときだけ、本当に分ける

それ以外の場合は、範囲内なので、`splitAtChunk_` で実際に 2 つに分けます。この関数は、型ごとに最適な方法を選べるように、サブクラスで実装されています。

```scala:line-numbers=308
    else splitAtChunk_(n)
```

## ここがすごい

- 範囲外の場合は、新しい配列を作らずに、既存の値を返します。不要なコピーを避けられます。
- `take` と `drop` は、どちらも `splitAt` の片側を取るだけです。範囲外の処理を、一箇所にまとめています。
- 実際に分ける処理を `splitAtChunk_` に任せ、型ごとの速い方法を差し込めるようにしています。
- 範囲の判定を先にするので、`n` が負の値でも、要素数を超える値でも、安全に動きます。

## まとめ

- `splitAt` は、位置 `n` で 2 つのチャンクに分けます。
- 範囲外なら、コピーせず元の値か空の値を返します。
- 範囲内だけ、型に応じた `splitAtChunk_` で分けます。
