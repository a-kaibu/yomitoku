---
title: "サロゲートペアを「0x10000 + 10 ビット + 10 ビット」で 1 文字に戻す"
description: "UTF-16 で 2 つの単位に分かれた絵文字などを、1 つのコードポイントに戻す関数。あわせて「この 16 ビットは単独で文字か」を、マスク 1 回で判定する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/UTF16.swift
lines: [283, 299]
function: "UTF16._decodeSurrogates(_:_:)"
difficulty: 2
tags: [Unicode, ビット演算, 文字列処理, 標準ライブラリ]
format: 2
---
## ひとことで

UTF-16 は、文字を 16 ビット（2 バイト）単位で表す方式です。ただし 16 ビットで表せるのは 65,536 通りだけなので、絵文字「😀」（`U+1F600`）のような番号の大きな文字は、**サロゲートペア** と呼ばれる 2 つの 16 ビットの組（`0xD83D 0xDE00`）で表します。
`_decodeSurrogates` は、そのペアを元の番号に戻す関数です。その前にある `_isScalar` は、16 ビットの値が「単独で 1 文字か（サロゲートではないか）」を判定します。

## コード

```swift:line-numbers=283
  @inlinable
  public static func _isScalar(_ x: CodeUnit) -> Bool {
    return x & 0xf800 != 0xd800
  }

  @inlinable
  @inline(__always)
  internal static func _decodeSurrogates(
    _ lead: CodeUnit,
    _ trail: CodeUnit
  ) -> Unicode.Scalar {
    _internalInvariant(isLeadSurrogate(lead))
    _internalInvariant(isTrailSurrogate(trail))
    return Unicode.Scalar(
      _unchecked: 0x10000 +
        (UInt32(lead & 0x03ff) &<< 10 | UInt32(trail & 0x03ff)))
  }
```

## 前提知識

- **`CodeUnit`**: UTF-16 では `UInt16`（16 ビットの符号なし整数）です。
- **サロゲート**: `0xD800`〜`0xDBFF` を「前半（lead / high surrogate）」、`0xDC00`〜`0xDFFF` を「後半（trail / low surrogate）」と呼び、この 2 つを組にして 1 文字を表します。この範囲の番号は、単独では文字として使いません。
- **`0x03ff`**: 2 進数で下位 10 ビットがすべて 1 の値です。サロゲートの下位 10 ビットを取り出すのに使います。
- **`&<<`**: チェックなしの左シフトです。
- **`|`**: ビットごとの OR です。重ならないビットを合体させます。
- **`_internalInvariant`**: 内部用の前提条件チェックです。

## 何をしているか

### _isScalar

```swift:line-numbers=284
  public static func _isScalar(_ x: CodeUnit) -> Bool {
    return x & 0xf800 != 0xd800
  }
```
`x & 0xf800 != 0xd800` で、`x` がサロゲートの範囲（`0xD800`〜`0xDFFF`）に **入っていない** かを判定します。

`0xf800` は上位 5 ビットのマスクです。サロゲートは 2 進数で `11011xxx_xxxxxxxx` という形なので、上位 5 ビットが `11011`（= `0xD800` の上位 5 ビット）かどうかを見れば、前半・後半の両方をまとめて判定できます。

### _decodeSurrogates

```swift:line-numbers=290
  internal static func _decodeSurrogates(
    _ lead: CodeUnit,
    _ trail: CodeUnit
  ) -> Unicode.Scalar {
    _internalInvariant(isLeadSurrogate(lead))
    _internalInvariant(isTrailSurrogate(trail))
    return Unicode.Scalar(
      _unchecked: 0x10000 +
        (UInt32(lead & 0x03ff) &<< 10 | UInt32(trail & 0x03ff)))
  }
```
「😀」の `lead = 0xD83D`、`trail = 0xDE00` で追います。

1. `lead & 0x03ff` = `0x03D`（下位 10 ビット）。10 ビット左へずらして `0xF400`。
2. `trail & 0x03ff` = `0x200`。
3. OR して `0xF600`。
4. `0x10000` を足して `0x1F600`。これが「😀」の番号です。

## ここがすごい

- **比較 2 回をマスク 1 回に**: `x >= 0xD800 && x <= 0xDFFF` と書くと比較が 2 回です。サロゲートの範囲がちょうど 2 進数のきりのよい区切り（上位 5 ビットが固定）になっていることを利用して、AND 1 回と比較 1 回にしています。
- **Unicode の設計を素直に反映**: サロゲートペアは「`0x10000` を引いた残り 20 ビットを、上位 10 ビットと下位 10 ビットに分けて、それぞれ `0xD800` と `0xDC00` に足したもの」です。この関数はその逆を、マスク・シフト・OR・足し算の 4 つで行っています。
- **前提条件の明記**:この部分、「前半と後半のサロゲートが正しく渡されている」ことを前提にしていると明示しています。検証は呼び出し側が済ませている、という役割分担がコードから読み取れます。

## まとめ

- UTF-16 では、`U+10000` 以上の文字を 2 つの 16 ビット（サロゲートペア）で表す。
- サロゲートの範囲は上位 5 ビットが固定なので、マスク 1 回で判定できる。
- ペアから元の番号に戻すには、それぞれの下位 10 ビットをつなげて `0x10000` を足す。
