---
title: "「共有か」×「足りるか」の 4 通りで最小の仕事を選ぶ"
description: "Dictionary のコピーオンライトと容量拡張を担う関数。自分だけが持っているか、容量が足りるかの組み合わせで、何もしない・広げる・複製する・複製して広げるの 4 つを使い分ける。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2026 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/NativeDictionary.swift
lines: [257, 277]
function: "_NativeDictionary.ensureUnique(isUnique:capacity:)"
difficulty: 2
tags: [データ構造, メモリ管理, 最適化, 標準ライブラリ]
---
## ひとことで

Swift の `Dictionary` は値型で、`let b = a` とコピーしても、すぐには中身を複製しません。どちらかが書き換えるときに初めて複製します（コピーオンライト）。
`ensureUnique(isUnique:capacity:)` は、書き換えの直前に呼ばれ、「自分だけの記憶領域で、`capacity` 個入る」状態を保証します。**2 つの条件の組み合わせで 4 通りの対応** を選び、必要最小限の仕事しかしません。

## コード

```swift:line-numbers=257
  /// Ensure storage of self is uniquely held and can hold at least `capacity`
  /// elements.
  ///
  /// -Returns: `true` if contents were rehashed; otherwise, `false`.
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

- **コピーオンライト（copy-on-write）**: 値をコピーしたとき、実際の中身（記憶領域）は共有しておき、書き換えるときに共有されていれば複製する仕組みです。大きな辞書をコピーしても、書き換えなければコストはかかりません。
- **`isUnique`**: 記憶領域を参照しているのが自分だけかどうかです。呼び出し側が `isKnownUniquelyReferenced` などで調べて渡します。
- **`self.capacity`**: いまの記憶領域に入る要素数の上限です。
- **`resize(capacity:)`**: 記憶領域を大きく作り直し、要素を移します（自分だけのものなので、移動でよい）。
- **`copy()`**: 同じ大きさで複製します。
- **`copyAndResize(capacity:)`**: 大きく作り直しつつ、要素をコピーします（共有されているので、元は残す）。
- **`_fastPath`**: たいてい真になる条件だとコンパイラに伝えるヒントです。
- **`@_semantics("optimize.sil.specialize.generic.size.never")`**: この関数をサイズ優先の最適化で特殊化しない、という内部向けの指示です。

## 何をしているか

| 自分だけ？ | 容量は足りる？ | 処理 | 戻り値 |
| --- | --- | --- | --- |
| はい | はい | 何もしない（この部分） | false |
| はい | いいえ | 広げる（この部分） | true |
| いいえ | はい | 複製する（この部分） | false |
| いいえ | いいえ | 複製しながら広げる（この部分） | true |

戻り値は「中身を作り直した（要素の位置が変わった）か」です。同じ大きさの複製では、位置は変わらないので false です。

## ここがすごい

- **よくある場合を最初に**: 辞書を書き換えるときは、たいてい自分だけが持っていて、容量にも余裕があります。それを `_fastPath` 付きで最初に判定し、何もせずに戻ります。ほとんどの書き込みは、この比較 2 つで終わります。
- **複製と拡張を 1 回で**: 共有されていて容量も足りないとき、「複製してから広げる」と 2 回メモリを確保してしまいます。`copyAndResize` は大きな記憶領域に直接コピーするので、1 回で済みます。
- **移動とコピーの使い分け**: 自分だけが持っているなら、古い記憶領域から要素を「移動」できます（参照カウントの増減が要らない）。共有されているなら、元の持ち主のために「コピー」が必要です。`resize` と `copyAndResize` を分けているのはこのためです。
- **戻り値で呼び出し側を助ける**: 作り直したかを返すので、呼び出し側（`mutatingFind`）は「位置が変わったときだけ探し直す」ことができます。

## まとめ

- コピーオンライトでは、書き換えの直前に「共有されていないか」を確かめて、必要なときだけ複製する。
- 2 つの条件の組み合わせで処理を分けると、どの場合も最小限の仕事で済む。
- 「作り直したか」を返すと、呼び出し側が無駄な再計算を省ける。
