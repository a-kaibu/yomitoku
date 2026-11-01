---
title: "シフト 1 回で末尾に追加、先頭から取り出し"
description: "UInt32 に詰めた UTF-8 バイト列の append と removeFirst。現在のバイト数 × 8 だけずらして OR するだけで、配列の末尾追加と同じことをする。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/ValidUTF8Buffer.swift
lines: [164, 181]
function: "_ValidUTF8Buffer.append(_:) / removeFirst()"
difficulty: 2
tags: [データ構造, ビット演算, Unicode, 標準ライブラリ]
format: 2
---
## ひとことで

`_ValidUTF8Buffer` は、UTF-8 の最大 4 バイトを `UInt32` 1 つに詰めて持つ型です。各バイトは 1 を足した値で保存され、1 バイト目が最下位の 8 ビットに入ります。
`append(_:)` は末尾にバイトを 1 つ追加し、`removeFirst()` は先頭のバイトを取り出します。どちらも **シフトと OR だけ** でできています。

## コード

```swift:line-numbers=164
  @inlinable
  @inline(__always)
  public mutating func append(_ e: Element) {
    _debugPrecondition(count + 1 <= capacity)
    _internalInvariant(
      e != 192 && e != 193 && !(245...255).contains(e), "invalid UTF8 byte")
    _biasedBits |= UInt32(e &+ 1) &<< (count &<< 3)
  }

  @inlinable
  @inline(__always)
  @discardableResult
  public mutating func removeFirst() -> Element {
    _debugPrecondition(!isEmpty)
    let result = Element(truncatingIfNeeded: _biasedBits) &- 1
    _biasedBits = _biasedBits._fullShiftRight(8)
    return result
  }
```

## 前提知識

- **`mutating func`**: 構造体の中身を書き換えるメソッドです。
- **`_debugPrecondition`**: デバッグビルドでだけ条件を確かめ、偽ならプログラムを止めます。
- **`_internalInvariant`**: 標準ライブラリ内部の前提条件チェックです。
- **`(245...255).contains(e)`**: `e` が 245〜255 の範囲に入っているか。`...` は終わりを含む範囲です。
- **`count &<< 3`**: `count * 8` と同じです（3 ビット左シフト = 8 倍）。
- **`@discardableResult`**: 戻り値を無視しても警告が出ません。
- **`_fullShiftRight(8)`**: 「ビット幅を超えるシフトでも正しく 0 になる」右シフトです。
- **UTF-8 で使われないバイト**: 192 (`0xC0`)、193 (`0xC1`)、245〜255 (`0xF5`〜`0xFF`) は、正しい UTF-8 には決して現れません。

## 何をしているか

「é」（`0xC3 0xA9`）を 1 バイトずつ追加する例で追います。

### append

```swift:line-numbers=166
  public mutating func append(_ e: Element) {
    _debugPrecondition(count + 1 <= capacity)
    _internalInvariant(
      e != 192 && e != 193 && !(245...255).contains(e), "invalid UTF8 byte")
    _biasedBits |= UInt32(e &+ 1) &<< (count &<< 3)
  }
```
1. 最初は空（`_biasedBits = 0`、`count = 0`）。
2. `append(0xC3)`: `0xC3 + 1 = 0xC4` を `0 * 8 = 0` ビットずらして OR。`_biasedBits = 0x0000_00C4`。
3. `append(0xA9)`: `count` は 1 なので、`0xAA` を 8 ビットずらして OR。`_biasedBits = 0x0000_AAC4`。この部分は、追加するバイトが UTF-8 として正しいかを確かめています。これはデバッグ用のチェックです。

### removeFirst

```swift:line-numbers=176
  public mutating func removeFirst() -> Element {
    _debugPrecondition(!isEmpty)
    let result = Element(truncatingIfNeeded: _biasedBits) &- 1
    _biasedBits = _biasedBits._fullShiftRight(8)
    return result
  }
```
1. 最下位 8 ビット（`0xC4`）を取り出し、1 を引いて `0xC3` を得ます。
2. 全体を 8 ビット右へずらします。`0x0000_00AA` になり、次の先頭は `0xA9` です。
3. `0xC3` を返します。

## ここがすごい

- **末尾の位置を数えなくてよい**: 配列なら「次に書く位置」を別に持ちます。この型は `count` を `leadingZeroBitCount` から計算できるので（同じファイル）、追加位置の情報を別に持つ必要がありません。
- **先頭の削除がシフト 1 回**: 配列の `removeFirst` は残りの要素をすべて前へ詰めるので、要素数に比例した時間がかかります。この型では右シフト 1 回です。
- **`_fullShiftRight` の意味**: 4 バイトすべてを取り除く直前、`UInt32` を 8 ビットずらすのは問題ありません。ただしジェネリックなコードでは、シフト量がビット幅以上になることもあり、CPU によって結果が変わります。常に正しい結果を返すシフトを使って、どんな場合でも安全にしています。
- **不正なバイトを除外する理由**: 1 を足して保存する仕組みは、`0xFF` が入ってくると壊れます（`0xFF + 1` が 0 になり「空」と区別できない）。この部分チェックは、それが起きないことの保証でもあります。

## まとめ

- 整数をバイトの入れ物として使うと、追加は「シフトして OR」、先頭の削除は「シフト」で済む。
- 要素数が他の情報から計算できるなら、別に持つ必要はない。
- データの表現に前提（ここでは 0xFF が来ない）があるなら、チェックで守る。
