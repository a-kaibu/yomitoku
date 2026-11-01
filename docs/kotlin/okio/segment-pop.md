---
title: "円のつながりから自分を外す pop"
description: "Okio のセグメントを、円の形の連結リストから外す pop。外したあとの次のセグメントを返し、残りが 1 つもなければ null を返す。外した自分の参照は消す。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "\"Copyright (C) 2014 Square, Inc.\""
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/Segment.kt
lines: [92, 99]
function: "Segment.pop"
difficulty: 2
tags: [データ構造, メモリ管理]
format: 2
---

## ひとことで

Okio のバッファは、セグメントを **円のように輪になった連結リスト** でつないでいます。各セグメントは、前（`prev`）と次（`next`）の参照を持ちます。

`pop()` は、自分を輪から外し、**外したあとの次のセグメントを返す** 関数です。輪の中にほかに何もなければ、`null` を返します。

## コード

```kotlin:line-numbers=92
  fun pop(): Segment? {
    val result = if (next !== this) next else null
    prev!!.next = next
    next!!.prev = prev
    next = null
    prev = null
    return result
  }
```

## 前提知識

- **連結リスト**: 要素が、次の要素への参照でつながったデータ構造です。ここでは、最後の要素の `next` が最初に戻るので、輪になっています。
- **`prev` と `next`**: 前後の要素を指す参照です。
- **`!!`**: `null` でないことを強く約束する書き方です。`null` なら例外になります。
- **`!==`**: 同じオブジェクトかを比べる演算子です（値の等しさではなく、同じ物かを比べます）。

## 何をしているか

### 1. 次が自分でなければ、次を結果にする

```kotlin:line-numbers=93
    val result = if (next !== this) next else null
```

自分だけの輪なら `next` は自分自身になっています。その場合は、外したあとに残るものがないので、`null` を返します。

### 2. 前と次をつなぎ直す

```kotlin:line-numbers=94
    prev!!.next = next
    next!!.prev = prev
```

前のセグメントの `next` を、自分の次に向けます。次のセグメントの `prev` を、自分の前に向けます。これで、自分は輪から外れます。

### 3. 自分の参照を消す

```kotlin:line-numbers=96
    next = null
    prev = null
```

外れた自分が、もう輪の中の参照を持たないように、`null` にします。

### 4. 例で確かめる

A → B → C → A の輪で B を `pop` すると、輪は A → C → A になります。戻り値は、外したあとの次の C です。C だけの輪で C を `pop` すると、戻り値は `null` です。

## ここがすごい

- **つなぎ直すだけで外れる**: 配列の要素を動かさず、参照を 2 つ書き換えるだけです。セグメントの中のデータは、そのまま残ります。
- **自分の参照を消す**: 外したセグメントが古い参照を持ち続けると、輪の中の別の場所から誤って辿られるおそれがあります。`null` にして、それを防いでいます。
- **空かどうかを戻り値で伝える**: 残りがなければ `null` を返すので、呼び出し側は、空になったかを 1 回の判定で知れます。
- **プールへの返却と組み合わせる**: 外したセグメントは、`SegmentPool` に返して再利用できます。このため、外す処理は小さく保たれています。

## まとめ

- 円の連結リストから外すには、前後の参照を直接つなぎ直す。
- 外れた側の参照は消して、誤って辿られないようにする。
- 残りの有無は戻り値の `null` で伝えると、判定が単純になる。
