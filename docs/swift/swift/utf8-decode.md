---
title: "マスクとシフトだけで UTF-8 を 1 文字に戻す"
description: "1〜4 バイトの UTF-8 を Unicode のコードポイントに変換する関数。バイト数ごとに、必要なビットをマスクで取り出してシフトで並べ直す。ループも分岐もほとんどない。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/UTF8.swift
lines: [75, 101]
function: "Unicode.UTF8.decode(_:)"
difficulty: 3
tags: [Unicode, ビット演算, 文字列処理, 標準ライブラリ]
format: 2
---
## ひとことで

UTF-8 は、1 つの文字（Unicode スカラー）を 1〜4 バイトで表す方式です。この関数は、すでに正しいと確認済みの UTF-8 バイト列を受け取り、元の **コードポイント（文字の番号）** に戻します。
たとえば「é」は UTF-8 で `0xC3 0xA9` ですが、コードポイントは `U+00E9`（233）です。

## コード

```swift:line-numbers=75
  @inline(__always)
  @inlinable
  public static func decode(_ source: EncodedScalar) -> Unicode.Scalar {
    switch source.count {
    case 1:
      return Unicode.Scalar(_unchecked: source._biasedBits &- 0x01)
    case 2:
      let bits = source._biasedBits &- 0x0101
      var value = (bits & 0b0_______________________11_1111__0000_0000) &>> 8
      value    |= (bits & 0b0________________________________0001_1111) &<< 6
      return Unicode.Scalar(_unchecked: value)
    case 3:
      let bits = source._biasedBits &- 0x010101
      var value = (bits & 0b0____________11_1111__0000_0000__0000_0000) &>> 16
      value    |= (bits & 0b0_______________________11_1111__0000_0000) &>> 2
      value    |= (bits & 0b0________________________________0000_1111) &<< 12
      return Unicode.Scalar(_unchecked: value)
    default:
      _internalInvariant(source.count == 4)
      let bits = source._biasedBits &- 0x01010101
      var value = (bits & 0b0_11_1111__0000_0000__0000_0000__0000_0000) &>> 24
      value    |= (bits & 0b0____________11_1111__0000_0000__0000_0000) &>> 10
      value    |= (bits & 0b0_______________________11_1111__0000_0000) &<< 4
      value    |= (bits & 0b0________________________________0000_0111) &<< 18
      return Unicode.Scalar(_unchecked: value)
    }
  }
```

## 前提知識

- **UTF-8 の形**: 1 バイト目の先頭のビットで長さがわかり、残りのバイトは必ず `10` で始まります。`x` の部分に文字の番号のビットが入ります。
  - 1 バイト: `0xxxxxxx`
  - 2 バイト: `110xxxxx 10xxxxxx`
  - 3 バイト: `1110xxxx 10xxxxxx 10xxxxxx`
  - 4 バイト: `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx`
- **`EncodedScalar`**: ここでは `_ValidUTF8Buffer` という型で、最大 4 バイトを `UInt32` 1 つに詰めています。1 バイト目が最下位の 8 ビットに入り、**各バイトには 1 が足されて** います（0 を「空」の印にするため）。
- **`_biasedBits`**: その 1 を足した状態のビット列です。
- **`0b0___11_1111__0000_0000` のような書き方**: 2 進数リテラルです。`_` は読みやすさのための区切りで、値には影響しません。位置をそろえるために多めに入れてあります。
- **`Unicode.Scalar(_unchecked:)`**: 範囲チェックを省いてスカラーを作る内部用の初期化です。
- **`&>>` / `&<<`**: チェックなしのシフトです。

## 何をしているか

### 1. 2 バイトの場合

「é」（`0xC3 0xA9`）は 2 バイトです。`0xC3` の下位 5 ビット `00011` と、`0xA9` の下位 6 ビット `101001` を組み合わせると `0xE9`（233）になります。バイトごとに付いている 1 は、先頭のバイアスを引く 1 回の引き算でまとめて外します。

```swift:line-numbers=81
    case 2:
      let bits = source._biasedBits &- 0x0101
      var value = (bits & 0b0_______________________11_1111__0000_0000) &>> 8
      value    |= (bits & 0b0________________________________0001_1111) &<< 6
      return Unicode.Scalar(_unchecked: value)
```

### 2. 3 バイト・4 バイトの場合

3 バイト・4 バイトも同じ考え方で、各バイトの `x` の部分を取り出して正しい位置へずらし、OR で合わせます。

```swift:line-numbers=86
    case 3:
      let bits = source._biasedBits &- 0x010101
      var value = (bits & 0b0____________11_1111__0000_0000__0000_0000) &>> 16
      value    |= (bits & 0b0_______________________11_1111__0000_0000) &>> 2
      value    |= (bits & 0b0________________________________0000_1111) &<< 12
      return Unicode.Scalar(_unchecked: value)
    default:
      _internalInvariant(source.count == 4)
      let bits = source._biasedBits &- 0x01010101
      var value = (bits & 0b0_11_1111__0000_0000__0000_0000__0000_0000) &>> 24
      value    |= (bits & 0b0____________11_1111__0000_0000__0000_0000) &>> 10
      value    |= (bits & 0b0_______________________11_1111__0000_0000) &<< 4
      value    |= (bits & 0b0________________________________0000_0111) &<< 18
      return Unicode.Scalar(_unchecked: value)
```


## ここがすごい

- **バイアスを 1 回の引き算で外す**: 各バイトに足されていた 1 を、`0x01010101` のような値を引くことで全バイト同時に外しています。各バイトは 1 以上なので、引いても繰り下がりが起きず、バイトどうしが干渉しません。
- **ループを使わない**: 素直に書くと「1 バイトずつ読んで 6 ビットずつ左へずらす」ループになります。この関数は長さごとに式を展開しているので、分岐は最初の `switch` だけです。
- **マスクの見た目で意味がわかる**: 2 進数リテラルの `_` の入れ方で、どのバイトのどのビットを取っているかが一目でわかるようにそろえてあります。ビット演算のコードは読みにくくなりがちですが、書き方の工夫で読みやすくしています。
- **検証と変換を分ける**: この関数は「正しい UTF-8」を前提にしているので、チェックを一切しません。検証はパーサー側で一度だけ行います。役割を分けることで、どちらの処理も単純で速くなります。

## まとめ

- UTF-8 は、先頭のビットで長さが、残りの `x` の部分で文字の番号が決まる。
- 複数のバイトを整数 1 つに詰めると、マスクとシフトだけで並べ直せる。
- 検証と変換を分けると、変換側はチェックなしで最速にできる。
