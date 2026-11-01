---
title: "-Ddebug の D の後ろを、値として取り出す"
description: "-Ddebug のように、短いオプション名に値が続く形を解析する Argument Parser の extractJoinedElement(at:)。先頭の要素だけを対象にする。"
language: swift
project: "Swift Argument Parser"
repo: https://github.com/apple/swift-argument-parser
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2020 Apple Inc. and the Swift project authors"
commit: "38ca4eceb349155836701b88da3e0986eb9d1e1c"
file: Sources/ArgumentParser/Parsing/SplitArguments.swift
lines: [315, 336]
function: "extractJoinedElement(at:)"
difficulty: 2
tags: [CLI, パース]
format: 2
---
## ひとことで

`-Ddebug` のように、1 文字の短いオプション名（`-D`）の直後に値が続く書き方を扱います。`-D` の部分を取り除いた `debug` を、そのオプションの値として取り出します。

## コード

::: code-group

```swift:line-numbers=315 [日本語訳]
  func extractJoinedElement(
    at origin: InputOrigin.Element
  ) -> (InputOrigin.Element, String)? {
    guard case .argumentIndex(let index) = origin else { return nil }

    // 結合された引数は、引数の先頭の部分を解析するときだけ適用されます。
    // 途中の部分には適用されません。
    guard index.subIndex == .sub(0) else { return nil }

    // 入力全体（例: -Ddebug）の位置を作り直します。
    // -D だけの部分の位置ではありません。
    let completeOrigin = InputOrigin.Element.argumentIndex(index.completeIndex)

    // 元の文字列から、ハイフンと短い名前の後ろの値を取り出します。
    // 例えば `-Ddebug` なら、`-D` を取り除いて `debug` を残します。
    // それが値になります。
    // swift-format の NeverForceUnwrap の検査を無視する指示です。
    // なぜ安全なのか、コメントの作者もはっきりとは分かっていません。
    let value = String(originalInput(at: completeOrigin)!.dropFirst(2))

    return (completeOrigin, value)
  }
```

```swift:line-numbers=315 [原文]
  func extractJoinedElement(
    at origin: InputOrigin.Element
  ) -> (InputOrigin.Element, String)? {
    guard case .argumentIndex(let index) = origin else { return nil }

    // Joined arguments only apply when parsing the first sub-element of a
    // larger input argument.
    guard index.subIndex == .sub(0) else { return nil }

    // Rebuild the origin position for the full argument string, e.g. `-Ddebug`
    // instead of just the `-D` portion.
    let completeOrigin = InputOrigin.Element.argumentIndex(index.completeIndex)

    // Get the value from the original string, following the dash and short
    // option name. For example, for `-Ddebug`, drop the `-D`, leaving `debug`
    // as the value.
    // swift-format-ignore: NeverForceUnwrap
    // I don't know why this is safe
    let value = String(originalInput(at: completeOrigin)!.dropFirst(2))

    return (completeOrigin, value)
  }
```

:::

## 前提知識

- **短いオプションと値の結合**: `-Ddebug` は、`-D` と値 `debug` が 1 つの引数にくっついた形です。`-D debug` と 2 つに分けて書くこともできます。
- **`InputOrigin`**: 値が、コマンドラインのどの位置（引数の番号と、その中の部分）から来たかを表す情報です。
- **`originalInput(at:)`**: 位置の情報から、元の引数の文字列を取り出すメソッドです。ここでは別の場所で定義されています。
- **`!`（強制アンラップ）**: オプショナルの値を、必ず値があるとみなして取り出します。

## 何をしているか

### 1. 最初の部分だけを対象にする

結合された値は、1 つの引数の先頭の部分（`sub(0)`）に対してだけ使います。それ以外の位置では、`nil` を返して何もしません。

```swift:line-numbers=318
    guard case .argumentIndex(let index) = origin else { return nil }

    // 結合された引数は、引数の先頭の部分を解析するときだけ適用されます。
    // 途中の部分には適用されません。
    guard index.subIndex == .sub(0) else { return nil }
```
### 2. 入力全体の位置を作り直す

`index.completeIndex` で、部分ではなく引数全体（`-Ddebug`）の位置を作ります。

```swift:line-numbers=324
    // 入力全体（例: -Ddebug）の位置を作り直します。
    // -D だけの部分の位置ではありません。
    let completeOrigin = InputOrigin.Element.argumentIndex(index.completeIndex)
```
### 3. ハイフンと短い名前を取り除き、残りを値にする

元の引数の文字列から、先頭の 2 文字（`-D`）を取り除きます。残りの `debug` が値です。

```swift:line-numbers=328
    // 元の文字列から、ハイフンと短い名前の後ろの値を取り出します。
    // 例えば `-Ddebug` なら、`-D` を取り除いて `debug` を残します。
    // それが値になります。
    // swift-format の NeverForceUnwrap の検査を無視する指示です。
    // なぜ安全なのか、コメントの作者もはっきりとは分かっていません。
    let value = String(originalInput(at: completeOrigin)!.dropFirst(2))

    return (completeOrigin, value)
```
## ここがすごい

- **位置の扱いを分けている**: 引数全体の位置と、部分の位置を区別しています。エラーの表示で、ユーザーが書いた引数を正しく指せます。
- **先頭だけに限る**: `-Dfoo` の `f` のような途中の文字は、値として扱いません。`sub(0)` の条件で、誤った取り出しを防いでいます。
- **元の文字列から切り出す**: 解析した結果から組み立て直さず、元の入力の文字列をそのまま使います。

## まとめ

- 結合された値は、引数の先頭の部分だけで扱う。
- 引数全体の位置を作り直し、元の文字列の先頭 2 文字を取り除く。
- 残った部分が、そのオプションの値になる。
