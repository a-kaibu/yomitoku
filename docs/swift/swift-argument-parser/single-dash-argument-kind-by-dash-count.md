---
title: "ハイフンの数で、引数の種類を決める"
description: "swift-argument-parser の parseIndividualArg で、ハイフンの数を数えて、値・短いオプション・長いオプションを振り分ける switch。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Parsing/SplitArguments.swift
lines: [641, 672]
function: "parseIndividualArg(_:at:)"
difficulty: 3
tags: [CLI, パース]
format: 2
---
## ひとことで

コマンドラインの引数は、`value`、`-n`、`--name` のように、先頭のハイフンの数で種類が決まります。この関数は、ハイフンを数えてから、その数に応じて引数を分けます。どれにも当たらない形は、エラーにします。

## コード

::: code-group

```swift:line-numbers=641 [日本語訳]
    switch dashCount {
    case 0:
      return [.value(arg, index: index)]
    case 1:
      // 長いオプションとして解析します。
      let parsed = try ParsedArgument(longArgWithSingleDashRemainder: remainder)

      // 短いオプションを、ここで分けて解析します。
      let parts = parsed.subarguments
      switch parts.count {
      case 0:
        // これは '-name=value' の形の引数です。
        return [.option(parsed, index: index)]
      case 1:
        // これは '-n' の形の、1 文字の短いオプションです。
        // swift-format の指示です。強制アンラップの警告を無視します。
        // parts が空でないと分かっているので、強制アンラップは安全です。
        return [.option(.name(.short(remainder.first!)), index: index)]
      default:
        var result: [SplitArguments.Element] = [.option(parsed, index: index)]
        for (sub, a) in parts {
          var i = index
          i.subIndex = .sub(sub)
          result.append(.option(a, index: i))
        }
        return result
      }
    case 2:
      return [.option(ParsedArgument(arg), index: index)]
    default:
      throw ParserError.invalidOption(arg)
    }
```

```swift:line-numbers=641 [原文]
    switch dashCount {
    case 0:
      return [.value(arg, index: index)]
    case 1:
      // Long option:
      let parsed = try ParsedArgument(longArgWithSingleDashRemainder: remainder)

      // Short options:
      let parts = parsed.subarguments
      switch parts.count {
      case 0:
        // This is a '-name=value' style argument
        return [.option(parsed, index: index)]
      case 1:
        // This is a single short '-n' style argument
        // swift-format-ignore: NeverForceUnwrap
        // this is safe because we know `parts` is non-empty
        return [.option(.name(.short(remainder.first!)), index: index)]
      default:
        var result: [SplitArguments.Element] = [.option(parsed, index: index)]
        for (sub, a) in parts {
          var i = index
          i.subIndex = .sub(sub)
          result.append(.option(a, index: i))
        }
        return result
      }
    case 2:
      return [.option(ParsedArgument(arg), index: index)]
    default:
      throw ParserError.invalidOption(arg)
    }
```

:::

## 前提知識

- **引数の種類**: 値（ただの文字列）、短いオプション（`-v`）、長いオプション（`--verbose`）などがあります。
- **`switch`**: 値の種類ごとに、処理を分けて書く文です。ここでは、ハイフンの数を比べます。
- **`ParsedArgument`**: 解析済みの引数を表す型です。`-name=value` などの形も扱えます。
- **`SplitArguments.Element`**: 引数の要素と、元の位置（`index`）を組にした値です。

## 何をしているか

### 1. ハイフンが 0 個なら、ただの値にする

先頭にハイフンがない引数は、値として扱います。元の位置も一緒に記録します。

```swift:line-numbers=642
    case 0:
      return [.value(arg, index: index)]
```
### 2. ハイフンが 1 個なら、短いオプションか、長いオプションとして読む

1 個のハイフンは、`-n` のような短いオプションか、`-name=value` のような形です。`ParsedArgument` で解析し、中身の数で場合を分けます。

```swift:line-numbers=644
    case 1:
      // 長いオプションとして解析します。
      let parsed = try ParsedArgument(longArgWithSingleDashRemainder: remainder)

      // 短いオプションを、ここで分けて解析します。
      let parts = parsed.subarguments
      switch parts.count {
      case 0:
        // これは '-name=value' の形の引数です。
        return [.option(parsed, index: index)]
      case 1:
        // これは '-n' の形の、1 文字の短いオプションです。
        // swift-format の指示です。強制アンラップの警告を無視します。
        // parts が空でないと分かっているので、強制アンラップは安全です。
        return [.option(.name(.short(remainder.first!)), index: index)]
```
### 3. ハイフンが 2 個なら、長いオプションにする

`--name` の形は、そのまま長いオプションとして扱います。

```swift:line-numbers=668
    case 2:
      return [.option(ParsedArgument(arg), index: index)]
```
### 4. それ以外は、エラーにする

ハイフンが 3 個以上のような形は、対応していないので `invalidOption` のエラーを投げます。

```swift:line-numbers=670
    default:
      throw ParserError.invalidOption(arg)
```
## ここがすごい

- **数で一気に振り分ける**: 文字列を前から読んで判断せず、先頭の記号の数だけで種類を決めます。
- **元の位置を残す**: どの引数が何番目だったかを残すので、後でエラーを正確に表示できます。
- **エラーを型で返す**: `throws(ParserError)` で、失敗の種類を明確に伝えています。

## まとめ

- ハイフンの数で、引数の種類を決める。
- 1 個のハイフンは、短い形と長い形を分けて解析する。
- 当てはまらない形は、エラーとして報告する。
