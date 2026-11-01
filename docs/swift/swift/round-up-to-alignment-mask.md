---
title: "2 の冪の境界へ、足し算とマスクで切り上げる"
description: "メモリの位置を、2 の冪の大きさ（アライメント）の倍数へ切り上げる標準ライブラリの関数。アライメントから 1 を引いて足し、下位ビットをマスクで消す。割り算を使わない。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Builtin.swift
lines: [23, 32]
function: "_roundUpImpl(_:toAlignment:)"
difficulty: 2
tags: [ビット演算, メモリ管理, 低レイヤ]
format: 2
---
## ひとことで

メモリの配置には、「この値は 8 バイトの倍数にそろえる」のような決まりがあります。これを **アライメント** と呼びます。
この関数は、ある位置を、アライメント以上で最も近い倍数へ **切り上げ** ます。割り算は使わず、足し算と AND だけで求めます。アライメントは 2 の冪であることが前提です。

## コード

::: code-group

```swift:line-numbers=23 [日本語訳]
internal func _roundUpImpl(_ offset: UInt, toAlignment alignment: Int) -> UInt {
  _internalInvariant(alignment > 0)
  _internalInvariant(_isPowerOf2(alignment))
  // offset は 0 以上、alignment は 0 より大きいので、
  // 1 を引いても下回ることがないため、オーバーフローの検査は要りません。
  let x = offset + UInt(bitPattern: alignment) &- 1
  // alignment は 2 の冪なので、マスクを使うと
  // 揃えた値を効率よく求められます。
  return x & ~(UInt(bitPattern: alignment) &- 1)
}
```

```swift:line-numbers=23 [原文]
internal func _roundUpImpl(_ offset: UInt, toAlignment alignment: Int) -> UInt {
  _internalInvariant(alignment > 0)
  _internalInvariant(_isPowerOf2(alignment))
  // Note, given that offset is >= 0, and alignment > 0, we don't
  // need to underflow check the -1, as it can never underflow.
  let x = offset + UInt(bitPattern: alignment) &- 1
  // Note, as alignment is a power of 2, we'll use masking to efficiently
  // get the aligned value
  return x & ~(UInt(bitPattern: alignment) &- 1)
}
```

:::

## 前提知識

- **アライメント**: データを置く位置が、その大きさの倍数になるようにする決まりです。たとえば 8 のアライメントなら、位置は 0、8、16 …になります。
- **2 の冪**: 1、2、4、8、16 のような数です。2 進数では、1 つのビットだけが 1 です。
- **`~` と `&`**: `~` は全部のビットを反転し、`&` は両方が 1 のビットだけを残します。

## 何をしているか

### 1. 前提を確かめる

アライメントは 0 より大きく、2 の冪でなければなりません。この前提は、内部の検査で確かめています。

```swift:line-numbers=24
  _internalInvariant(alignment > 0)
  _internalInvariant(_isPowerOf2(alignment))
```
### 2. 位置に `アライメント - 1` を足す

切り上げには、位置にアライメントから 1 を引いた値を足します。こうすると、倍数を超えた位置は次の倍数に届き、ちょうど倍数の位置はそのまま残ります。

```swift:line-numbers=26
  // offset は 0 以上、alignment は 0 より大きいので、
  // 1 を引いても下回ることがないため、オーバーフローの検査は要りません。
  let x = offset + UInt(bitPattern: alignment) &- 1
```
### 3. 下位ビットを消して、倍数にする

アライメント - 1 の補数を AND にかけると、下位ビットがすべて 0 になります。アライメントが 2 の冪なので、これでちょうど倍数になります。

```swift:line-numbers=29
  // alignment は 2 の冪なので、マスクを使うと
  // 揃えた値を効率よく求められます。
  return x & ~(UInt(bitPattern: alignment) &- 1)
```
例として、位置 13 をアライメント 8 に切り上げます。`13 + 8 - 1 = 20`（`0b10100`）です。`~7` で下の 3 ビットを消すと、`16` になります。すでに倍数の位置 16 は、`16 + 7 = 23` からは `16` のままです。

## ここがすごい

- **割り算が要らない**: 倍数への切り上げを、普通は割り算で書きます。2 の冪なら、足し算と AND だけで済みます。
- **ちょうどの倍数は動かない**: 足す値がアライメント未満のとき、倍数の位置は次の倍数に届きません。そのため、すでにそろっている位置は変わりません。
- **オーバーフローの検査が要らない箇所を明示**: 0 以上の位置から 1 を引いても下回らないと、コメントで理由が書かれています。前提から安全性を説明しています。

## まとめ

- 2 の冪の倍数への切り上げは、`(位置 + アライメント - 1) & ~(アライメント - 1)` で求まる。
- 割り算を使わず、足し算と AND だけで済む。
- この前提が成り立つのは、アライメントが 2 の冪のとき。
