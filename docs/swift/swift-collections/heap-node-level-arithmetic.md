---
title: "添字だけからレベルを求める、ヒープ位置の算術"
description: "木の添字からその深さ（レベル）を求める関数群。深さは添字 + 1 の最上位ビット位置で決まり、偶数か奇数かだけで最小・最大どちらのレベルかが決まる。"
language: swift
project: "Swift Collections"
repo: https://github.com/apple/swift-collections
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2021 - 2026 Apple Inc. and the Swift project authors"
commit: "f96b909e1a9e469620bc5037c1e24e00153f376f"
file: Sources/HeapModule/_HeapNode.swift
lines: [57, 79]
function: "_HeapNode.level(forOffset:)"
difficulty: 2
tags: [ビット演算, データ構造, アルゴリズム]
format: 2
---
## ひとことで

ヒープは配列で表せるので、配列の添字だけから木の中の位置を計算できます。`_HeapNode` の関数群は、添字からその位置の **深さ（レベル）** を求め、そのレベルが「最小レベル」か「最大レベル」かを判定します。
深さを求めるのに木をたどる必要はありません。添字に 1 を足した数の最上位の 1 ビットの位置が、そのまま深さになります。

## コード

```swift:line-numbers=57
extension _HeapNode {
  @inlinable @inline(__always)
  internal static func level(forOffset offset: Int) -> Int {
    (offset &+ 1)._binaryLogarithm()
  }

  @inlinable @inline(__always)
  internal static func firstNode(onLevel level: Int) -> _HeapNode {
    assert(level >= 0)
    return _HeapNode(offset: (1 &<< level) &- 1, level: level)
  }

  @inlinable @inline(__always)
  internal static func lastNode(onLevel level: Int) -> _HeapNode {
    assert(level >= 0)
    return _HeapNode(offset: (1 &<< (level &+ 1)) &- 2, level: level)
  }

  @inlinable @inline(__always)
  internal static func isMinLevel(_ level: Int) -> Bool {
    level & 0b1 == 0
  }
}
```

## 前提知識

- **添字と木の関係**: 根は添字 0、その子は 1 と 2、その子の子は 3〜6 です。レベル 0 は添字 0、レベル 1 は 1〜2、レベル 2 は 3〜6 のように、1 段ごとに 2 倍ずつ増えます。
- **`_binaryLogarithm()`**: 最上位のビットの位置（0 から数える）を返します。
- **`&+`**: オーバーフローを検査しない足し算です。
- **`1 &<< level`**: 1 を `level` 桁左へずらした値です。

## 何をしているか

### 深さを求める

添字 `offset` に 1 を足して、その最上位の 1 ビットの位置を取ります。

```swift:line-numbers=59
  internal static func level(forOffset offset: Int) -> Int {
    (offset &+ 1)._binaryLogarithm()
```
例えば添字 5 は、`5 + 1 = 6` の最上位の位置が 2 です。実際、添字 5 はレベル 2（3〜6）にあります。

### 最初と最後の添字を求める

レベル `level` の最初の添字は `2^level - 1`、最後の添字は `2^(level+1) - 2` です。上の式で `1 &<< level` を使って計算しています。

```swift:line-numbers=63
  @inlinable @inline(__always)
  internal static func firstNode(onLevel level: Int) -> _HeapNode {
    assert(level >= 0)
    return _HeapNode(offset: (1 &<< level) &- 1, level: level)
  }
```
```swift:line-numbers=69
  @inlinable @inline(__always)
  internal static func lastNode(onLevel level: Int) -> _HeapNode {
    assert(level >= 0)
    return _HeapNode(offset: (1 &<< (level &+ 1)) &- 2, level: level)
```
### 最小レベルか判定する

`level & 1 == 0`、つまり偶数なら最小レベル、奇数なら最大レベルです。最下位ビットを見るだけで判定できます。

```swift:line-numbers=75
  @inlinable @inline(__always)
  internal static func isMinLevel(_ level: Int) -> Bool {
    level & 0b1 == 0
  }
```
## ここがすごい

- **木をたどらずに位置がわかる**: 深さも親子の関係も、添字の算術だけで求まります。ポインタを持つ木と違い、メモリをほとんど使いません。
- **深さの判定がビット 1 つ**: 最小か最大かは、深さの最下位ビットだけで決まります。だから、判定は分岐なしの 1 命令で済みます。
- **`&+` や `&<<` を使う理由**: 添字の範囲は配列の大きさの中に収まるので、オーバーフローの検査は不要です。検査を省いて、速さを優先しています。

## まとめ

- 配列で表した木の添字は、ビット演算で深さに変換できる。
- 最小レベルと最大レベルは、深さの偶奇で判定できる。
- 範囲が保証されている計算では、オーバーフロー検査を省いてよい。
