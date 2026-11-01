---
title: "範囲外のビットを「埋まっている」にしておく下ごしらえ"
description: "ハッシュテーブルの占有ビットを初期化する関数。枠が 64 個未満のときは、存在しない枠のビットを 1 にしておくことで、探索処理から特別扱いの分岐を消している。"
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
---
## ひとことで

Swift の `Dictionary` と `Set` の内部では、各枠（バケット）が埋まっているかどうかを、1 ビット = 1 枠のビット集合で管理しています。`clear()` はそれを「全部空き」に戻す関数です。
ふつうは全ビットを 0 にするだけですが、枠の数が 64 未満（1 つの 64 ビットワードに収まる）のときだけ、**存在しない枠のビットを 1（埋まっている扱い）** にします。こうしておくと、空き枠を探す処理などで範囲外を特別扱いしなくて済みます。

## コード

```swift:line-numbers=452
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

## 前提知識

- **`bucketCount`**: テーブルの枠の数です。常に 2 のべき乗（2, 4, 8, …）です。
- **`Word.capacity`**: 1 ワードのビット数です。64 ビット環境では 64。
- **`words[0]`**: ビット集合の最初のワードです。
- **`Word.allBits`**: すべてのビットが 1 のワードです。
- **`.subtracting(elementsBelow: n)`**: 下位 `n` ビットを 0 にします。
- **`words.update(repeating: .empty, count: wordCount)`**: ポインタの先にある `wordCount` 個のワードを、すべて空（0）で上書きします。
- **`unsafe`**: 安全性をコンパイラが確かめられない操作に付ける印です。

## 何をしているか

### 枠が 64 未満の場合（この部分）

`bucketCount = 8` なら、使うビットは下位 8 ビットだけです。

`Word.allBits.subtracting(elementsBelow: 8)` は、すべて 1 の値から下位 8 ビットを 0 にしたもの、つまり `1111…1111_0000_0000` です。

- 下位 8 ビット（実在する 8 枠）: 0 = 空き。
- 上位 56 ビット（存在しない枠）: 1 = 埋まっている扱い。

### 枠が 64 以上の場合（この部分）

枠の数は 2 のべき乗なので、64 以上なら必ず 64 の倍数です。すべてのワードがちょうど使い切られるので、範囲外のビットはありません。全部を 0 にするだけです。

## ここがすごい

- **データの側で特別扱いを消す**: 空き枠を探す `nextHole(atOrAfter:)` は、ワードを反転して最下位の 1 を探します。もし範囲外のビットが 0 のままだと、反転すると 1 になり、「存在しない 9 番目の枠が空いている」と誤解してしまいます。それを防ぐには、探索のたびに「範囲内か」をチェックする必要があります。初期化のときに範囲外を 1 にしておけば、そのチェックがまるごと不要になります。
- **2 のべき乗だから場合分けが 2 つで済む**: 枠の数が 2 のべき乗なので、「1 ワードに満たない」か「ワードをちょうど使い切る」のどちらかしかありません。「最後のワードだけ半端」という場合がないので、初期化も単純です。
- **コメントで意図を説明**:この部分、なぜ範囲外のビットを立てるのか、どの関数のためなのかが書かれています。同じ工夫は、ビット集合を受け取る側（同じファイルのこの部分コメント）にも説明されています。

## まとめ

- 番兵（センチネル）のように、データに「ここから先は使えない」印を入れておくと、処理側の分岐が消える。
- 範囲外のビットを 1 にしておけば、反転して探すときに誤って見つけることがない。
- 大きさを 2 のべき乗に限ると、端数の扱いが単純になる。
