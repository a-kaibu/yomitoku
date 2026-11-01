---
title: "全角の「Ｆ」も 15 と読む、16 進数字の判定"
description: "Character が 16 進数の数字なら、その値（0〜15）を返すプロパティ。半角と全角の 0-9、A-F、a-f を、文字コードの範囲と引き算だけで処理する。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CharacterProperties.swift
lines: [168, 187]
function: "Character.hexDigitValue"
difficulty: 1
tags: [Unicode, 文字列処理, パース, 標準ライブラリ]
format: 2
---
## ひとことで

`Character("a").hexDigitValue` は 10、`Character("7").hexDigitValue` は 7、`Character("g").hexDigitValue` は `nil` です。文字が 16 進数の数字なら、その値を返すプロパティです。半角の英数字だけでなく、全角の「０〜９」「Ａ〜Ｆ」「ａ〜ｆ」も受け付けます。ドキュメントの例では、全角の「Ｆ」から 15 が返ります。

## コード

::: code-group

```swift:line-numbers=168 [日本語訳]
  public var hexDigitValue: Int? {
    guard _isSingleScalar else { return nil }
    let value = _firstScalar.value
    switch value {
      // 数字の 0 から 9
      case 0x0030...0x0039: return Int(value &- 0x0030)
      // 大文字の A から F
      case 0x0041...0x0046: return Int((value &+ 10) &- 0x0041)
      // 小文字の a から f
      case 0x0061...0x0066: return Int((value &+ 10) &- 0x0061)
      // 全角の数字の 0 から 9
      case 0xFF10...0xFF19: return Int(value &- 0xFF10)
      // 全角の大文字の A から F
      case 0xFF21...0xFF26: return Int((value &+ 10) &- 0xFF21)
      // 全角の小文字の a から f
      case 0xFF41...0xFF46: return Int((value &+ 10) &- 0xFF41)

      default: return nil
    }
  }
```

```swift:line-numbers=168 [原文]
  public var hexDigitValue: Int? {
    guard _isSingleScalar else { return nil }
    let value = _firstScalar.value
    switch value {
      // DIGIT ZERO..DIGIT NINE
      case 0x0030...0x0039: return Int(value &- 0x0030)
      // LATIN CAPITAL LETTER A..LATIN CAPITAL LETTER F
      case 0x0041...0x0046: return Int((value &+ 10) &- 0x0041)
      // LATIN SMALL LETTER A..LATIN SMALL LETTER F
      case 0x0061...0x0066: return Int((value &+ 10) &- 0x0061)
      // FULLWIDTH DIGIT ZERO..FULLWIDTH DIGIT NINE
      case 0xFF10...0xFF19: return Int(value &- 0xFF10)
      // FULLWIDTH LATIN CAPITAL LETTER A..FULLWIDTH LATIN CAPITAL LETTER F
      case 0xFF21...0xFF26: return Int((value &+ 10) &- 0xFF21)
      // FULLWIDTH LATIN SMALL LETTER A..FULLWIDTH LATIN SMALL LETTER F
      case 0xFF41...0xFF46: return Int((value &+ 10) &- 0xFF41)

      default: return nil
    }
  }
```

:::

## 前提知識

- **`Character`**: Swift の「1 文字」を表す型です。見た目の 1 文字（書記素クラスタ）なので、複数のコードポイントからなることもあります。たとえば「é」を `e` とアクセント記号で表した場合です。
- **`_isSingleScalar`**: その文字が、コードポイント 1 つだけでできているかどうかを表します。
- **`_firstScalar`**: その文字の最初のコードポイントです。
- **`switch` の範囲パターン**: `case 0x0030...0x0039:` は、値がこの範囲（両端を含む）に入っていれば、その `case` を実行します。
- **文字コードの並び**: Unicode では、「0」から「9」が `0x30` から `0x39`、「A」から「F」が `0x41` から `0x46` と連続して並んでいます。全角も `0xFF10` から同じように連続しています。

## 何をしているか

### 1. 1 つのコードポイントだけを対象にする

「1」に結合文字（たとえば囲み記号）が付いた文字は、16 進数字とはみなしません。`_isSingleScalar` でなければ、`nil` を返します。

```swift:line-numbers=169
    guard _isSingleScalar else { return nil }
    let value = _firstScalar.value
```
### 2. 範囲ごとに値を計算する

範囲ごとに、文字コードの差から値を求めます。「7」（`0x37`）は `0x37 - 0x30 = 7` です。「C」（`0x43`）は、「A」からの距離 2 に 10 を足して 12 になります。全角の「Ｆ」（`0xFF26`）は、`(0xFF26 + 10) - 0xFF21 = 15` です。どの範囲にも当たらなければ、`nil` を返します。

```swift:line-numbers=171
    switch value {
      // 数字の 0 から 9
      case 0x0030...0x0039: return Int(value &- 0x0030)
      // 大文字の A から F
      case 0x0041...0x0046: return Int((value &+ 10) &- 0x0041)
      // 小文字の a から f
      case 0x0061...0x0066: return Int((value &+ 10) &- 0x0061)
      // 全角の数字の 0 から 9
      case 0xFF10...0xFF19: return Int(value &- 0xFF10)
      // 全角の大文字の A から F
      case 0xFF21...0xFF26: return Int((value &+ 10) &- 0xFF21)
      // 全角の小文字の a から f
      case 0xFF41...0xFF46: return Int((value &+ 10) &- 0xFF41)

      default: return nil
```
## ここがすごい

- **全角文字への配慮**: 日本語の入力では、全角の数字や英字が混ざることがよくあります。Unicode には全角形（Fullwidth Forms）として、ASCII と同じ並びの文字が `0xFF01` 以降に用意されています。だから、同じ計算方法がそのまま使え、範囲を 3 つ足すだけで対応できます。
- **1 文字 = 1 コードポイントとは限らない**: Swift の `Character` は見た目の 1 文字なので、中身が複数のコードポイントのこともあります。たとえばキーキャップの「1」は、`1` と異体字セレクタと囲み記号からなります。この判定がないと、それを 1 と読んでしまいます。
- **足してから引く順番**: `(value &+ 10) &- 0x0041` は `value - 0x41 + 10` と同じ値です。途中で負にならない順番に並べ、`&+` と `&-` で検査を省いています。範囲が分かっているので安全です。
- **範囲に名前をつける**: 各 `case` の上に、Unicode の正式な名前（`LATIN CAPITAL LETTER A` など）が書かれています。数値だけでは何の範囲か分からないので、読む人を助けます。

## まとめ

- Unicode では数字や英字が連続して並んでいるので、範囲の始まりを引けば値が求まる。
- 全角の英数字も同じ並びなので、範囲を足すだけで対応できる。
- `Character` は複数のコードポイントからなることがあるので、まず 1 つだけかを確かめる。
