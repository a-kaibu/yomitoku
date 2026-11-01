---
title: "PNG の幅と高さを先頭の 24 バイトから読む"
description: "画像をデコードせず、PNG の先頭 24 バイトだけを見て、署名を確かめたうえで IHDR に書かれた幅と高さを取り出す getPngSize。"
language: kotlin
project: "Coil"
repo: https://github.com/coil-kt/coil
license: Apache-2.0
copyright: "Copyright 2026 Coil Contributors"
commit: "bba95eda4f78a97312eab08eb5f3613d7f89b4fb"
file: coil-core/src/jsCommonMain/kotlin/coil3/decode/SkiaImageDecoder.jsCommon.kt
lines: [68, 79]
function: "getPngSize"
difficulty: 2
tags: [低レイヤ, 入出力, 数値計算]
format: 2
---

## ひとことで

`getPngSize()` は、PNG 画像のバイト列から、**幅と高さだけ** を取り出す関数です。画像を最後まで読み込んでデコードせず、先頭の 24 バイトを見るだけで済みます。

Coil（Android や Kotlin で画像を読み込むライブラリ）が、画像の大きさを先に知りたいときに使います。デコードは重いので、大きさだけなら、この方法の方がずっと速く済みます。

## コード

```kotlin:line-numbers=68
internal fun getPngSize(bytes: ByteArray): IntPair {
    if (bytes.size < 24) return UnspecifiedSize
    if (
        int32(bytes[0], bytes[1], bytes[2], bytes[3]) == 0x8950_4E47u &&
        int32(bytes[4], bytes[5], bytes[6], bytes[7]) == 0x0D0A_1A0Au
    ) {
        val width = int32(bytes[16], bytes[17], bytes[18], bytes[19])
        val height = int32(bytes[20], bytes[21], bytes[22], bytes[23])
        return IntPair(width.toInt(), height.toInt())
    }
    return UnspecifiedSize
}
```

## 前提知識

- **PNG の構造**: PNG は、先頭に 8 バイトの署名があり、その後ろに「チャンク」と呼ばれる区切りが続きます。最初のチャンクは `IHDR` で、画像の幅と高さが書かれています。
- **署名**: ファイルの種類を確かめるために、先頭に決まった値を置く仕組みです。PNG の署名は、`89 50 4E 47 0D 0A 1A 0A` の 8 バイトです。
- **バイト列とビッグエンディアン**: 複数バイトの数値は、先頭のバイトを上の桁として並べて読みます。この関数の `int32` は、その順番で数値を組み立てます。
- **`UInt`**: 符号なしの 32 ビット整数です。署名の比較は、この型で行われています。
- **`UnspecifiedSize`**: 大きさが分からなかったことを表す印の値です。

## 何をしているか

### 1. 短すぎるデータは対象外

```kotlin:line-numbers=69
    if (bytes.size < 24) return UnspecifiedSize
```

先頭の 24 バイトがなければ、IHDR の幅と高さを読めません。すぐに「分からない」を返します。

### 2. 署名を確かめる

```kotlin:line-numbers=71
        int32(bytes[0], bytes[1], bytes[2], bytes[3]) == 0x8950_4E47u &&
```

先頭の 4 バイトが PNG の署名と一致するかを調べます。`0x8950_4E47` は、`\x89PNG` の並びです。

```kotlin:line-numbers=72
        int32(bytes[4], bytes[5], bytes[6], bytes[7]) == 0x0D0A_1A0Au
```

続く 4 バイトも確かめます。改行の並びが混ざっていれば、壊れたファイルか、別の形式の可能性が高いからです。

### 3. 幅と高さを読む

```kotlin:line-numbers=74
        val width = int32(bytes[16], bytes[17], bytes[18], bytes[19])
        val height = int32(bytes[20], bytes[21], bytes[22], bytes[23])
```

IHDR の幅は 16 から 19 バイト目、高さは 20 から 23 バイト目に、それぞれ 4 バイトで書かれています。決まった場所から読むだけなので、画像の中身を見る必要がありません。

```kotlin:line-numbers=76
        return IntPair(width.toInt(), height.toInt())
```

読んだ値を、整数の組として返します。

## ここがすごい

- **デコードを避ける**: 画像の大きさを知るために、ピクセル全体を展開しないで済みます。メモリも時間も大きく減ります。
- **署名の 2 段チェック**: 先頭 4 バイトだけでなく、続く 4 バイトも確かめるので、偶然の一致を避けやすくなっています。
- **固定の位置から読む**: PNG の仕様で決まった位置にあるので、ファイルの長さに頼らず、単純な添字で読めます。
- **失敗を値で返す**: 形式が違えば例外ではなく `UnspecifiedSize` を返します。次の形式を順番に試す、という呼び出し側の作りに合っています。

## まとめ

- `getPngSize` は、PNG の先頭 24 バイトだけを見て、署名を確かめた上で幅と高さを読む。
- 画像をデコードしないので、大きさだけが必要な場面で速く済む。
- 分からないときは `UnspecifiedSize` を返し、他の形式の判定へ進めるようにしている。
