---
title: "符号化したキーで二分探索し、無ければ挿入位置を返す"
description: "並んだバイト列から、エンコード済みのキーを二分探索する binarySearch。見つからなければ挿入位置をビットの反転で表し、見つかった位置と区別する。"
language: kotlin
project: "LeakCanary"
repo: https://github.com/square/leakcanary
license: Apache-2.0
copyright: "Copyright 2015 Square, Inc."
commit: "eb60b0be53732aa016c79b7774b497770ad1e4f3"
file: shark/shark-graph/src/main/java/shark/internal/SortedBytesMap.kt
lines: [83, 102]
function: "SortedBytesMap.binarySearch"
difficulty: 3
tags: [アルゴリズム, メモリ管理, ビット演算]
format: 2
---

## ひとことで

`binarySearch()` は、ソート済みのバイト列に並んだ **キー** を、二分探索で見つける関数です。LeakCanary（Android のメモリリークを見つけるライブラリ）の解析部分で、オブジェクトの ID から中身を素早く探すために使われています。

見つかれば、その位置を返します。見つからなければ、そのキーを入れるべき位置を、特別な形の負の数で返します。

## コード


::: code-group

```kotlin:line-numbers=83 [日本語訳]
  private fun binarySearch(
    key: Long
  ): Int {
    // キーをデコードせず、エンコード済みの値で比べる。両者は同じ順序で並ぶ。
    val encodedKey = idEncoding.encode(key)
    val startIndex = 0
    val endIndex = size
    var lo = startIndex
    var hi = endIndex - 1
    while (lo <= hi) {
      val mid = (lo + hi).ushr(1)
      val midVal = idEncoding.encodedKeyAt(sortedEntries, mid * bytesPerEntry)
      when {
        midVal < encodedKey -> lo = mid + 1
        midVal > encodedKey -> hi = mid - 1
        else -> return mid
      }
    }
    return lo.inv()
  }
```

```kotlin:line-numbers=83 [原文]
  private fun binarySearch(
    key: Long
  ): Int {
    // Searching on encoded keys rather than decoding each probe: the two sort the same way.
    val encodedKey = idEncoding.encode(key)
    val startIndex = 0
    val endIndex = size
    var lo = startIndex
    var hi = endIndex - 1
    while (lo <= hi) {
      val mid = (lo + hi).ushr(1)
      val midVal = idEncoding.encodedKeyAt(sortedEntries, mid * bytesPerEntry)
      when {
        midVal < encodedKey -> lo = mid + 1
        midVal > encodedKey -> hi = mid - 1
        else -> return mid
      }
    }
    return lo.inv()
  }
```

:::

## 前提知識

- **二分探索**: 並んだ列の真ん中を調べ、探す値が前か後ろかで範囲を半分に絞る探し方です。1 回ごとに候補が半分になるので、速く見つかります。
- **符号化（エンコード）**: キーを、保存しやすい形に変換したものです。ここでは、エンコード済みの値どうしを比べても、元のキーの大小関係と同じ順序になるように作られています。
- **`ushr(1)`**: 符号なしのビットずらしで、1 桁右にずらす操作です。2 で割ることと同じですが、負の数の扱いが違います。
- **`inv()`**: すべてのビットを反転させる操作です。整数 `x` に対して、`x.inv()` は `-x - 1` と同じ値になります。
- **挿入位置**: 探している値を、列の中のどこに入れればよいかを表す位置です。

## 何をしているか

### 1. 探す値を先に符号化する

```kotlin:line-numbers=87
    val encodedKey = idEncoding.encode(key)
```

探すキーを、並んだデータと同じ形に変換しておきます。途中のキーを毎回デコードしないので、比べる回数が多くても無駄がありません。

### 2. 真ん中を取って比べる

```kotlin:line-numbers=93
      val mid = (lo + hi).ushr(1)
```

範囲の真ん中の位置を求めます。`ushr(1)` を使うので、`lo + hi` が大きくなっても、負の値にならず正しい中点になります。

### 3. 範囲を半分に絞る

```kotlin:line-numbers=96
        midVal < encodedKey -> lo = mid + 1
        midVal > encodedKey -> hi = mid - 1
```

真ん中の値が探す値より小さければ、探索範囲の下端を真ん中の次に動かします。大きければ、上端を真ん中の前に動かします。

### 4. 見つからなかったときの戻り値

```kotlin:line-numbers=101
    return lo.inv()
```

範囲がなくなっても見つからなければ、`lo` が挿入位置です。それを `inv()` で反転させて負の数にして返します。見つかった位置は 0 以上なので、戻り値を見れば見つかったかどうかが分かります。

## ここがすごい

- **中点の計算がオーバーフローに強い**: `(lo + hi) / 2` と書くと、大きな値で溢れることがあります。`ushr(1)` なら、符号を気にせず正しい中点を取れます。
- **1 つの戻り値で 2 つの情報**: 0 以上なら見つかった位置、負なら挿入位置です。戻り値の形だけで、結果の種類を区別できます。
- **比較の回数を減らす工夫**: キーを 1 回だけ符号化しておき、ループの中ではエンコード済みの値だけを比べます。
- **Java の二分探索と同じ形式**: `inv()` で表す挿入位置は、Java の `Arrays.binarySearch` と同じ約束です。他の言語の経験者にも読みやすい設計です。

## まとめ

- `binarySearch` は、エンコード済みのキーで二分探索を行い、見つかれば位置を、無ければ挿入位置の反転を返す。
- 中点は `ushr(1)` で求め、大きな値でも溢れないようにしている。
- 戻り値の符号で、見つかったかどうかを 1 つの数で伝える。
