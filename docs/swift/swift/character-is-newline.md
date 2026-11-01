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
---
## ひとことで

`Character("\n").isNewline` は true。改行文字かどうかを判定するプロパティです。
「改行」というと `\n`（LF）を思い浮かべますが、Unicode にはほかにも改行を表す文字があります。この実装は、ドキュメントコメントに並んでいる **8 種類** をすべて改行として扱います。しかも Windows の改行 `\r\n`（CR と LF の 2 文字）も、Swift では **1 つの `Character`** として扱われることを前提にしています。

## コード

```swift:line-numbers=71
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

## 前提知識

- **計算プロパティ**: `var isNewline: Bool { ... }` は、保存されている値ではなく、読むたびに計算されるプロパティです。
- **`_firstScalar.value`**: その文字の最初のコードポイントの番号です。
- **`switch` の複数パターン**: `case 0x000A...0x000D:` は範囲、`case 0x0085:` は単独の値にマッチします。Swift の `switch` はすべての場合を網羅する必要があるので、最後に `default:` があります。
- **`/* ... */` コメント**: 行の途中に書けるコメントです。各値が何の文字かを説明しています。
- **書記素クラスタ**: Swift の `Character` は「人が 1 文字と感じる単位」です。`\r\n` はこの単位で 1 文字になります。

## 何をしているか

コメント（この部分）に並んでいる改行を、番号の範囲でまとめて判定します。

- `0x000A`〜`0x000D`（この部分）: LF（`\n`）、垂直タブ、改ページ、CR（`\r`）の 4 つが連続しているので、範囲 1 つでまとめて判定します。
- `0x0085`（この部分）: NEL（次の行）。古いメインフレーム由来の改行です。
- `0x2028`（この部分）: LINE SEPARATOR（行区切り）。
- `0x2029`（この部分）: PARAGRAPH SEPARATOR（段落区切り）。

`"\r\n"` の場合、`_firstScalar` は `\r`（`0x000D`）なので、この部分マッチして true になります。2 文字目の `\n` を見る必要はありません。

## ここがすごい

- **最初のコードポイントだけで判定できる理由**: `"\r\n"` は 1 つの `Character` ですが、中身は 2 つのコードポイントです。改行の文字に結合文字が付くことは Unicode の規則上ほぼないので、最初のコードポイントを見れば十分です。複数のコードポイントを全部調べる必要がなく、速く判定できます。
- **連続した範囲をまとめる**: LF から CR までの 4 つは番号が連続しているので、範囲パターン 1 つで書けます。`switch` の範囲パターンは、コンパイラが「引き算して比較」の 1〜2 命令にしてくれます。
- **JSON や JavaScript との落とし穴**: `U+2028` と `U+2029` は、かつて「JSON では文字列に入れてよいのに、JavaScript の文字列リテラルでは改行扱いでエラーになる」という有名な不一致の原因でした（ECMAScript 2019 で解消）。改行の定義を広く持っておくことは、こうした違いを扱ううえで大切です。
- **ドキュメントがそのまま仕様**: 何を改行とするかがコメントに一覧で書かれ、コードはそれを素直に写しています。仕様とコードが 1 対 1 で対応しているので、確認が簡単です。

## まとめ

- Unicode の改行は `\n` だけでなく、CR、CR-LF、NEL、行区切り、段落区切りなど複数ある。
- Swift では `"\r\n"` が 1 つの `Character` になる。
- 連続した番号の範囲は `switch` の範囲パターンでまとめて判定できる。
