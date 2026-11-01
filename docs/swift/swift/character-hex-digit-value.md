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
lines: [153, 187]
function: "Character.hexDigitValue"
difficulty: 1
tags: [Unicode, 文字列処理, パース, 標準ライブラリ]
---
## ひとことで

`Character("a").hexDigitValue` は 10、`Character("7").hexDigitValue` は 7、`Character("g").hexDigitValue` は `nil`。文字が 16 進数の数字なら、その値を返すプロパティです。
おもしろいのは、半角の英数字だけでなく **全角の「０〜９」「Ａ〜Ｆ」「ａ〜ｆ」も受け付ける** ことです。ドキュメントコメントの例では、全角の「Ｆ」から 15 が返っています。

## コード

```swift:line-numbers=153
  /// The numeric value this character represents, if it is a hexadecimal digit.
  ///
  /// Hexadecimal digits include 0-9, Latin letters a-f and A-F, and their
  /// fullwidth compatibility forms. If the character does not represent a
  /// hexadecimal digit, the value of this property is `nil`.
  ///
  ///     let chars: [Character] = ["1", "a", "Ｆ", "g"]
  ///     for ch in chars {
  ///         print(ch, "-->", ch.hexDigitValue)
  ///     }
  ///     // Prints:
  ///     // 1 --> Optional(1)
  ///     // a --> Optional(10)
  ///     // Ｆ --> Optional(15)
  ///     // g --> nil
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

## 前提知識

- **`Character`**: Swift の「1 文字」を表す型です。見た目の 1 文字（書記素クラスタ）なので、複数のコードポイントからなることもあります（たとえば「é」を `e` + アクセント記号で表した場合）。
- **`_isSingleScalar`**: その文字が、コードポイント 1 つだけでできているかどうか。
- **`_firstScalar`**: その文字の最初のコードポイントです。
- **`Int?` と `nil`**: 値がないときは `nil` を返します。
- **`switch` の範囲パターン `case 0x0030...0x0039:`**: 値がこの範囲（両端を含む）に入っていれば、その `case` を実行します。
- **文字コードの並び**: Unicode では「0」〜「9」が `0x30`〜`0x39`、「A」〜「F」が `0x41`〜`0x46`、「a」〜「f」が `0x61`〜`0x66` と連続して並んでいます。全角も `0xFF10` から同じように連続しています。

## 何をしているか

### 1. 1 つのコードポイントか（この部分）

「1」に結合文字（たとえば囲み記号）が付いた文字は、16 進数字とはみなしません。`_isSingleScalar` でなければ `nil` を返します。

### 2. 範囲ごとに値を計算（この部分）

- 「7」（`0x37`）: `0x37 - 0x30 = 7`。
- 「C」（`0x43`）: `(0x43 + 10) - 0x41 = 12`。「A」からの距離に 10 を足しています。
- 「Ｆ」（全角、`0xFF26`）: `(0xFF26 + 10) - 0xFF21 = 15`。
- それ以外: `nil`。

## ここがすごい

- **全角文字への配慮**: 日本語などの入力では、全角の数字や英字が混ざることがよくあります。Unicode には「全角形（Fullwidth Forms）」として ASCII と同じ並びの文字が `0xFF01` 以降に用意されているので、同じ計算方法がそのまま使えます。範囲を 3 つ足すだけで、全角入力に対応しています。
- **「1 文字 = 1 コードポイント」とは限らない**: Swift の `Character` は見た目の 1 文字なので、中身が複数のコードポイントのことがあります。たとえば「1️⃣」（キーキャップの 1）は `1` + 異体字セレクタ + 囲み記号です。この部分判定がないと、これを 1 と読んでしまいます。
- **足してから引く順番**: `(value &+ 10) &- 0x0041` は `value - 0x41 + 10` と同じ値ですが、符号なしの計算で途中が負にならない順番になっています。`&+` / `&-` はオーバーフロー検査を省く演算子で、範囲がわかっているので安全です。
- **コメントで範囲の名前を書く**: 各 `case` の上に Unicode の正式な名前（`LATIN CAPITAL LETTER A` など）が書かれています。数値だけでは何の範囲か一目でわからないので、読む人を助けます。

## まとめ

- Unicode では数字や英字が連続して並んでいるので、範囲の始まりを引けば値が求まる。
- 全角の英数字も同じ並びなので、範囲を足すだけで対応できる。
- Swift の `Character` は複数のコードポイントからなることがあるので、1 つだけかを先に確かめる。
