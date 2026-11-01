---
title: "円のつながりに segment を足す push"
description: "Okio のセグメントの円の連結リストに、別のセグメントを自分の後ろに挿入する push。挿入したセグメントを返す。前後の参照を正しくつなぎ直して、輪の形を保つ。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "\"Copyright (C) 2014 Square, Inc.\""
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/Segment.kt
lines: [104, 110]
function: "Segment.push"
difficulty: 2
tags: [データ構造, メモリ管理]
format: 2
---

## ひとことで

`push(segment)` は、円の連結リストの中で、**自分の直後に別のセグメントを挿入** する関数です。挿入したセグメントを、そのまま返します。

`pop` の逆の操作にあたり、輪の中にセグメントを足すときに使います。

## コード

```kotlin:line-numbers=104
  fun push(segment: Segment): Segment {
    segment.prev = this
    segment.next = next
    next!!.prev = segment
    next = segment
    return segment
  }
```

## 前提知識

- **連結リストへの挿入**: 2 つの要素の間に新しい要素を入れるには、前後の参照を 3 か所書き換える必要があります。
- **`prev` と `next`**: 前後のセグメントを指す参照です。
- **輪の形**: 最後の要素の `next` が最初の要素に戻ります。挿入のあとも、この形を保つ必要があります。

## 何をしているか

### 1. 挿入するセグメントの参照を設定する

```kotlin:line-numbers=105
    segment.prev = this
    segment.next = next
```

新しいセグメントの前を自分にし、後ろを自分の今の次にします。

### 2. 次のセグメントの前を付け替える

```kotlin:line-numbers=107
    next!!.prev = segment
```

自分の今の次のセグメントの前を、新しいセグメントに向けます。

### 3. 自分の次を新しいセグメントにする

```kotlin:line-numbers=108
    next = segment
```

自分の次を、新しいセグメントにします。これで、「自分 → 新しいセグメント → 元の次」の順になります。

### 4. 例で確かめる

A → C → A の輪で A の後ろに B を `push` すると、輪は A → B → C → A になります。戻り値は挿入した B です。

### 5. 実際の使われ方

前の記事で見た `split` は、分けた前半を `prev!!.push(prefix)` で、元のセグメントの直前に挿入しています。前半が元の位置に収まるので、データの並びは変わりません。

## ここがすごい

- **4 つの参照を順番に書き換える**: 挿入では、新しいセグメントの 2 つの参照と、前後の 2 つの参照を書き換えます。順番を守ると、途中で輪が壊れません。
- **挿入したものを返す**: 戻り値として挿入したセグメントを返すので、呼び出し側は、続けて同じものを操作できます。
- **`pop` と対になる**: 挿入は `push`、取り外しは `pop` で行います。2 つを組み合わせると、輪の中身を自由に増減できます。
- **新しいセグメントの前後を明示する**: 挿入するセグメントの `prev` と `next` を、先に決めてから既存の参照を変えています。この順番で、参照の食い違いを防いでいます。

## まとめ

- 連結リストへの挿入は、新しい要素の前後を先に決めてから、既存の参照を付け替える。
- 挿入したものを返すと、呼び出し側が続けて操作しやすい。
- 取り外し（pop）と挿入（push）を対で使うと、輪の内容を自由に変えられる。
