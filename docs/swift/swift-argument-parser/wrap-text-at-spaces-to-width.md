---
title: "指定した桁数で、空白を選んで文字列を折り返す"
description: "ヘルプ文を指定した幅で折り返す Argument Parser の関数。改行と空白を優先して区切り、2 行目以降にインデントを付ける。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Utilities/StringExtensions.swift
lines: [13, 55]
function: "wrapped(to:wrappingIndent:)"
difficulty: 2
tags: [文字列処理, CLI]
format: 2
---
## ひとことで

長い説明文を、指定した桁数の幅に収まるように改行します。途中で単語が切れないよう、空白のある位置で区切ります。2 行目以降は、指定した数だけ字下げをします。ヘルプ画面の文章を整えるために使われます。

## コード

::: code-group

```swift:line-numbers=13 [日本語訳]
  func wrapped(to columns: Int, wrappingIndent: Int = 0) -> String {
    let columns = columns - wrappingIndent
    guard columns > 0 else {
      // 列数が 1 より少ないとき、リリースビルドでは折り返しを行いません。
      // デバッグビルドでは、assertionFailure で知らせます。
      assertionFailure(
        "`columns - wrappingIndent` should be always be greater than 0.")
      return ""
    }

    var result: [Substring] = []

    var currentIndex = startIndex

    while true {
      let nextChunk = self[currentIndex...].prefix(columns)
      if let lastLineBreak = nextChunk.lastIndex(of: "\n") {
        result.append(
          contentsOf: self[currentIndex..<lastLineBreak].split(
            separator: "\n", omittingEmptySubsequences: false))
        currentIndex = index(after: lastLineBreak)
      } else if nextChunk.endIndex == self.endIndex {
        result.append(self[currentIndex...])
        break
      } else if let lastSpace = nextChunk.lastIndex(of: " ") {
        result.append(self[currentIndex..<lastSpace])
        currentIndex = index(after: lastSpace)
      } else if let nextSpace = self[currentIndex...].firstIndex(of: " ") {
        result.append(self[currentIndex..<nextSpace])
        currentIndex = index(after: nextSpace)
      } else {
        result.append(self[currentIndex...])
        break
      }
    }

    return
      result
      .map {
        $0.isEmpty ? $0 : String(repeating: " ", count: wrappingIndent) + $0
      }
      .joined(separator: "\n")
  }
```

```swift:line-numbers=13 [原文]
  func wrapped(to columns: Int, wrappingIndent: Int = 0) -> String {
    let columns = columns - wrappingIndent
    guard columns > 0 else {
      // Skip wrapping logic if the number of columns is less than 1 in release
      // builds and assert in debug builds.
      assertionFailure(
        "`columns - wrappingIndent` should be always be greater than 0.")
      return ""
    }

    var result: [Substring] = []

    var currentIndex = startIndex

    while true {
      let nextChunk = self[currentIndex...].prefix(columns)
      if let lastLineBreak = nextChunk.lastIndex(of: "\n") {
        result.append(
          contentsOf: self[currentIndex..<lastLineBreak].split(
            separator: "\n", omittingEmptySubsequences: false))
        currentIndex = index(after: lastLineBreak)
      } else if nextChunk.endIndex == self.endIndex {
        result.append(self[currentIndex...])
        break
      } else if let lastSpace = nextChunk.lastIndex(of: " ") {
        result.append(self[currentIndex..<lastSpace])
        currentIndex = index(after: lastSpace)
      } else if let nextSpace = self[currentIndex...].firstIndex(of: " ") {
        result.append(self[currentIndex..<nextSpace])
        currentIndex = index(after: nextSpace)
      } else {
        result.append(self[currentIndex...])
        break
      }
    }

    return
      result
      .map {
        $0.isEmpty ? $0 : String(repeating: " ", count: wrappingIndent) + $0
      }
      .joined(separator: "\n")
  }
```

:::

## 前提知識

- **`Substring`**: 文字列の一部を、元の文字列を共有して指す型です。コピーを作らずに、部分を切り出せます。
- **添字（index）**: 文字列の位置を表す値です。Swift の文字列は、数字で直接位置を指定できないので、`index(after:)` などで位置を進めます。
- **`prefix(_:)`**: 先頭から指定した数の要素を取り出すメソッドです。
- **`assertionFailure`**: デバッグビルドでは実行を止め、リリースビルドでは何もしないで進む検査です。

## 何をしているか

### 1. 幅を調べて、ふさわしくなければ止める

字下げの分を幅から引き、幅が 1 より小さい場合は空文字列を返します。

```swift:line-numbers=14
    let columns = columns - wrappingIndent
    guard columns > 0 else {
      // 列数が 1 より少ないとき、リリースビルドでは折り返しを行いません。
      // デバッグビルドでは、assertionFailure で知らせます。
      assertionFailure(
        "`columns - wrappingIndent` should be always be greater than 0.")
      return ""
    }
```
### 2. 改行があれば、そこで区切る

幅の中に改行があれば、その改行までを 1 行として取り出します。改行の後ろから、次の行を続けます。

```swift:line-numbers=28
      let nextChunk = self[currentIndex...].prefix(columns)
      if let lastLineBreak = nextChunk.lastIndex(of: "\n") {
        result.append(
          contentsOf: self[currentIndex..<lastLineBreak].split(
            separator: "\n", omittingEmptySubsequences: false))
        currentIndex = index(after: lastLineBreak)
```
### 3. 空白があれば、幅の中で最後の空白で区切る

幅に収まる範囲で、いちばん後ろの空白を探して区切ります。単語の途中で切れないようにするための処理です。

```swift:line-numbers=37
      } else if let lastSpace = nextChunk.lastIndex(of: " ") {
        result.append(self[currentIndex..<lastSpace])
        currentIndex = index(after: lastSpace)
```
### 4. 幅の中に空白がなければ、次の空白まで進める

単語が幅より長いときは、次の空白までを 1 行にします。

```swift:line-numbers=40
      } else if let nextSpace = self[currentIndex...].firstIndex(of: " ") {
        result.append(self[currentIndex..<nextSpace])
        currentIndex = index(after: nextSpace)
```
### 5. 行ごとに字下げして、改行でつなぐ

空行には字下げを付けず、そのほかの行には指定した数の空白を付けます。最後に、改行でつないで 1 つの文字列にします。

```swift:line-numbers=49
    return
      result
      .map {
        $0.isEmpty ? $0 : String(repeating: " ", count: wrappingIndent) + $0
      }
      .joined(separator: "\n")
```
例として、`one two three` を幅 8 で折り返すと、`one two` と `three` の 2 行になります。

## ここがすごい

- **単語を切らない**: 幅を超える位置で、必ず空白を探します。そのため、単語の途中で改行されることを防げます。
- **改行を尊重する**: 文章の中の改行は、そのまま行の区切りとして使います。段落の構成を壊しません。
- **字下げを後から付ける**: 区切りを決めてから、まとめて字下げを付けます。字下げの幅を考えずに、折り返しの処理に集中できます。

## まとめ

- 幅の中で、改行、次に空白を探して区切る。
- 単語が長すぎる場合は、次の空白まで進める。
- 最後に、空でない行へ字下げを付けて改行で結ぶ。
