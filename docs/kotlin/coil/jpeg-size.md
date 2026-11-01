---
title: "JPEG のマーカーをたどって画像の大きさを探す"
description: "JPEG の区切り記号（マーカー）を先頭から順にたどり、画像の大きさが書かれた SOF マーカーを見つけて幅と高さを読む getJpegSize。知らないセグメントは長さの分だけ飛ばす。"
language: kotlin
project: "Coil"
repo: https://github.com/coil-kt/coil
license: Apache-2.0
copyright: "Copyright 2026 Coil Contributors"
commit: "bba95eda4f78a97312eab08eb5f3613d7f89b4fb"
file: coil-core/src/jsCommonMain/kotlin/coil3/decode/SkiaImageDecoder.jsCommon.kt
lines: [81, 100]
function: "getJpegSize"
difficulty: 3
tags: [低レイヤ, 入出力, 数値計算]
format: 2
---

## ひとことで

`getJpegSize()` は、JPEG 画像のバイト列を先頭からたどって、**画像の幅と高さが書かれた場所** を探す関数です。JPEG は、「マーカー」と呼ばれる区切り記号で、いくつものセグメント（小さな区画）に分かれています。

画像の大きさは、特定のマーカーの中に書かれています。そのマーカーを見つけるまで、関係ないセグメントを順番に飛ばしていきます。

## コード

```kotlin:line-numbers=81
internal fun getJpegSize(bytes: ByteArray): IntPair {
    if (bytes.size < 10) return UnspecifiedSize
    if (int16(bytes[0], bytes[1]) == 0xFFD8u) {
        var offset = 2
        while (offset < bytes.size - 6) {
            val marker = int16(bytes[offset], bytes[offset + 1])
            offset += 2

            if (marker in 0xFFC0u..0xFFCFu && marker != 0xFFC4u && marker != 0xFFC8u && marker != 0xFFCCu) {
                val height = int16(bytes[offset + 3], bytes[offset + 4])
                val width = int16(bytes[offset + 5], bytes[offset + 6])
                return IntPair(width.toInt(), height.toInt())
            }

            val segmentLength = int16(bytes[offset], bytes[offset + 1])
            offset += segmentLength.toInt()
        }
    }
    return UnspecifiedSize
}
```

## 前提知識

- **JPEG のマーカー**: `FF` で始まる 2 バイトの印です。`FFD8` は画像の始まり、そのほかのマーカーは、それぞれ中身の種類を表します。
- **SOF マーカー（Start Of Frame）**: 画像の大きさや、ピクセルの形式が書かれたマーカーです。`FFC0` から `FFCF` の範囲にあります。
- **例外になる番号**: `FFC4`、`FFC8`、`FFCC` は、同じ範囲にあっても、大きさを表すマーカーではありません。そのため、除外しています。
- **セグメントの長さ**: 多くのマーカーの後ろには、2 バイトの長さが書かれています。その長さ分だけ進めば、次のマーカーに着けます。
- **`offset`**: 今いる位置を表す添字です。ファイルを先頭からたどるたびに、この値を進めます。

## 何をしているか

### 1. 先頭が JPEG か確かめる

```kotlin:line-numbers=83
    if (int16(bytes[0], bytes[1]) == 0xFFD8u) {
```

先頭の 2 バイトが `FFD8` なら、JPEG の画像の始まりです。そうでなければ、処理を進めません。

### 2. マーカーを順にたどる

```kotlin:line-numbers=85
        while (offset < bytes.size - 6) {
            val marker = int16(bytes[offset], bytes[offset + 1])
            offset += 2
```

現在位置のマーカーを読み、位置を 2 バイト進めます。ループの条件に `- 6` があるのは、幅と高さを読むために残りのバイトが必要だからです。

### 3. 大きさのマーカーなら値を読む

```kotlin:line-numbers=89
            if (marker in 0xFFC0u..0xFFCFu && marker != 0xFFC4u && marker != 0xFFC8u && marker != 0xFFCCu) {
```

範囲の中で、大きさを表すマーカーだけを選びます。

```kotlin:line-numbers=90
                val height = int16(bytes[offset + 3], bytes[offset + 4])
                val width = int16(bytes[offset + 5], bytes[offset + 6])
```

このマーカーの後ろの決まった位置から、高さと幅を読みます。長さの 2 バイトと精度の 1 バイトの後ろに、高さが来ます。

### 4. 関係ないセグメントは長さだけ飛ばす

```kotlin:line-numbers=96
            offset += segmentLength.toInt()
```

目的のマーカーでなければ、セグメントの長さを読んで、その分だけ位置を進めます。中身を解釈しなくても、次のマーカーに着けます。

## ここがすごい

- **長さの情報で飛ばす**: 中身を知らないセグメントも、長さが書かれているので、正確に次へ進めます。JPEG の構造を生かした、無駄のない探し方です。
- **必要な範囲だけを見る**: 画像の中身のデータ（圧縮された画素）には触れません。先頭の数十バイトだけで、大きさが分かります。
- **例外の扱いを明示**: 大きさのマーカーの範囲にあっても、一部の番号を除外しています。仕様に合わせた細かな条件が、式の中に直接書かれています。
- **見つからなければ不明**: ループが終わるまで見つからなければ、`UnspecifiedSize` を返します。壊れたデータでも、例外ではなく、分からないという答えになります。

## まとめ

- `getJpegSize` は、JPEG のマーカーを先頭からたどり、大きさを表す SOF マーカーで幅と高さを読む。
- 関係のないセグメントは、書かれた長さの分だけ飛ばす。
- 画像の中身には触れず、先頭の数十バイトだけで大きさを取り出す。
