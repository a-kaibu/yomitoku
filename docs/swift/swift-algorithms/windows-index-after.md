---
title: "1 つ先のウィンドウを、両端を 1 つずつずらして作る"
description: "重なりのあるスライスを順に返す windows(ofCount:) の進め方。ウィンドウの左端と右端を同時に 1 つずつ進め、窓の幅が 1 のときだけ特別扱いにする。"
language: swift
project: "Swift Algorithms"
repo: https://github.com/apple/swift-algorithms
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "5b7143f8e291dee0e14c118fd0212487f0b37af5"
file: Sources/Algorithms/Windows.swift
lines: [117, 128]
function: "WindowsOfCountCollection.index(after:)"
difficulty: 2
tags: [イテレータ, アルゴリズム, 標準ライブラリ]
format: 2
---
## ひとことで

`windows(ofCount:)` は、コレクションの中の「重なりのある連続した部分」を順に返します。たとえば `"Hello"` を幅 3 で区切ると、`"Hel"`、`"ell"`、`"llo"` と続きます。
`index(after:)` は、現在のウィンドウの次のウィンドウを指す添字を作ります。ウィンドウは「左端」と「右端」の 2 つの添字で表されていて、この関数はその 2 つを同時に 1 つずつ進めます。

## コード

```swift:line-numbers=117
  @inlinable
  public func index(after index: Index) -> Index {
    precondition(index != endIndex, "Advancing past end index")
    guard index.upperBound < base.endIndex else { return endIndex }

    let lowerBound =
      windowSize == 1
      ? index.upperBound
      : base.index(after: index.lowerBound)
    let upperBound = base.index(after: index.upperBound)
    return Index(lowerBound: lowerBound, upperBound: upperBound)
  }
```

## 前提知識

- **`Index`**: 現在のウィンドウを表す型です。`lowerBound`（左端）と `upperBound`（右端の次）を持ちます。
- **`Base.Index`**: 元のコレクションの添字です。
- **`index(after:)`**: 元のコレクションで、添字を 1 つ進めるメソッドです。
- **三項演算子 `条件 ? A : B`**: 条件に応じて A か B を値として返します。

## 何をしているか

### 1. 最後のウィンドウの次なら、終わり

`index.upperBound` がコレクションの終わりに届いていたら、これ以上ウィンドウはないので `endIndex` を返します。

```swift:line-numbers=120
    guard index.upperBound < base.endIndex else { return endIndex }
```
### 2. 左端を進める

左端は、窓の幅が 1 のときだけ特別扱いです。幅 1 のときは、右端がそのまま次の左端になります。幅が 2 以上なら、元のコレクションで左端を 1 つ進めます。

```swift:line-numbers=122
    let lowerBound =
      windowSize == 1
      ? index.upperBound
      : base.index(after: index.lowerBound)
```
### 3. 右端を進める

右端は、いつも元のコレクションで 1 つ進めます。

```swift:line-numbers=126
    let upperBound = base.index(after: index.upperBound)
    return Index(lowerBound: lowerBound, upperBound: upperBound)
```
## ここがすごい

- **2 つの添字の差が幅のまま保たれる**: 左端と右端が同じ量だけ進むので、ウィンドウの幅は変わりません。幅を覚えておかなくても、ずっと同じ大きさの窓になります。
- **幅 1 の特別扱いは速さのため**: 幅 1 のときは、左端の次は右端と同じ位置になります。`index(after:)` を余計に呼ばずに済むので、この 1 行で無駄を省いています。
- **終わりの判定が 1 か所**: 次が存在しないことは、右端が終わりに届いたかどうかだけで決まります。境界の判定が単純なので、間違えにくくなっています。

## まとめ

- 重なりのある窓は、左端と右端を同じ量だけ進めると表せる。
- 特殊な幅（1）の場合は、無駄な計算を省ける近道を用意する。
- 終わりの判定は、添字が元のコレクションの終わりに届いたかで決める。
