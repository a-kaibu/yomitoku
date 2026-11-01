---
title: "大きければ共有、小さければコピーする split"
description: "Okio のバッファを構成するセグメントを 2 つに分ける split。分けた前半が大きければ配列を共有し、小さければ新しい領域にコピーする。性能の 2 つの目標のつり合いを取っている。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "Copyright (C) 2014 Square, Inc."
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/Segment.kt
lines: [120, 140]
function: "Segment.split"
difficulty: 3
tags: [メモリ管理, 最適化, データ構造]
format: 2
---

## ひとことで

Okio のバッファ（データを入れる箱）は、8 キロバイトずつの **セグメント** という区画をつないだものです。`split(byteCount)` は、その先頭のセグメントを **先頭の `byteCount` バイトと、残り** の 2 つに分けます。

前半のデータを別のバッファへ移すときなどに使われます。このとき、データを **コピーする** か **配列を共有する** かを、前半の大きさで決めています。

## コード


::: code-group

```kotlin:line-numbers=120 [日本語訳]
  fun split(byteCount: Int): Segment {
    require(byteCount > 0 && byteCount <= limit - pos) { "byteCount out of range" }
    val prefix: Segment

    // 2 つの相反する性能目標がある:
    //  - コピーを避ける。セグメントを共有して実現する。
    //  - 短い共有セグメントを避ける。これらは読み取り専用で、
    //    短いセグメントの長い鎖を生むので、性能に悪い。
    // この 2 つの目標のつり合いを取るため、コピーが大きくなるときだけセグメントを共有する。
    if (byteCount >= SHARE_MINIMUM) {
      prefix = sharedCopy()
    } else {
      prefix = SegmentPool.take()
      data.copyInto(prefix.data, startIndex = pos, endIndex = pos + byteCount)
    }

    prefix.limit = prefix.pos + byteCount
    pos += byteCount
    prev!!.push(prefix)
    return prefix
  }
```

```kotlin:line-numbers=120 [原文]
  fun split(byteCount: Int): Segment {
    require(byteCount > 0 && byteCount <= limit - pos) { "byteCount out of range" }
    val prefix: Segment

    // We have two competing performance goals:
    //  - Avoid copying data. We accomplish this by sharing segments.
    //  - Avoid short shared segments. These are bad for performance because they are readonly and
    //    may lead to long chains of short segments.
    // To balance these goals we only share segments when the copy will be large.
    if (byteCount >= SHARE_MINIMUM) {
      prefix = sharedCopy()
    } else {
      prefix = SegmentPool.take()
      data.copyInto(prefix.data, startIndex = pos, endIndex = pos + byteCount)
    }

    prefix.limit = prefix.pos + byteCount
    pos += byteCount
    prev!!.push(prefix)
    return prefix
  }
```

:::

## 前提知識

- **セグメント**: 固定の大きさ（`SIZE = 8192` バイト）の配列と、読み書きの位置（`pos`、`limit`）を持つ区画です。バッファは、これを円のようにつないだ連結リストで持ちます。
- **`pos` と `limit`**: 中にあるデータの範囲です。`pos` から `limit` の直前までがデータです。
- **共有（shared）**: 配列を 2 つのセグメントで同じものとして使うことです。コピーをせずに済みますが、書き換えは禁止されます。
- **`SegmentPool`**: 使い終わったセグメントを再利用するための置き場です。新しいセグメントを作る代わりに、ここから受け取ります。
- **`require(条件) { メッセージ }`**: 条件が偽なら引数エラーにします。
- **`prev!!`**: `prev` が `null` でないことを強く約束する書き方です。`null` なら例外になります。

## 何をしているか

### 1. 前半の大きさで、共有かコピーかを選ぶ

前半が `SHARE_MINIMUM`（1024 バイト）以上なら、配列を共有する `sharedCopy()` を使います。小さければ、プールからセグメントを取り、データを `copyInto` で複製します。

```kotlin:line-numbers=129
    if (byteCount >= SHARE_MINIMUM) {
      prefix = sharedCopy()
    } else {
      prefix = SegmentPool.take()
      data.copyInto(prefix.data, startIndex = pos, endIndex = pos + byteCount)
    }
```

### 2. 位置を直し、前半を前に挿入する

前半の `limit` を決め、元のセグメントの `pos` を前半の分だけ進めます。そのあと、前半を元のセグメントの前に入れて、円の順序を保ちます。

```kotlin:line-numbers=136
    prefix.limit = prefix.pos + byteCount
    pos += byteCount
    prev!!.push(prefix)
```

## ここがすごい

- **相反する目標を、大きさで釣り合わせる**: コピーは速いが、長いデータではコストが大きくなります。共有は、データ量に関係なくすぐ終わりますが、読み取り専用になり、短い共有セグメントが増えると後の処理が遅くなります。大きいときだけ共有すると、どちらの欠点も抑えられます。
- **配列を分けずに区切りだけ動かす**: 本当に分けるのではなく、`pos` と `limit` を動かすだけなので、データの並びは変わりません。
- **プールで無駄な割り当てを減らす**: 小さいコピー先は `SegmentPool` から取るので、毎回新しい配列を作らずに済みます。
- **鎖の形を保つ**: 前半を `push` で元の前に入れるので、円の連結リストは壊れません。

## まとめ

- 大きなデータは共有してコピーを避け、小さなデータはコピーして短い共有を避ける。
- 区切りは位置の数字を動かすだけにすると、データを動かさずに済む。
- 再利用できる区画は、プールから取って割り当てを減らす。
