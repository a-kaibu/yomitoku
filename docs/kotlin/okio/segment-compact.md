---
title: "半分以下の 2 つのセグメントを詰めて再利用する compact"
description: "末尾のセグメントと、その 1 つ前がどちらも半分以下のとき、データを前のセグメントへ移して末尾を再利用に戻す。書き込める空きがなければ何もしない。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "Copyright (C) 2014 Square, Inc."
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/Segment.kt
lines: [146, 155]
function: "Segment.compact"
difficulty: 2
tags: [メモリ管理, 最適化, データ構造]
format: 2
---

## ひとことで

Okio のバッファでは、データを読んだり書いたりするうちに、セグメント（8 キロバイトの区画）が **半分以下しか使われていない** 状態が生まれます。`compact()` は、そうした末尾のセグメントを前のセグメントに詰めて、空になった区画を **プールに返して再利用** します。

## コード


::: code-group

```kotlin:line-numbers=146 [日本語訳]
  fun compact() {
    check(prev !== this) { "cannot compact" }
    if (!prev!!.owner) return // 圧縮できない: prev は書き込み可能ではない
    val byteCount = limit - pos
    val availableByteCount = SIZE - prev!!.limit + if (prev!!.shared) 0 else prev!!.pos
    if (byteCount > availableByteCount) return // 圧縮できない: 書き込める空きが足りない
    writeTo(prev!!, byteCount)
    pop()
    SegmentPool.recycle(this)
  }
```

```kotlin:line-numbers=146 [原文]
  fun compact() {
    check(prev !== this) { "cannot compact" }
    if (!prev!!.owner) return // Cannot compact: prev isn't writable.
    val byteCount = limit - pos
    val availableByteCount = SIZE - prev!!.limit + if (prev!!.shared) 0 else prev!!.pos
    if (byteCount > availableByteCount) return // Cannot compact: not enough writable space.
    writeTo(prev!!, byteCount)
    pop()
    SegmentPool.recycle(this)
  }
```

:::

## 前提知識

- **`owner`**: そのセグメントの配列に書き込んでよいのは、持ち主（`owner`）だけです。共有されたものは、持ち主にもなれません。
- **`shared`**: 配列が別のバッファと共有されているかを表すフラグです。共有されていると、前のセグメントに空きがあっても、その位置には書けません。
- **`writeTo(sink, byteCount)`**: 自分の先頭から `byteCount` バイトを、`sink` の末尾へ移す関数です。
- **`pop()`**: 円の連結リストから自分を外す関数です。
- **`check(条件) { メッセージ }`**: 条件が偽なら、状態のエラー（`IllegalStateException`）を投げます。

## 何をしているか

### 1. 前のセグメントに書けるかを確かめる

前のセグメントは、持ち主でなければ書けないので、そこで終わります。

```kotlin:line-numbers=148
    if (!prev!!.owner) return
```

### 2. 空きが足りるかを確かめる

前のセグメントの残りの空きを計算し、移すデータが入らなければ、何もせず終わります。

```kotlin:line-numbers=150
    val availableByteCount = SIZE - prev!!.limit + if (prev!!.shared) 0 else prev!!.pos
```

### 3. 移して、自分を外して、再利用に戻す

データを前のセグメントへ移し、円から自分を外してから、プールに返します。

```kotlin:line-numbers=152
    writeTo(prev!!, byteCount)
    pop()
    SegmentPool.recycle(this)
```

## ここがすごい

- **無理をしない**: 書き込めないときや入りきらないときは、何もせずに戻ります。詰め直しは、あくまで最適化なので、失敗しても正しさは保たれます。
- **共有された配列には書かない**: 前のセグメントが共有されている場合は、その先の空きを数えません。共有された配列への書き込みは、ほかのバッファのデータを壊すからです。
- **プールへの返却で割り当てを減らす**: 空になったセグメントを捨てずに戻すので、次に必要なときに新しい配列を作らずに済みます。

## まとめ

- 半分以下のセグメントは、前に詰めて再利用に戻すと、メモリの無駄が減る。
- 詰める先に書けるか、空きがあるかを先に確かめる。
- 最適化の処理は、できないときに何もしなければ、正しさを壊さない。
