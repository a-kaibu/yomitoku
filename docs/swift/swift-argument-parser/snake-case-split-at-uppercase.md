---
title: "大文字の位置で区切り、スネークケースに変換する"
description: "名前を my_url_property のようなスネークケースへ変えるメソッド。大文字の前で区切りを入れ、URLSession のような頭字語も正しく分ける。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Utilities/StringExtensions.swift
lines: [105, 131]
function: "convertedToSnakeCase(separator:)"
difficulty: 2
tags: [文字列処理, イディオム]
format: 2
---
## ひとことで

`myURLProperty` のような名前を、`my_url_property` のように小文字の単語を `_` でつないだ形へ変換します。大文字が現れた位置で区切りを入れますが、`URL` のように大文字が続く場合は、区切りの位置を次の文字で決めます。

## コード

::: code-group

```swift:line-numbers=105 [日本語訳]
  func convertedToSnakeCase(separator: Character = "_") -> String {
    guard !isEmpty else { return "" }
    var result = ""
    // 大文字が現れたとき、区切りを入れるべきかを表します。
    var separateOnUppercase = true
    for index in indices {
      let nextIndex = self.index(after: index)
      let character = self[index]
      if character.isUppercase {
        if separateOnUppercase && !result.isEmpty {
          // 区切り文字を入れます。
          result += "\(separator)"
        }
        // 次の文字が大文字で、その次が小文字のとき（"URLSession" の "L" のような場合）、単語を区切ります。
        separateOnUppercase =
          nextIndex < endIndex && self[nextIndex].isUppercase
          && self.index(after: nextIndex) < endIndex
          && self[self.index(after: nextIndex)].isLowercase
      } else {
        // 区切り文字が来たら、次の大文字の前で、さらに区切りを入れないようにします。
        separateOnUppercase = character != separator
      }
      // 小文字に直した文字を、結果へ追加します。
      result += character.lowercased()
    }
    return result
  }
```

```swift:line-numbers=105 [原文]
  func convertedToSnakeCase(separator: Character = "_") -> String {
    guard !isEmpty else { return "" }
    var result = ""
    // Whether we should append a separator when we see a uppercase character.
    var separateOnUppercase = true
    for index in indices {
      let nextIndex = self.index(after: index)
      let character = self[index]
      if character.isUppercase {
        if separateOnUppercase && !result.isEmpty {
          // Append the separator.
          result += "\(separator)"
        }
        // If the next character is uppercase and the next-next character is lowercase, like "L" in "URLSession", we should separate words.
        separateOnUppercase =
          nextIndex < endIndex && self[nextIndex].isUppercase
          && self.index(after: nextIndex) < endIndex
          && self[self.index(after: nextIndex)].isLowercase
      } else {
        // If the character is `separator`, we do not want to append another separator when we see the next uppercase character.
        separateOnUppercase = character != separator
      }
      // Append the lowercased character.
      result += character.lowercased()
    }
    return result
  }
```

:::

## 前提知識

- **スネークケース**: 単語を `_` でつなぎ、すべて小文字で書く名前の付け方です。`my_property` のような形です。
- **`isUppercase` と `isLowercase`**: 1 文字が大文字か小文字かを調べるプロパティです。
- **`index(after:)`**: 文字列の中で、次の位置を表す添字を返します。Swift の文字列は添字を直接数字で指定できないので、この形で位置を進めます。

## 何をしているか

### 1. 空の文字列は、そのまま返す

```swift:line-numbers=106
    guard !isEmpty else { return "" }
```
### 2. 1 文字ずつ見ていく

```swift:line-numbers=107
    var result = ""
    // 大文字が現れたとき、区切りを入れるべきかを表します。
    var separateOnUppercase = true
    for index in indices {
      let nextIndex = self.index(after: index)
      let character = self[index]
```
### 3. 大文字なら、区切りを入れるか決める

大文字の前に、まだ何か書かれていれば区切り文字を入れます。

```swift:line-numbers=113
      if character.isUppercase {
        if separateOnUppercase && !result.isEmpty {
          // 区切り文字を入れます。
          result += "\(separator)"
        }
```
### 4. 次の文字を見て、次も区切るかを決める

`myURLProperty` の `L` は、次が `S` で、その次が `e` の小文字です。このとき `L` の前で区切りたいので、次の文字を先に見て判断します。

```swift:line-numbers=118
        // 次の文字が大文字で、その次が小文字のとき（"URLSession" の "L" のような場合）、単語を区切ります。
        separateOnUppercase =
          nextIndex < endIndex && self[nextIndex].isUppercase
          && self.index(after: nextIndex) < endIndex
          && self[self.index(after: nextIndex)].isLowercase
```
### 5. 小文字や区切り文字のときの扱い

区切り文字がすでに書かれていれば、次の大文字の前で二重に区切らないように、フラグを下ろします。

```swift:line-numbers=123
      } else {
        // 区切り文字が来たら、次の大文字の前で、さらに区切りを入れないようにします。
        separateOnUppercase = character != separator
      }
```
### 6. 小文字に直して追加する

どの場合も、文字は小文字に直して結果へ足します。

```swift:line-numbers=127
      // 小文字に直した文字を、結果へ追加します。
      result += character.lowercased()
    }
    return result
```
## ここがすごい

- **頭字語を正しく分ける**: `URLSession` の `L` は、次の文字を見て「単語の始まり」と判断します。1 文字だけを見ると、`URL` が `u_r_l` のように崩れてしまいます。
- **区切り文字の二重挿入を防ぐ**: `_` のあとに大文字が来ても、`__` にはなりません。フラグで、直前が区切り文字かどうかを覚えています。
- **1 回のループで済む**: 正規表現を使わず、文字列を 1 回なめるだけで変換できます。

## まとめ

- 大文字の前で区切りを入れ、全体を小文字にする。
- 大文字が続くときは、次の文字を見て区切りを決める。
- 区切り文字の直後では、二重に区切りを入れない。
