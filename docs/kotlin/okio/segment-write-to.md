---
title: "先頭のデータを別のセグメントの末尾へ移す writeTo"
description: "セグメントの先頭から指定の長さのバイトを、移し先のセグメントの末尾へコピーし、読み書きの位置を進める。移し先に入りきらなければ、先にデータを前へ詰める。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "\"Copyright (C) 2014 Square, Inc.\""
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/Segment.kt
lines: [158, 177]
function: "Segment.writeTo"
difficulty: 3
tags: [メモリ管理, 入出力, データ構造]
format: 2
---

## ひとことで

`writeTo(sink, byteCount)` は、自分の先頭から `byteCount` バイトを、**移し先のセグメント `sink` の末尾にコピー** する関数です。コピーのあと、自分の `pos` と、移し先の `limit` を、移した分だけ進めます。

データを 1 つのセグメントから別のセグメントへ運ぶときに使われます。`compact` で、末尾のデータを前のセグメントに移すときも、この関数を使います。

## コード


::: code-group

```kotlin:line-numbers=158 [日本語訳]
  fun writeTo(sink: Segment, byteCount: Int) {
    check(sink.owner) { "only owner can write" }
    if (sink.limit + byteCount > SIZE) {
      // byteCount バイトは sink の現在位置に入らない。先に sink をずらす
      if (sink.shared) throw IllegalArgumentException()
      if (sink.limit + byteCount - sink.pos > SIZE) throw IllegalArgumentException()
      sink.data.copyInto(sink.data, startIndex = sink.pos, endIndex = sink.limit)
      sink.limit -= sink.pos
      sink.pos = 0
    }

    data.copyInto(
      sink.data,
      destinationOffset = sink.limit,
      startIndex = pos,
      endIndex = pos + byteCount,
    )
    sink.limit += byteCount
    pos += byteCount
  }
```

```kotlin:line-numbers=158 [原文]
  fun writeTo(sink: Segment, byteCount: Int) {
    check(sink.owner) { "only owner can write" }
    if (sink.limit + byteCount > SIZE) {
      // We can't fit byteCount bytes at the sink's current position. Shift sink first.
      if (sink.shared) throw IllegalArgumentException()
      if (sink.limit + byteCount - sink.pos > SIZE) throw IllegalArgumentException()
      sink.data.copyInto(sink.data, startIndex = sink.pos, endIndex = sink.limit)
      sink.limit -= sink.pos
      sink.pos = 0
    }

    data.copyInto(
      sink.data,
      destinationOffset = sink.limit,
      startIndex = pos,
      endIndex = pos + byteCount,
    )
    sink.limit += byteCount
    pos += byteCount
  }
```

:::

## 前提知識

- **`owner`**: 配列に書き込んでよいのは、持ち主のセグメントだけです。移し先は持ち主でなければなりません。
- **`shared`**: 配列を別のバッファと共有しているかを表すフラグです。共有されていると、中身を動かせません。
- **`copyInto`**: 配列の一部を、別の配列の指定の位置にコピーする関数です。`startIndex` と `endIndex` で範囲を、`destinationOffset` で移し先の位置を決めます。
- **`check(条件) { メッセージ }`**: 条件が偽なら、状態のエラーを投げます。

## 何をしているか

### 1. 移し先の末尾に入りきるか確かめる

```kotlin:line-numbers=160
    if (sink.limit + byteCount > SIZE) {
```

移し先の末尾に、移すデータが入らないときは、先に移し先の中身を前へ詰めます。

### 2. 入らなければ、移し先の中身を前へ詰める

```kotlin:line-numbers=164
      sink.data.copyInto(sink.data, startIndex = sink.pos, endIndex = sink.limit)
      sink.limit -= sink.pos
      sink.pos = 0
```

移し先の有効なデータを配列の先頭へずらし、`limit` と `pos` を直します。共有されていれば、ずらせないので例外にします。

### 3. データを末尾へコピーする

```kotlin:line-numbers=169
    data.copyInto(
      sink.data,
      destinationOffset = sink.limit,
      startIndex = pos,
      endIndex = pos + byteCount,
    )
```

自分の `pos` から `byteCount` バイトを、移し先の `limit` の位置へコピーします。

### 4. 位置を進める

```kotlin:line-numbers=175
    sink.limit += byteCount
    pos += byteCount
```

移し先の有効な範囲を広げ、自分の読む位置を進めます。

## ここがすごい

- **データを 1 回だけコピー**: `copyInto` は、まとまった範囲を 1 回の処理で移します。1 バイトずつ書くより、ずっと速く動きます。
- **詰めてから書く**: 末尾に入らないときだけ、中身を前へ詰めます。必要なときだけ手間をかけるので、普段の処理は軽く動きます。
- **共有を壊さない**: 共有されたセグメントの中身は、ほかのバッファも読んでいるので動かせません。その場合は例外で止めて、データを守ります。
- **`pos` と `limit` だけを動かす**: 元のデータは、移したあとも位置が進むだけで、配列の中身は残ります。セグメントを使い回すときに、整合性を保ちやすくなります。

## まとめ

- 別のセグメントへのデータの移動は、範囲を指定した 1 回のコピーで行う。
- 移し先に入らないときだけ、先に中身を前へ詰める。
- 共有されたものは動かさず、例外で知らせる。
