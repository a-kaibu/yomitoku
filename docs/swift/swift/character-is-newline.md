---
title: "改行は \\n だけじゃない：Unicode の 8 種類の改行"
description: "Character が改行かどうかを判定するプロパティ。LF や CR だけでなく、CR-LF の組、NEL、行区切り・段落区切りまで、Unicode が定める改行をすべて扱う。"
language: swift
project: "Swift"
repo: https://github.com/swiftlang/swift
license: Apache-2.0 WITH Swift-exception
copyright: "Copyright (c) 2014 - 2018 Apple Inc. and the Swift project authors"
commit: "2b0c27dbdd76ed8b7b5b82bc52980f13bcb8a85d"
file: stdlib/public/core/CharacterProperties.swift
lines: [71, 92]
function: "Character.isNewline"
difficulty: 1
tags: [Unicode, 文字列処理, 標準ライブラリ]
format: 2
---
## ひとことで

`Character("\n").isNewline` は true になります。これは、文字が改行かどうかを判定するプロパティです。改行というと `\n`（LF）を思い浮かべますが、Unicode にはほかにも改行を表す文字があります。この実装は、ドキュメントコメントに並んでいる 8 種類をすべて改行として扱います。さらに、Windows の改行 `\r\n`（CR と LF の 2 文字）も、Swift では 1 つの `Character` として扱われることを前提にしています。

## コード

::: code-group

```swift:line-numbers=71 [日本語訳]
  /// Character が改行を表すかどうかを示す Bool 値です。
  ///
  /// たとえば、次の文字はどれも改行を表します。
  ///
  /// - "\n"（U+000A）: LINE FEED（LF）
  /// - U+000B: LINE TABULATION（VT）
  /// - U+000C: FORM FEED（FF）
  /// - "\r"（U+000D）: CARRIAGE RETURN（CR）
  /// - "\r\n"（U+000D U+000A）: CR-LF
  /// - U+0085: NEXT LINE（NEL）
  /// - U+2028: LINE SEPARATOR（行区切り）
  /// - U+2029: PARAGRAPH SEPARATOR（段落区切り）
  @inlinable
  public var isNewline: Bool {
    switch _firstScalar.value {
      case 0x000A...0x000D /* LF から CR まで */: return true
      case 0x0085 /* 次の行（NEL） */: return true
      case 0x2028 /* 行区切り */: return true
      case 0x2029 /* 段落区切り */: return true
      default: return false
    }
  }
```

```swift:line-numbers=71 [原文]
  /// A Boolean value indicating whether this character represents a newline.
  ///
  /// For example, the following characters all represent newlines:
  ///
  /// - "\n" (U+000A): LINE FEED (LF)
  /// - U+000B: LINE TABULATION (VT)
  /// - U+000C: FORM FEED (FF)
  /// - "\r" (U+000D): CARRIAGE RETURN (CR)
  /// - "\r\n" (U+000D U+000A): CR-LF
  /// - U+0085: NEXT LINE (NEL)
  /// - U+2028: LINE SEPARATOR
  /// - U+2029: PARAGRAPH SEPARATOR
  @inlinable
  public var isNewline: Bool {
    switch _firstScalar.value {
      case 0x000A...0x000D /* LF ... CR */: return true
      case 0x0085 /* NEXT LINE (NEL) */: return true
      case 0x2028 /* LINE SEPARATOR */: return true
      case 0x2029 /* PARAGRAPH SEPARATOR */: return true
      default: return false
    }
  }
```

:::

## 前提知識

- **計算プロパティ**: `var isNewline: Bool { ... }` は、保存されている値ではなく、読むたびに計算されるプロパティです。
- **`_firstScalar.value`**: その文字の最初のコードポイントの番号です。
- **`switch` の範囲パターン**: `case 0x000A...0x000D:` は範囲に、`case 0x0085:` は 1 つの値に一致します。`switch` はすべての場合を扱う必要があるので、最後に `default:` を置きます。
- **書記素クラスタ**: Swift の `Character` は、人が 1 文字と感じる単位です。`\r\n` はこの単位で 1 文字になります。

## 何をしているか

### 1. 範囲でまとめて判定する

LF から CR までの 4 つは、番号が連続しているので、範囲パターン 1 つで判定します。`switch` の最初の行と、この範囲の行です。

```swift:line-numbers=85
    switch _firstScalar.value {
      case 0x000A...0x000D /* LF ... CR */: return true
```

### 2. 残りの 3 つを、1 つずつ判定する

残りの 3 つは、それぞれ 1 つの値として判定します。NEL、行区切り、段落区切りです。

```swift:line-numbers=87
      case 0x0085 /* NEXT LINE (NEL) */: return true
      case 0x2028 /* LINE SEPARATOR */: return true
      case 0x2029 /* PARAGRAPH SEPARATOR */: return true
```

### 3. どれにも当たらなければ false を返す

どの範囲にも当たらない文字は、改行ではありません。`default` で `false` を返します。

```swift:line-numbers=90
      default: return false
    }
  }
```

## ここがすごい

- **最初のコードポイントだけで判定できる理由**: `"\r\n"` は 1 つの `Character` ですが、中身は 2 つのコードポイントです。改行の文字に結合文字が付くことは Unicode の規則上ほとんどないので、最初のコードポイントを見れば十分です。複数のコードポイントを全部調べる必要がないので、速く判定できます。
- **連続した範囲をまとめる**: 番号が連続しているものは、範囲パターンで 1 行にまとめられます。コンパイラが、比較の命令を少なく生成してくれます。
- **JSON や JavaScript との落とし穴**: U+2028 と U+2029 は、かつて「JSON では文字列に入れてよいのに、JavaScript の文字列リテラルでは改行扱いでエラーになる」という有名な不一致の原因でした。ECMAScript 2019 で解消されています。改行の定義を広く持っておくことは、こうした違いを扱ううえで大切です。
- **ドキュメントがそのまま仕様**: 何を改行とするかがコメントに一覧で書かれ、コードはそれを素直に写しています。仕様とコードが 1 対 1 で対応しているので、確認が簡単です。

## まとめ

- Unicode の改行は、`\n` だけでなく、CR、CR-LF、NEL、行区切り、段落区切りなど複数ある。
- Swift では `"\r\n"` が 1 つの `Character` になり、最初のコードポイントで判定できる。
- 連続した番号は範囲パターンでまとめ、残りは 1 つずつ判定する。
