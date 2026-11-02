---
title: "可変のリストを、共有しても安全な形で不変の List に渡す"
description: "Scala 標準ライブラリの ListBuffer.toList。ListBuffer の内部で作った List を、以後は変えない不変のリストとして渡す。書き込みの順序が他のスレッドから見えるように、メモリのフェンスを入れる。"
language: scala
project: "Scala"
repo: https://github.com/scala/scala
license: "Apache-2.0"
copyright: "Copyright EPFL and Lightbend, Inc. dba Akka"
commit: "e3bab8ccfe5a2283d84798e642dd8d8d2dd5565e"
file: "src/library/scala/collection/mutable/ListBuffer.scala"
lines: [83, 90]
format: 2
function: "ListBuffer.toList"
difficulty: 3
tags: [並行処理, データ構造, メモリ管理]
---

## ひとことで

Scala の `ListBuffer` は、要素を後ろに足していける可変のリストです。`toList` は、その中身を不変の `List` として取り出します。取り出した `List` は、以後変わらないものとして、ほかの処理やスレッドに安全に渡せます。

## コード

::: code-group

```scala:line-numbers=83 [日本語訳]
  override def toList: List[A] = {
    aliased = nonEmpty
    // ここまでに、List の tail への書き換えが何度も行われています。
    // その書き換えが、このバッファを使う側のほかのスレッドから見えるようにします。
    // このリストを、ほかのスレッドと共有する予定があるためです。
    releaseFence()
    first
  }
```

```scala:line-numbers=83 [原文]
  override def toList: List[A] = {
    aliased = nonEmpty
    // We've accumulated a number of mutations to `List.tail` by this stage.
    // Make sure they are visible to threads that the client of this ListBuffer might be about
    // to share this List with.
    releaseFence()
    first
  }
```

:::

## 前提知識

- `List` は、先頭に要素を足すのが速い、不変の連結リストです。`ListBuffer` は、内部でそのリストの末尾を書き換えながら、後ろに要素を足していきます。
- 不変の `List` を外に渡したあとは、その中身を変えてはいけません。そのため、`toList` は書き換えが終わったことを確かめてから返します。
- 「メモリフェンス（memory fence）」は、書き込みと読み出しの順番を、ほかのスレッドから見て正しく保つための命令です。
- `aliased` は、`ListBuffer` の中身が外から見える状態になったかを表す印です。次に後ろへ足すときに、リストを作り直すかどうかを決めます。
- `first` は、リストの先頭です。`toList` は、この先頭をそのまま返します。

## 何をしているか

### 1. 外に見えるようになったという印をつける

`aliased = nonEmpty` で、ListBuffer の中身が外へ渡されたことを記録します。空なら印は偽です。以後に後ろへ足すときは、外のリストを壊さないように、作り直す必要があるかを判断できます。

```scala:line-numbers=84
    aliased = nonEmpty
```

### 2. 書き換えが他のスレッドから見えるようにする

`releaseFence()` は、それまでに行った `tail` の書き換えを、ほかのスレッドから正しい順序で見えるようにする命令です。ここで書き込みを確定させてから、リストを渡します。

```scala:line-numbers=85
    // We've accumulated a number of mutations to `List.tail` by this stage.
    // Make sure they are visible to threads that the client of this ListBuffer might be about
    // to share this List with.
    releaseFence()
```

### 3. 先頭を返す

最後に、先頭の `first` を返します。このリストは、以後 `ListBuffer` が書き換えないものとして扱われます。

```scala:line-numbers=89
    first
```

## ここがすごい

- 可変のバッファの中身を、コピーせずに不変のリストとして渡せます。`toList` の中では新しいリストを作りません。
- 印 `aliased` を使うことで、外に渡したリストを、後の追加で壊さないようにしています。
- 別のスレッドに渡しても正しく見えるように、書き込みの順序を明示しています。並行処理での落とし穴を、1 つの命令で防いでいます。
- 同じ仕組みで、`result()` も `toList` を呼ぶだけになっています。入り口を 1 つにまとめた書き方です。

## まとめ

- 可変の入れ物から不変の値を取り出すときは、コピーを避けつつ、外へ渡す前に印をつけます。
- 別のスレッドと共有するデータは、書き込みの順序を保証してから渡します。
- 複数の入り口を 1 つの処理に集めると、保守がしやすくなります。
