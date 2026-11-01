---
title: "バッファから文字列を読むとき、コピーを減らす"
description: "バッファの先頭から指定したバイト数を文字列にする readStringImpl。データが連続していれば直接デコードし、途中で分かれていれば一度バイト配列に集めてから変換する。"
language: kotlin
project: "kotlinx-io"
repo: https://github.com/Kotlin/kotlinx-io
license: Apache-2.0
copyright: "Copyright 2017-2023 JetBrains s.r.o. and respective authors and developers."
commit: "cf40e5ba7cd99ba812177d597a9f6ce0570545b1"
file: core/jvm/src/SourcesJvm.kt
lines: [31, 51]
function: "Buffer.readStringImpl"
difficulty: 3
tags: [入出力, 低レイヤ, 最適化]
format: 2
---

## ひとことで

`readStringImpl` は、kotlinx-io の `Buffer`（バイトをためておく入れ物）から、**指定した長さのバイトを文字列に変換して読み出す** 関数です。読むべきバイトが 1 か所に連続していれば、コピーを作らずに直接文字列にします。分かれているときだけ、一度まとめてから変換します。

この関数は、文字コードを指定して、バイトを文字列として読むときの内部の処理です。文字列の変換そのものより、「できるだけコピーをしない」工夫が中心です。

## コード

```kotlin:line-numbers=31
private fun Buffer.readStringImpl(byteCount: Long, charset: Charset): String {
    require(byteCount >= 0 && byteCount <= Int.MAX_VALUE) {
        "byteCount ($byteCount) is not within the range [0..${Int.MAX_VALUE})"
    }
    if (size < byteCount) {
        throw EOFException("Buffer contains less bytes then required (byteCount: $byteCount, size: $size)")
    }
    if (byteCount == 0L) return ""

    var result: String? = null
    val _ = UnsafeBufferOperations.readFromHead(this) { data, pos, limit ->
        val len = limit - pos
        if (len >= byteCount) {
            result = String(data, pos, byteCount.toInt(), charset)
            byteCount.toInt()
        } else {
            0
        }
    }
    return result ?: String(readByteArray(byteCount.toInt()), charset)
}
```

## 前提知識

- **`Buffer`**: バイトを順番にためて、先頭から読み出せる入れ物です。内部では、複数の小さな配列（セグメント）に分かれて入っていることがあります。
- **連続した領域**: バイトが 1 つの配列の中に続けて入っている状態です。セグメントの境界をまたぐと、連続していません。
- **`UnsafeBufferOperations.readFromHead`**: バッファの先頭の配列を直接読むための、内部用の関数です。ラムダには、配列、開始位置、終端の位置が渡されます。
- **`String(bytes, offset, length, charset)`**: バイト配列の一部を、指定した文字コードで文字列にする Java の関数です。
- **`require` と `EOFException`**: `require` は引数の前提を確かめ、`EOFException` は読むべきデータが足りないことを知らせる例外です。
- **`?:`（エルビス演算子）**: 左側が `null` のときに、右側の値を使います。

## 何をしているか

### 1. 読めるバイトが足りるかを確かめる

```kotlin:line-numbers=35
    if (size < byteCount) {
        throw EOFException("Buffer contains less bytes then required (byteCount: $byteCount, size: $size)")
    }
```

バッファに入っている総バイト数（`size`）が、読みたい量より少なければ、`EOFException` を投げます。足りないデータを、途中まで読んで壊すことを防ぎます。

### 2. 連続していれば、直接文字列にする

```kotlin:line-numbers=43
        if (len >= byteCount) {
            result = String(data, pos, byteCount.toInt(), charset)
            byteCount.toInt()
```

先頭の配列の中に、読みたいバイトがすべて入っていれば（`len >= byteCount`）、その場所から直接文字列を作ります。コピー用の配列は作りません。読んだバイト数を返して、バッファから読んだ分を消費します。

### 3. 分かれていれば、まとめてから変換する

```kotlin:line-numbers=50
    return result ?: String(readByteArray(byteCount.toInt()), charset)
```

連続していない場合は、直接の変換が行われず、`result` は `null` のままです。その場合は、`readByteArray` で必要なバイトを 1 つの配列に集め、それを文字列にします。

## ここがすごい

- **速い道と遅い道を分ける**: 普通のケース（連続している）は、コピーなしで終わります。分かれている少ないケースだけ、集めて変換します。よくある場合を速くする、典型的な設計です。
- **ラムダの中で結果を取り出す**: `readFromHead` のラムダが `result` に書き込み、外で `result ?: ...` と受け取っています。ラムダが実行されなかった場合にだけ、後ろの処理が動きます。
- **読む前に確かめる**: 足りないかどうかを先に確かめてから読むので、バッファの状態を中途半端に変えずに済みます。
- **例外の種類で意味を伝える**: `EOFException` という名前から、「データの終わりに達した」ことが分かります。

## まとめ

- 連続したバイトは、コピーせずにその場で文字列にすると速い。
- 分かれているときだけ、まとめてから変換する、という二段構えにすると、よくある場合が軽くなる。
- 読む前に量を確かめると、途中で失敗してもバッファの状態を壊さずに済む。
