---
title: "2 つのバイト配列の範囲が同じかを先頭から比べる"
description: "2 つのバイト配列の、指定した位置から指定した長さの部分が同じかを、1 バイトずつ比べる arrayRangeEquals。違いが見つかった時点で false を返す。範囲の確認は呼び出し側に任せている。"
language: kotlin
project: "Okio"
repo: https://github.com/square/okio
license: Apache-2.0
copyright: "Copyright (C) 2018 Square, Inc."
commit: "61d53efb0a3cdabd90332cf3226f3e0f44525b0f"
file: okio/src/commonMain/kotlin/okio/Util.kt
lines: [92, 103]
function: "arrayRangeEquals"
difficulty: 1
tags: [低レイヤ, 防御的プログラミング, イディオム]
format: 2
---

## ひとことで

`arrayRangeEquals()` は、2 つのバイト配列の **一部分（範囲）どうしが同じかどうか** を調べる関数です。`a` の `aOffset` から、`b` の `bOffset` から、それぞれ `byteCount` 個のバイトを比べます。

Okio（入出力を扱うライブラリ）の共通の部品を集めたファイルに置かれた、バイト配列の範囲比較の関数です。

## コード

```kotlin:line-numbers=92
internal fun arrayRangeEquals(
  a: ByteArray,
  aOffset: Int,
  b: ByteArray,
  bOffset: Int,
  byteCount: Int,
): Boolean {
  for (i in 0 until byteCount) {
    if (a[i + aOffset] != b[i + bOffset]) return false
  }
  return true
}
```

## 前提知識

- **バイト配列（`ByteArray`）**: 1 バイトずつの値が並んだ配列です。ファイルの中身やネットワークのデータは、この形で扱われます。
- **オフセット**: 配列の先頭からの位置です。`aOffset` は `a` のどこから比べ始めるかを表します。
- **範囲の比較**: 配列全体ではなく、その中の決まった長さの部分だけを比べることです。
- **`for (i in 0 until byteCount)`**: 0 から `byteCount - 1` まで、順番に繰り返します。`until` は、終わりの値を含まない範囲です。
- **`return false`**: ループの途中で、違いが見つかったら、そこで関数を終えて `false` を返す書き方です。

## 何をしているか

### 1. 指定の長さだけ繰り返す

```kotlin:line-numbers=99
  for (i in 0 until byteCount) {
```

範囲の長さ `byteCount` の分だけ、1 バイトずつ比べます。

### 2. 違えばすぐに false

```kotlin:line-numbers=100
    if (a[i + aOffset] != b[i + bOffset]) return false
```

それぞれの配列の、対応する位置の値を比べます。違いが 1 つでもあれば、そこで `false` を返し、残りは見ません。

### 3. 最後まで同じなら true

```kotlin:line-numbers=102
  return true
```

ループを最後まで抜けたなら、すべてのバイトが同じです。`true` を返します。

## ここがすごい

- **違いが見つかった時点で止まる**: 違うと分かったら、残りを比べる必要がありません。長い範囲でも、早く結論が出ることがあります。
- **オフセットを足すだけで範囲を表す**: 配列を切り出してコピーせずに、位置の足し算で範囲を指定しています。余計なメモリを使いません。
- **境界の確認は呼び出し側**: 範囲が配列の中に収まっているかは、この関数では確かめていません。範囲が外れていれば、配列の添字の例外が起きます。前提を呼び出し側に任せる、低レイヤの関数らしい作りです。
- **単純で速い**: 1 つのループと 1 つの比較だけなので、読みやすく、性能の面でも無駄がありません。

## まとめ

- `arrayRangeEquals` は、2 つの配列の指定した範囲を先頭から比べ、違いがあれば `false` を返す。
- 範囲は配列の切り出しではなく、オフセットの足し算で表す。
- 範囲の正しさは、呼び出し側が確かめる前提になっている。
