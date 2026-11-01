---
title: "x と x - 1 の AND で、2 の冪かどうかを調べる"
description: "x が 2 の冪（1、2、4、8 …）かどうかを、1 回の AND で判定する標準ライブラリの関数。0 は先に除外する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2017 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/Misc.swift
lines: [17, 27]
function: "_isPowerOf2(_:)"
difficulty: 1
tags: [ビット演算, 低レイヤ]
format: 2
---
## ひとことで

2 の冪（1、2、4、8 …）かどうかを、割り算やループを使わずに、1 回の AND で調べます。0 は 2 の冪ではないので、最初に取り除きます。

## コード

::: code-group

```swift:line-numbers=17 [日本語訳]
/// x が 2 の冪なら true を返します。
@_transparent
public // テストから参照できるように公開します（@testable）。
func _isPowerOf2(_ x: UInt) -> Bool {
  if x == 0 {
    return false
  }
  // x が 0 でないことは確かめ済みなので、
  // オーバーフローの検査を省いた引き算を使います。
  return x & (x &- 1) == 0
}
```

```swift:line-numbers=17 [原文]
/// Returns if `x` is a power of 2.
@_transparent
public // @testable
func _isPowerOf2(_ x: UInt) -> Bool {
  if x == 0 {
    return false
  }
  // Note: use unchecked subtraction because we have checked that `x` is not
  // zero.
  return x & (x &- 1) == 0
}
```

:::

## 前提知識

- **2 の冪**: 2 進数で、1 のビットがちょうど 1 つだけある数です。たとえば 8 は `0b1000` です。
- **引き算と下位ビット**: 2 進数で `x - 1` は、いちばん下の 1 のビットを 0 にし、その下のビットを全部 1 にします。たとえば `1000 - 1` は `0111` です。
- **`&-`**: 範囲を超えたときにエラーにせず、折り返す引き算です。普通の `-` は、超えると実行時エラーになります。

## 何をしているか

### 1. 0 は 2 の冪ではないので除く

```swift:line-numbers=20
func _isPowerOf2(_ x: UInt) -> Bool {
  if x == 0 {
    return false
  }
```
### 2. 1 のビットがちょうど 1 つかを調べる

`x` と `x - 1` の AND が 0 になるのは、`x` のビットが 1 つだけのときです。`8`（`1000`）と `7`（`0111`）の AND は `0000` です。

```swift:line-numbers=24
  // x が 0 でないことは確かめ済みなので、
  // オーバーフローの検査を省いた引き算を使います。
  return x & (x &- 1) == 0
```
## ここがすごい

- **AND 1 回で判定できる**: 数える、割る、ループする、といった処理が要りません。
- **0 を先に除く理由が明確**: 0 は `x - 1` が折り返して、条件を満たしてしまうので、先に弾いています。
- **性質そのものを式にしている**: 2 の冪の定義（1 のビットが 1 つ）を、そのまま式で書いています。

## まとめ

- `x & (x - 1) == 0` なら、x は 2 の冪である（ただし x が 0 でないとき）。
- 0 は先に除く。
- 引き算は `&-` で書き、折り返しを明示する。
