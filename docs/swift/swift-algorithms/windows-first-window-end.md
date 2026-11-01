---
title: "最初のウィンドウの終わりを 1 回だけ計算しておく"
description: "windows(ofCount:) の初期化で、最初のウィンドウの右端を求めて保存する処理。元の長さが窓の幅に足りないときは nil を入れて、空のコレクションとして扱う。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Windows.swift
lines: [59, 67]
function: "WindowsOfCountCollection.init(base:windowSize:)"
difficulty: 2
tags: [データ構造, 防御的プログラミング, 標準ライブラリ]
format: 2
---
## ひとことで

`windows(ofCount:)` で作られる `WindowsOfCountCollection` は、最初のウィンドウの右端を、作った時点で 1 回だけ計算して保存しています。`init(base:windowSize:)` はその準備をする関数です。
この右端が見つからなかったら、ウィンドウは 1 つもないことを意味します。

## コード

```swift:line-numbers=59
  @inlinable
  internal init(base: Base, windowSize: Int) {
    precondition(windowSize > 0, "Windows size must be greater than zero")
    self.base = base
    self.windowSize = windowSize
    self.endOfFirstWindow =
      base
      .index(base.startIndex, offsetBy: windowSize, limitedBy: base.endIndex)
  }
```

## 前提知識

- **`precondition`**: 条件が偽のとき、メッセージを出してプログラムを止めます。Release ビルドでも検査されます。
- **`index(_:offsetBy:limitedBy:)`**: 添字を指定した数だけ進めます。ただし、`limit` を超えそうなら `nil` を返します。
- **`Base.Index?`**: オプショナルの添字です。`nil` は「届かなかった」を表します。

## 何をしているか

### 1. 幅が正かを確かめる

`windowSize` が 0 以下なら、ウィンドウの意味がないので、すぐに止めます。

```swift:line-numbers=61
    precondition(windowSize > 0, "Windows size must be greater than zero")
```
### 2. 元の値を保存する

`base` と `windowSize` を、そのまま保存します。

```swift:line-numbers=62
    self.base = base
    self.windowSize = windowSize
```
### 3. 最初のウィンドウの右端を求める

`base.startIndex` から `windowSize` 個進んだ位置を求めます。コレクションがそれより短ければ、`limitedBy` の終わりで止まるので `nil` になります。その `nil` を `endOfFirstWindow` に保存します。

```swift:line-numbers=64
    self.endOfFirstWindow =
      base
      .index(base.startIndex, offsetBy: windowSize, limitedBy: base.endIndex)
```
## ここがすごい

- **右端を最初に 1 回だけ求める**: 後の `startIndex` や `index(after:)` は、この保存した値をもとに計算するだけです。毎回の計算が軽くなります。
- **短すぎる場合を `nil` で表す**: 最初のウィンドウが作れないときは、別のフラグを使わず、`nil` だけで「空」を表します。`startIndex` が `endIndex` を返す判断も、この `nil` で行えます。
- **`limitedBy` で範囲外を防ぐ**: 進めすぎると範囲外の添字になりますが、`limitedBy` を渡すと、範囲を超えた時点で `nil` が返ります。範囲外の添字を作らずに済みます。

## まとめ

- 初期化の時点で、よく使う位置を 1 回だけ計算して保存しておくと、後の処理が軽くなる。
- 作れないことは、オプショナルの `nil` で表すと分かりやすい。
- 範囲を超えないように進めるには、上限付きの添字計算を使う。
