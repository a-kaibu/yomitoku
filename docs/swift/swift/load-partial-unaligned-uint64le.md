---
title: "fallthrough で書く「端数バイトの読み込み」"
description: "ハッシュ計算で余った 0〜7 バイトを 1 つの 64 ビット整数に詰める関数。switch の fallthrough を使い、ループなしで必要なバイトだけを読む。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Hasher.swift
lines: [19, 52]
function: "_loadPartialUnalignedUInt64LE(_:byteCount:)"
difficulty: 2
tags: [ビット演算, ハッシュ, 低レイヤ, 標準ライブラリ]
format: 2
---
## ひとことで

ハッシュ関数はデータを 8 バイトずつまとめて処理しますが、データの長さが 8 の倍数とは限りません。最後に 1〜7 バイトの「端数」が残ります。
この関数は、ポインタ `p` の先にある `byteCount` バイト（0〜7）を読み、**リトルエンディアン（下位バイトが先）で 1 つの `UInt64` に詰めて** 返します。たとえば 3 バイト `0x41 0x42 0x43` なら `0x434241` になります。

## コード

```swift:line-numbers=19
@inline(__always)
internal func _loadPartialUnalignedUInt64LE(
  _ p: UnsafeRawPointer,
  byteCount: Int
) -> UInt64 {
  var result: UInt64 = 0
  switch byteCount {
  case 7:
    unsafe result |= UInt64(p.load(fromByteOffset: 6, as: UInt8.self)) &<< 48
    fallthrough
  case 6:
    unsafe result |= UInt64(p.load(fromByteOffset: 5, as: UInt8.self)) &<< 40
    fallthrough
  case 5:
    unsafe result |= UInt64(p.load(fromByteOffset: 4, as: UInt8.self)) &<< 32
    fallthrough
  case 4:
    unsafe result |= UInt64(p.load(fromByteOffset: 3, as: UInt8.self)) &<< 24
    fallthrough
  case 3:
    unsafe result |= UInt64(p.load(fromByteOffset: 2, as: UInt8.self)) &<< 16
    fallthrough
  case 2:
    unsafe result |= UInt64(p.load(fromByteOffset: 1, as: UInt8.self)) &<< 8
    fallthrough
  case 1:
    unsafe result |= UInt64(p.load(fromByteOffset: 0, as: UInt8.self))
    fallthrough
  case 0:
    return result
  default:
    _internalInvariantFailure()
  }
}
```

## 前提知識

- **`@inline(__always)`**: 「必ずインライン展開せよ」とコンパイラに指示する属性です。小さくて頻繁に呼ばれる関数に付けます。
- **`UnsafeRawPointer`**: 型の決まっていない生のメモリアドレスです。C の `const void *` に相当します。名前に `Unsafe` が付くのは、範囲外アクセスなどをコンパイラが守ってくれないからです。
- **`p.load(fromByteOffset: 6, as: UInt8.self)`**: アドレス `p + 6` から 1 バイトを `UInt8` として読み込みます。
- **`unsafe` キーワード**: 新しい Swift で、安全でない操作をしている式に付ける印です。動作は変わらず、「ここは危ない操作です」と読む人に知らせる役目です。
- **`|=`**: ビットごとの OR をして代入します。
- **`&<<`**: 「マスク付き左シフト」です。シフト量がビット幅以上のときの特別扱い（チェック）をせず、そのまま CPU のシフト命令になります。
- **`switch` と `fallthrough`**: Swift の `switch` は C と違い、`case` の終わりで自動的に抜けます。`fallthrough` と書いたときだけ、次の `case` の本体へ続けて実行します。
- **`default` 節**: どの `case` にも当てはまらないとき実行されます。ここでは「起きてはいけない状況」としてプログラムを止めます。

## 何をしているか

`byteCount = 3`、メモリに `0x41, 0x42, 0x43` が並んでいる場合で追います。

### 1. 入口へ飛ぶ

`switch` は `case 3:` に飛びます。3 バイト目（オフセット 2）の `0x43` を読み、16 ビット左へずらして OR します。`result = 0x430000`。

```swift:line-numbers=38
  case 3:
    unsafe result |= UInt64(p.load(fromByteOffset: 2, as: UInt8.self)) &<< 16
    fallthrough
```
### 2. 下の case へ落ちていく

`fallthrough` で `case 2:` へ進み、2 バイト目の `0x42` を 8 ビットずらして OR。`result = 0x434200`。さらに `case 1:` で 1 バイト目の `0x41` をそのまま OR し、`result = 0x434241` になります。

```swift:line-numbers=41
  case 2:
    unsafe result |= UInt64(p.load(fromByteOffset: 1, as: UInt8.self)) &<< 8
    fallthrough
  case 1:
    unsafe result |= UInt64(p.load(fromByteOffset: 0, as: UInt8.self))
    fallthrough
```
### 3. case 0 で返す

最後に `case 0:` へ落ちて `result` を返します。0 バイトのときは、いきなりここに来て 0 を返します。

```swift:line-numbers=47
  case 0:
    return result
```
`byteCount` がいくつでも、**その数から 0 まで階段を下りるように** 実行されます。

## ここがすごい

- **ループを展開した形を `switch` で表現**: `for i in 0..<byteCount` とループで書いても同じ結果になります。しかし `switch` + `fallthrough` にすると、入口へ 1 回ジャンプしたあとは分岐なしで一直線に進みます。C 言語で有名な「Duff's device」に近い発想です。
- **はみ出して読まない**: 8 バイトを一気に `load` すれば 1 命令で済みますが、それではデータの末尾を越えたメモリを読んでしまいます。境界がページの終わりなら、プログラムが落ちる危険があります。この関数は必要なバイトだけを読むので安全です。
- **アライメント（整列）を気にしない**: 1 バイトずつ読むので、アドレスが 8 の倍数でなくても問題ありません。関数名の `Unaligned` はそのことを表しています。
- **エンディアンを固定**: CPU がビッグエンディアンでもリトルエンディアンでも、同じバイト列から同じ値ができます（名前の `LE`）。ハッシュ値が機種によって変わらないための配慮です。

## まとめ

- Swift の `switch` は自動で抜けるが、`fallthrough` で次の `case` に続けられる。
- 「大きい番号から 0 まで落ちていく `switch`」は、展開済みループとして使える。
- 端数のデータは、末尾を越えて読まないように 1 バイトずつ組み立てる。
