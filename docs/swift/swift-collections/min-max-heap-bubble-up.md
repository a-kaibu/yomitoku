---
title: "挿入した要素を、親と祖父母だけ比べて正しい位置まで上げる"
description: "最小最大ヒープへの挿入後に、新しい要素を上へ運ぶ bubbleUp。レベルの種類で比べる相手を変え、親と同じ種類の祖父母だけを見ればよいことを使う。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/HeapModule/Heap+UnsafeHandle.swift
lines: [103, 131]
function: "Heap._UnsafeHandle.bubbleUp(_:)"
difficulty: 3
tags: [データ構造, アルゴリズム, 防御的プログラミング]
format: 2
---
## ひとことで

`bubbleUp(_:)` は、挿入した要素を正しい位置まで上へ運ぶ関数です。最小最大ヒープでは、要素がどのレベルにあるかで「小さい側に来るべきか、大きい側に来るべきか」が変わります。
この関数は、その切り替えを 1 か所にまとめて、親と祖父母だけを比べながら上へ進めます。

## コード

```swift:line-numbers=103
extension Heap._UnsafeHandle {
  @inlinable
  internal func bubbleUp(_ node: _HeapNode) {
    guard !node.isRoot else { return }

    let parent = node.parent()

    var node = node
    if unsafe (node.isMinLevel && self[node] > self[parent])
        || (!node.isMinLevel && self[node] < self[parent]){
      unsafe swapAt(node, parent)
      node = parent
    }

    if node.isMinLevel {
      while let grandparent = node.grandParent(),
            unsafe self[node] < self[grandparent] {
        unsafe swapAt(node, grandparent)
        node = grandparent
      }
    } else {
      while let grandparent = node.grandParent(),
            unsafe self[node] > self[grandparent] {
        unsafe swapAt(node, grandparent)
        node = grandparent
      }
    }
  }
}
```

## 前提知識

- **最小最大ヒープ**: 偶数レベルは親が小さく、奇数レベルは親が大きい構造です。
- **`node.parent()`**: 親ノードを返します。
- **`node.grandParent()`**: 祖父母ノードを返します。根に近いと `nil` です。
- **`while let ..., 条件 { }`**: オプショナルの値を取り出し、かつ条件も満たすあいだ繰り返す構文です。
- **`swapAt`**: 2 つの位置の要素を入れ替えます。

## 何をしているか

### 1. 親と比べて 1 回だけ入れ替える

親より「本来いるべき側」から外れていれば、親と入れ替えます。最小レベルなのに親より大きい、または最大レベルなのに親より小さい場合です。

```swift:line-numbers=110
    var node = node
    if unsafe (node.isMinLevel && self[node] > self[parent])
        || (!node.isMinLevel && self[node] < self[parent]){
      unsafe swapAt(node, parent)
      node = parent
    }
```
入れ替えたあとは、一段上の親の位置を基準にします。

### 2. 祖父母と比べながら上へ進む

そこから先は、同じ種類のレベルにいる祖父母とだけ比べます。最小レベルなら、祖父母より小さければ入れ替えます。

```swift:line-numbers=117
    if node.isMinLevel {
      while let grandparent = node.grandParent(),
            unsafe self[node] < self[grandparent] {
        unsafe swapAt(node, grandparent)
        node = grandparent
      }
```
最大レベルの場合は向きを逆にして、同じように祖父母と比べます。

```swift:line-numbers=123
    } else {
      while let grandparent = node.grandParent(),
            unsafe self[node] > self[grandparent] {
        unsafe swapAt(node, grandparent)
        node = grandparent
      }
```
## ここがすごい

- **比べる相手が 2 段飛びになる**: 同じ種類のレベルは、祖父母とのあいだで大小の向きが同じです。だから、親と比べる 1 回だけ特別扱いして、以降は祖父母だけを見ればよくなります。
- **向きの切り替えは 1 回の判定にまとめる**: 最初の `if` で、レベルの種類と比べる向きを 1 か所で決めています。
- **木の高さに比例した回数で終わる**: 1 回の挿入で上へ進むのは、根までの距離の半分程度です。要素全体を見ることはありません。

## まとめ

- 最小最大ヒープは、レベルの種類によって比べる向きが変わる。
- 同じ種類のレベルでは、祖父母とだけ比べれば十分。
- 挿入の修正は、木の高さに比例した回数で済む。
