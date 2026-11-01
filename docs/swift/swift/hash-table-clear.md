---
title: "空きに戻すとき、存在しない枠を埋まっていることにする"
description: "ハッシュテーブルの占有ビットを全部空きに戻す clear()。枠が 64 未満のときだけ、存在しない枠のビットを 1 にしておき、後の探索の場合分けを減らす。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/HashTable.swift
lines: [452, 463]
function: "_HashTable.clear()"
difficulty: 2
tags: [ビット演算, データ構造, 最適化, 標準ライブラリ]
format: 2
---
## ひとことで

Swift の `Dictionary` と `Set` の内部では、各枠（バケット）が埋まっているかどうかを、1 ビットが 1 枠のビット集合で管理しています。`clear()` は、それを「全部空き」に戻す関数です。ふつうは、全ビットを 0 にするだけです。ただし、枠の数が 64 未満のとき（1 つの 64 ビットのワードに収まるとき）だけ、存在しない枠のビットを 1 にします。埋まっている扱いにしておくと、空き枠を探す処理で範囲外を特別扱いしなくて済みます。

## コード

::: code-group

```swift:line-numbers=452 [日本語訳]
  @inlinable
  @inline(__always)
  internal func clear() {
    if unsafe bucketCount < Word.capacity {
      // 1 つだけの部分的なワードしかないとき、範囲外のビットをすべて立てておきます。
      // そうすると、特別な場合分けなしで、`occupiedBucket(after:)` と `nextHole(atOrAfter:)` が正しく動きます。
      // そのための準備です。
      unsafe words[0] = Word.allBits.subtracting(elementsBelow: bucketCount)
    } else {
      unsafe words.update(repeating: .empty, count: wordCount)
    }
  }
```

```swift:line-numbers=452 [原文]
  @inlinable
  @inline(__always)
  internal func clear() {
    if unsafe bucketCount < Word.capacity {
      // We have only a single partial word. Set all out of bounds bits, so that
      // `occupiedBucket(after:)` and `nextHole(atOrAfter:)` works correctly
      // without a special case.
      unsafe words[0] = Word.allBits.subtracting(elementsBelow: bucketCount)
    } else {
      unsafe words.update(repeating: .empty, count: wordCount)
    }
  }
```

:::

## 前提知識

- **`bucketCount`**: テーブルの枠の数です。常に 2 のべき乗（2、4、8 など）です。
- **`Word.capacity`**: 1 ワードのビット数です。64 ビット環境では 64 です。
- **`Word.allBits`**: すべてのビットが 1 のワードです。
- **`.subtracting(elementsBelow:)`**: 下位の指定したビット数を 0 にします。
- **`words.update(repeating:count:)`**: ポインタの先にある指定数のワードを、同じ値で上書きします。
- **`unsafe`**: 安全性をコンパイラが確かめられない操作に付ける印です。

## 何をしているか

### 1. 枠が 64 未満の場合

`bucketCount` が 8 なら、使うビットは下位 8 ビットだけです。`Word.allBits` から下位 8 ビットを消すと、上位 56 ビットだけが 1 のワードになります。下位の 8 ビットは実在する枠で、0 のまま「空き」です。上位の 56 ビットは存在しない枠で、1 にして「埋まっている扱い」にしています。

```swift:line-numbers=455
    if unsafe bucketCount < Word.capacity {
      // 1 つだけの部分的なワードしかないとき、範囲外のビットをすべて立てておきます。
      // そうすると、特別な場合分けなしで、`occupiedBucket(after:)` と `nextHole(atOrAfter:)` が正しく動きます。
      // そのための準備です。
      unsafe words[0] = Word.allBits.subtracting(elementsBelow: bucketCount)
```
### 2. 枠が 64 以上の場合

枠の数は 2 のべき乗なので、64 以上なら必ず 64 の倍数です。すべてのワードがちょうど使い切られ、範囲外のビットは存在しません。だから、全部のワードを 0 で上書きするだけで済みます。

```swift:line-numbers=460
    } else {
      unsafe words.update(repeating: .empty, count: wordCount)
    }
```
## ここがすごい

- **データの側で特別扱いを消す**: 空き枠を探す `nextHole(atOrAfter:)` は、ワードを反転して最下位の 1 を探します。範囲外のビットが 0 のままだと、反転すると 1 になり、存在しない枠が空いていると誤解してしまいます。範囲外を最初から埋まっていることにしておけば、探索のたびに範囲内かを調べる必要がありません。
- **2 のべき乗だから場合分けが 2 つで済む**: 枠の数が 2 のべき乗なので、1 ワードに満たないか、ワードをちょうど使い切るかのどちらかしかありません。「最後のワードだけ半端」という場合がないので、初期化も単純です。
- **意図がコメントにある**: なぜ範囲外のビットを立てるのか、どの関数のための準備なのかが、コメントに書かれています。

## まとめ

- 番兵のように、データに「ここから先は使えない」という印を入れておくと、処理側の分岐が減る。
- 範囲外のビットを埋まっていることにすると、反転して探すときに誤って見つけることがない。
- 枠の数を 2 のべき乗に限ると、端数の扱いが単純になる。
