---
title: "区切りビットと「+1」を足し算 1 回で同時に付ける UTF-8 エンコード"
description: "Unicode のコードポイントを UTF-8 に変換する関数。6 ビットずつ切り出して並べたあと、UTF-8 の先頭ビットと内部表現の +1 を、1 つの定数を足すだけでまとめて付ける。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/UTF8.swift
lines: [103, 130]
function: "Unicode.UTF8.encode(_:)"
difficulty: 3
tags: [Unicode, ビット演算, 文字列処理, 最適化, 標準ライブラリ]
format: 2
---
## ひとことで

文字の番号（コードポイント）を UTF-8 のバイト列に変換する関数です。たとえば「é」（`U+00E9`）は `0xC3 0xA9` になります。
結果は `_ValidUTF8Buffer`（最大 4 バイトを `UInt32` に詰め、各バイトに 1 を足して持つ型）で返します。この関数は、UTF-8 の **区切りのビット（`110`、`10` など）と、内部表現の「+1」を、たった 1 回の足し算で同時に付ける** のが見どころです。

## コード

```swift:line-numbers=103
  @inline(__always)
  @inlinable
  public static func encode(
    _ source: Unicode.Scalar
  ) -> EncodedScalar? {
    var c = source.value
    if _fastPath(c < (1&<<7)) {
      return EncodedScalar(_containing: UInt8(c))
    }
    var o = c & 0b0__0011_1111
    c &>>= 6
    o &<<= 8
    if _fastPath(c < (1&<<5)) {
      return EncodedScalar(_biasedBits: (o | c) &+ 0b0__1000_0001__1100_0001)
    }
    o |= c & 0b0__0011_1111
    c &>>= 6
    o &<<= 8
    if _fastPath(c < (1&<<4)) {
      return EncodedScalar(
        _biasedBits: (o | c) &+ 0b0__1000_0001__1000_0001__1110_0001)
    }
    o |= c & 0b0__0011_1111
    c &>>= 6
    o &<<= 8
    return EncodedScalar(
      _biasedBits: (o | c ) &+ 0b0__1000_0001__1000_0001__1000_0001__1111_0001)
  }
```

## 前提知識

- **UTF-8 の形**: 2 バイトなら `110xxxxx 10xxxxxx`、3 バイトなら `1110xxxx 10xxxxxx 10xxxxxx` のように、文字の番号のビットを `x` に詰めます。
- **`source.value`**: `Unicode.Scalar` の番号（`UInt32`）です。
- **`_fastPath(条件)`**: 「この条件はたいてい真」とコンパイラに伝えるヒントです。よく通る道を速くする命令配置になります。
- **`&>>=` / `&<<=`**: チェックなしのシフトをして代入します。
- **`EncodedScalar(_containing:)`**: 1 バイトだけのバッファを作ります（内部で 1 を足します）。
- **`EncodedScalar(_biasedBits:)`**: すでに 1 を足したビット列からバッファを作ります。

## 何をしているか

### 1. 1 バイトで表せるか

ASCII（128 未満）ならそのまま 1 バイトにします。これがもっとも多い場合なので、`_fastPath` で先に判定します。

```swift:line-numbers=109
    if _fastPath(c < (1&<<7)) {
      return EncodedScalar(_containing: UInt8(c))
    }
```

### 2. 2 バイトの場合

「é」（`c = 0xE9`）は 2 バイトです。下位 6 ビットを取り出し、残りを右へずらして、区切りのビットと +1 を足し算 1 回で付けます。

```swift:line-numbers=112
    var o = c & 0b0__0011_1111
    c &>>= 6
    o &<<= 8
    if _fastPath(c < (1&<<5)) {
      return EncodedScalar(_biasedBits: (o | c) &+ 0b0__1000_0001__1100_0001)
```

### 3. 3 バイト・4 バイトの場合

さらに 6 ビットずつ切り出して、同じ処理を繰り返します。

```swift:line-numbers=118
    o |= c & 0b0__0011_1111
    c &>>= 6
    o &<<= 8
    if _fastPath(c < (1&<<4)) {
      return EncodedScalar(
        _biasedBits: (o | c) &+ 0b0__1000_0001__1000_0001__1110_0001)
    }
    o |= c & 0b0__0011_1111
    c &>>= 6
    o &<<= 8
    return EncodedScalar(
      _biasedBits: (o | c ) &+ 0b0__1000_0001__1000_0001__1000_0001__1111_0001)
```


## ここがすごい

- **足し算 1 回で 2 つの仕事**: 定数 `0b1000_0001__1100_0001` は、UTF-8 の区切りビット `0b1000_0000__1100_0000` と、各バイトの +1 `0b0000_0001__0000_0001` を足したものです。区切りビットの場所は `x` の部分と重ならないので、OR の代わりに足し算を使えます。+1 も、各バイトの下位ビットから繰り上がりが隣のバイトに漏れないので、まとめて足せます。
- **短い文字ほど速い**: 1 バイト（ASCII）の判定が最初にあり、`_fastPath` が付いています。英数字が大半のテキストでは、ほとんどの文字が最初の `if` で終わります。
- **ループの展開**: 6 ビットずつ切り出す処理を 3 回書き下しています。ループにするより分岐の予測がしやすく、各段階で「ここで終われるか」を判定できます。

## まとめ

- UTF-8 エンコードは「6 ビットずつ切り出して、区切りのビットを付ける」の繰り返し。
- ビットが重ならないとわかっていれば、OR の代わりに足し算を使って、複数の値を一度に付けられる。
- よく通る道（ASCII）を先に判定し、`_fastPath` で速くする。
