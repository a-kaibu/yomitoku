---
title: "セグメントの中でバイト列の位置を探す"
description: "1 つのセグメントの中で、指定したバイト列が最初に現れる位置を探す indexOfBytesInbound。先頭のバイトで候補を絞り、残りのバイトを比べる単純な探索。"
language: kotlin
project: "kotlinx-io"
repo: https://github.com/Kotlin/kotlinx-io
license: Apache-2.0
copyright: "Copyright 2017-2024 JetBrains s.r.o. and respective authors and developers."
commit: "cf40e5ba7cd99ba812177d597a9f6ce0570545b1"
file: core/common/src/Segment.kt
lines: [464, 488]
function: "Segment.indexOfBytesInbound"
difficulty: 3
tags: [アルゴリズム, 入出力, 低レイヤ]
format: 2
---

## ひとことで

`indexOfBytesInbound()` は、1 つの **セグメント**（kotlinx-io の中で、データを小さな区画に分けて持つ単位）の中から、指定した **バイト列が最初に現れる位置** を探す関数です。見つからなければ `-1` を返します。

セグメントの内側だけを探すので、区画をまたぐ一致は、この関数では扱いません。区画をまたぐ場合は、別の関数（`indexOfBytesOutbound` など）が担当します。

## コード

```kotlin:line-numbers=464
internal fun Segment.indexOfBytesInbound(bytes: ByteArray, startOffset: Int): Int {
    var offset = startOffset
    val limit = size - bytes.size + 1
    val firstByte = bytes[0]
    val data = dataAsByteArray(true)
    while (offset < limit) {
        val idx = indexOf(firstByte, offset, limit)
        if (idx < 0) {
            return -1
        }
        var found = true
        for (innerIdx in 1 until bytes.size) {
            if (data[pos + idx + innerIdx] != bytes[innerIdx]) {
                found = false
                break
            }
        }
        if (found) {
            return idx
        } else {
            offset++
        }
    }
    return -1
}
```

## 前提知識

- **セグメント**: データを固定の大きさの区画に分けて持つ仕組みです。区画どうしを、つなぎ替えることで効率よく扱えます。
- **相対位置**: セグメントの先頭からの位置です。データ配列の中の絶対位置は、`pos` を足して求めます。
- **先頭バイトによる絞り込み**: バイト列の最初の 1 バイトだけを使って、候補の位置を素早く見つける方法です。
- **`limit`**: 探してよい最後の位置の上限です。バイト列の長さを考えて、はみ出さないように決めます。
- **`break` と `return`**: `break` は内側のループを抜けて、`return` は関数全体から戻ります。

## 何をしているか

### 1. 探してよい範囲を決める

```kotlin:line-numbers=466
    val limit = size - bytes.size + 1
```

バイト列が、残りの場所にちゃんと収まる位置までを、探索の上限にします。ここを超えると、バイト列の全部は入りきりません。

### 2. 先頭のバイトを探す

```kotlin:line-numbers=470
        val idx = indexOf(firstByte, offset, limit)
```

バイト列の最初の 1 バイトと同じ位置を、`indexOf` で探します。候補が見つからなければ、`-1` を返して終わります。

### 3. 残りのバイトを比べる

```kotlin:line-numbers=476
            if (data[pos + idx + innerIdx] != bytes[innerIdx]) {
```

候補の位置から、残りのバイトを 1 つずつ比べます。違いがあれば `found` を `false` にして、内側のループを抜けます。

### 4. 一致しなければ次へ進む

```kotlin:line-numbers=484
            offset++
```

候補が合わなければ、探索の開始位置を 1 つ進めて、もう一度先頭のバイトから探します。

### 観察: 同じ候補を繰り返し調べる

この実装では、一致しなかったときに `offset` を 1 つだけ進めています。候補の位置 `idx` の次まで飛ばしていないので、`offset` が `idx` に追いつくまで、同じ候補を何度も調べ直すことになります。結果は正しく求まりますが、効率の面では、`idx + 1` の位置から再開する形に改善できる余地があります。読むときは、この点も確かめておくと理解が深まります。

## ここがすごい

- **先頭のバイトで絞り込む**: 最初の 1 バイトが合う位置だけを、後から比べます。一致しない場所の大半は、最初の比較で除かれます。
- **比べる範囲がはみ出さない**: `limit` の計算で、バイト列が収まる範囲だけを探します。配列の外を読むことがありません。
- **結果が位置で返る**: 見つかった位置をそのまま返すので、呼び出し側は、どこから読めばよいかをすぐに使えます。
- **区画の中だけに閉じる**: セグメントの中だけを探す単純な関数なので、区画をまたぐ処理を別の関数に分けられています。

## まとめ

- `indexOfBytesInbound` は、1 つのセグメントの中で、バイト列が最初に現れる位置を、先頭のバイトで絞りながら探す。
- 探す範囲は `limit` で制限し、配列の外を読まないようにする。
- 一致しなかった候補を 1 つずつ飛ばすため、同じ候補を繰り返し調べる点が改善の余地として読み取れる。
