---
title: "2 つの条件から、複製と拡張の組み合わせを選ぶ"
description: "Dictionary の書き換え前に、自分だけの記憶領域で必要な容量があるかを保証する ensureUnique。共有の有無と容量の有無の 4 通りに分けて、最小限の仕事をする。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/NativeDictionary.swift
lines: [261, 277]
function: "_NativeDictionary.ensureUnique(isUnique:capacity:)"
difficulty: 2
tags: [データ構造, 最適化, 並行処理, 標準ライブラリ]
format: 2
---
## ひとことで

Swift の `Dictionary` は値型です。`let b = a` とコピーしても、すぐには中身を複製しません。どちらかが書き換えるときに初めて複製します。これがコピーオンライトです。`ensureUnique(isUnique:capacity:)` は、書き換えの直前に呼ばれ、自分だけが持つ記憶領域で、`capacity` 個の要素が入る状態を保証します。2 つの条件の組み合わせで 4 通りの対応を選び、必要最小限の仕事しかしません。

## コード

```swift:line-numbers=261
  @inlinable
  @_semantics("optimize.sil.specialize.generic.size.never")
  internal mutating func ensureUnique(isUnique: Bool, capacity: Int) -> Bool {
    if _fastPath(capacity <= self.capacity && isUnique) {
      return false
    }
    if isUnique {
      resize(capacity: capacity)
      return true
    }
    if capacity <= self.capacity {
      copy()
      return false
    }
    copyAndResize(capacity: capacity)
    return true
  }
```

## 前提知識

- **コピーオンライト（copy-on-write）**: 値をコピーしたとき、中身の記憶領域は共有しておき、書き換えるときに共有されていれば複製する仕組みです。大きな辞書をコピーしても、書き換えなければコストはかかりません。
- **`isUnique`**: 記憶領域を参照しているのが自分だけかどうかです。呼び出し側が調べて渡します。
- **`self.capacity`**: いまの記憶領域に入る要素数の上限です。
- **`resize(capacity:)`**: 記憶領域を作り直し、要素を移します。自分だけのものなので、移動でよいのです。
- **`copy()` と `copyAndResize(capacity:)`**: 同じ大きさで複製する関数と、大きく作り直しながら要素をコピーする関数です。共有されているので、元は残しておく必要があります。
- **`_fastPath`**: たいてい真になる条件だとコンパイラに伝えるヒントです。

## 何をしているか

### 1. 自分だけで、容量も足りるなら何もしない

これがいちばん多い場合です。条件が両方そろえば、何もせずに `false` を返します。

```swift:line-numbers=264
    if _fastPath(capacity <= self.capacity && isUnique) {
      return false
    }
```
### 2. 自分だけで、容量が足りないなら広げる

共有はされていないので、古い記憶領域から要素を移して広げます。作り直したので、`true` を返します。

```swift:line-numbers=267
    if isUnique {
      resize(capacity: capacity)
      return true
    }
```
### 3. 共有されていて、容量は足りるなら複製する

他の辞書と共有されているので、書き換える前に複製が必要です。容量は足りているので、同じ大きさで複製し、`false` を返します。

```swift:line-numbers=271
    if capacity <= self.capacity {
      copy()
      return false
    }
```
### 4. 共有されていて、容量も足りないなら、複製しながら広げる

共有もされていて、容量も足りません。`copyAndResize` で、大きな記憶領域へ直接コピーします。複製と拡張を 1 回で済ませます。`true` を返します。

```swift:line-numbers=275
    copyAndResize(capacity: capacity)
    return true
```
## ここがすごい

- **よくある場合を最初に判定する**: 辞書を書き換えるときは、たいてい自分だけが持っていて、容量にも余裕があります。それを最初に判定して、何もせず戻ります。ほとんどの書き込みは、この比較 2 つで終わります。
- **複製と拡張を 1 回で**: 共有されていて容量も足りないとき、「複製してから広げる」と 2 回メモリを確保することになります。`copyAndResize` は、大きな記憶領域へ直接コピーするので、1 回で済みます。
- **移動とコピーを使い分ける**: 自分だけが持っているなら、古い記憶領域から要素を移せます。共有されているなら、元の持ち主のためにコピーが必要です。`resize` と `copyAndResize` は、この違いを反映しています。
- **戻り値で呼び出し側を助ける**: 作り直したかを返すので、呼び出し側は位置が変わったときだけ探し直せます。

## まとめ

- コピーオンライトでは、書き換えの直前に共有されていないかを確かめて、必要なときだけ複製する。
- 2 つの条件の組み合わせで処理を分けると、どの場合も最小限の仕事で済む。
- 作り直したかを返すと、呼び出し側が無駄な再計算を省ける。
