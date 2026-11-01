---
title: "後ろの親から順に沈めて、配列を線形時間でヒープにする"
description: "配列を最小最大ヒープに並べ替える heapify。根から順に積むのではなく、最後の親から逆向きに沈める Floyd のヒープ構築法で、要素数に比例した時間で終わる。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/HeapModule/Heap+UnsafeHandle.swift
lines: [362, 391]
function: "Heap._UnsafeHandle.heapify()"
difficulty: 3
tags: [データ構造, アルゴリズム, ソート]
format: 2
---
## ひとことで

`heapify()` は、ただの配列を **ヒープ（親が子より小さい、またはその逆の関係になる木の形の並び）** に組み直す関数です。この `Heap` は最小値と最大値の両方をすぐ取り出せる「最小最大ヒープ」なので、深さ（レベル）ごとに大小の向きが切り替わります。
素直に要素を 1 つずつ入れていくと `n log n` かかりますが、この関数は後ろの親から順に沈めていくので、全体が要素数に比例した時間で終わります。

## コード

::: code-group

```swift:line-numbers=362 [日本語訳]
extension Heap._UnsafeHandle {
  @inlinable
  internal func heapify() {
    // これは Floyd の線形時間のヒープ構築アルゴリズムです。
    // 参考: https://en.wikipedia.org/wiki/Heapsort#Floyd's_heap_construction （Floyd のヒープ構築）
    //
    // FIXME: よりキャッシュに優しいアルゴリズムのほうが速いかを確かめる。

    let limit = count / 2 // 左の子を持たない最初の添字。
    var level = _HeapNode.level(forOffset: limit &- 1)
    while level >= 0 {
      let nodes = _HeapNode.allNodes(onLevel: level, limit: limit)
      unsafe _heapify(level, nodes)
      level &-= 1
    }
  }

  @inlinable
  internal func _heapify(_ level: Int, _ nodes: ClosedRange<_HeapNode>?) {
    guard let nodes = nodes else { return }
    if _HeapNode.isMinLevel(level) {
      nodes._forEach { node in
        unsafe trickleDownMin(node)
      }
    } else {
      nodes._forEach { node in
        unsafe trickleDownMax(node)
      }
    }
  }
```

```swift:line-numbers=362 [原文]
extension Heap._UnsafeHandle {
  @inlinable
  internal func heapify() {
    // This is Floyd's linear-time heap construction algorithm.
    // (https://en.wikipedia.org/wiki/Heapsort#Floyd's_heap_construction).
    //
    // FIXME: See if a more cache friendly algorithm would be faster.

    let limit = count / 2 // The first offset without a left child
    var level = _HeapNode.level(forOffset: limit &- 1)
    while level >= 0 {
      let nodes = _HeapNode.allNodes(onLevel: level, limit: limit)
      unsafe _heapify(level, nodes)
      level &-= 1
    }
  }

  @inlinable
  internal func _heapify(_ level: Int, _ nodes: ClosedRange<_HeapNode>?) {
    guard let nodes = nodes else { return }
    if _HeapNode.isMinLevel(level) {
      nodes._forEach { node in
        unsafe trickleDownMin(node)
      }
    } else {
      nodes._forEach { node in
        unsafe trickleDownMax(node)
      }
    }
  }
```

:::

## 前提知識

- **ヒープ**: 木の形をした並びで、親と子の大小関係だけを守る構造です。配列の添字 `i` の子は `2i+1` と `2i+2` にあります。
- **最小最大ヒープ**: 偶数のレベルは「親が小さい」、奇数のレベルは「親が大きい」ルールになっています。最小値と最大値を、どちらも根とその子から取り出せます。
- **`_HeapNode`**: 木の中の位置を表す型です。`level(forOffset:)` でその位置の深さを求めます。
- **`limit`**: 子を持たない最初の添字です。`count / 2` で求まります。
- **`ClosedRange<_HeapNode>?`**: そのレベルにあるノードの範囲です。`nil` なら何もありません。

## 何をしているか

### 最後の親から逆向きに進める

`limit = count / 2` より前の添字はすべて子を持つノードです。その中で一番深い（レベルの大きい）ところから、根に向かって 1 つずつレベルを下げていきます。

```swift:line-numbers=370
    let limit = count / 2 // 左の子を持たない最初の添字。
    var level = _HeapNode.level(forOffset: limit &- 1)
    while level >= 0 {
      let nodes = _HeapNode.allNodes(onLevel: level, limit: limit)
      unsafe _heapify(level, nodes)
      level &-= 1
    }
```
### レベルごとに沈める

`_heapify` は、そのレベルにあるノードを 1 つずつ取り出し、レベルの種類に合わせて沈める関数を呼びます。偶数レベルなら最小ルール、奇数レベルなら最大ルールです。

```swift:line-numbers=380
  internal func _heapify(_ level: Int, _ nodes: ClosedRange<_HeapNode>?) {
    guard let nodes = nodes else { return }
    if _HeapNode.isMinLevel(level) {
      nodes._forEach { node in
        unsafe trickleDownMin(node)
      }
    } else {
      nodes._forEach { node in
        unsafe trickleDownMax(node)
      }
    }
```
### 大きな点

下のレベルから作っていくので、沈めるときには下の部分がすでにヒープになっています。だから各ノードは、その下の部分の中で正しい位置まで沈めればよいだけです。

## ここがすごい

- **要素を 1 つずつ入れるより速い**: 後ろの親から順に沈める方法では、深いノードの数が多い分、沈める距離は短くなります。合計すると、要素数に比例した時間で終わります。
- **レベル単位でまとめる**: 同じレベルのノードは、互いに影響しないので、どの順番で沈めても結果は同じです。この性質を利用して、`_heapify` は 1 レベルぶんをまとめて処理します。
- **出典が明記されている**: 関数の冒頭のコメントに、Floyd のヒープ構築法へのリンクがあります。性能の性質を知りたいときに、元の資料へたどれます。

## まとめ

- ヒープは、後ろの親から沈める方法で、要素数に比例した時間で作れる。
- 下のレベルから作ると、沈める先がすでにヒープになっているので、考えることが減る。
- 同じレベルのノードは独立なので、まとめて処理できる。
