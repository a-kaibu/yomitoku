---
title: "行と列の位置を、ファイル先頭からのバイト位置に変える"
description: "コードの行番号と、行の中の位置（どちらも 1 から数える）を、ファイル先頭からのバイト位置に変換する関数。範囲の外の値は nil を返す。SwiftLint が違反の位置を扱うときに使う。"
language: swift
project: "SwiftLint"
repo: https://github.com/realm/SwiftLint
license: MIT
copyright: "Copyright (c) 2025 The SwiftLint Contributors."
commit: "ec4691d9e813a1d3358e82917326b56b0a71d3c9"
file: Source/SwiftLintCore/Extensions/StringView+SwiftLint.swift
lines: [9, 14]
function: "StringView.byteOffset(forLine:bytePosition:)"
difficulty: 1
tags: [文字列処理, パース, 防御的プログラミング]
format: 2
---
## ひとことで

エディタやコンパイラは、エラーの位置を「行と、その行の中の位置」で伝えます。一方、解析の多くは、ファイルの先頭からの **バイト位置** で作業します。
この関数は、行と位置（どちらも 1 から数えます）を、バイト位置へ変換します。範囲の外の値が来たら、変換せずに `nil` を返します。

## コード

```swift:line-numbers=9
    func byteOffset(forLine line: Int64, bytePosition: Int64) -> ByteCount? {
        guard line > 0, line <= lines.count, bytePosition > 0 else {
            return nil
        }
        return lines[Int(line) - 1].byteRange.location + ByteCount(bytePosition - 1)
    }
```

## 前提知識

- **バイト位置（バイトオフセット）**: ファイルの先頭から、何バイト目かを表す数です。日本語の文字は、1 文字が 3 バイトになることがあるので、文字数とは違います。
- **`StringView`**: ソースコードの文字列を、行ごとに扱えるようにした型です。SourceKitten が提供します。
- **`lines`**: 行の一覧で、各行は先頭のバイト位置（`byteRange.location`）を持ちます。
- **`ByteCount`**: バイト数を表す型です。整数と足し算ができます。

## 何をしているか

### 1. 行と位置が、範囲の中にあるかを確かめる

行は 1 以上で、全行数以下でなければなりません。位置は 1 以上である必要があります。どれかに当てはまらなければ、`nil` を返します。

```swift:line-numbers=10
        guard line > 0, line <= lines.count, bytePosition > 0 else {
            return nil
        }
```
### 2. 行の先頭のバイト位置に、列の分を足す

行の一覧は 0 から並んでいるので、行番号から 1 を引いて添字にします。その行の先頭のバイト位置に、位置の値から 1 を引いた分を足します。

```swift:line-numbers=13
        return lines[Int(line) - 1].byteRange.location + ByteCount(bytePosition - 1)
```
例として、ある行の 3 文字目を変換します。その行の先頭が 10 バイト目なら、`10 + (3 - 1) = 12` になります。

## ここがすごい

- **1 から始まる値を、0 から始まる添字に変える**: 人が読む位置は 1 から数え、配列の添字は 0 から数えます。変換の 1 を引く処理が、ここで 1 か所にまとめられています。
- **不正な入力を nil で断る**: 行や位置が範囲外なら、添字の計算をせずに `nil` を返します。範囲外のアクセスで止まることがありません。
- **行の先頭を覚えておけば、計算は 1 回の足し算**: 行ごとの先頭位置を持っているので、ファイル全体を先頭から数え直さずに済みます。

## まとめ

- 行と位置を、バイト位置へ変えるには、行の先頭位置に位置の分を足す。
- 人が読む番号（1 始まり）と、配列の添字（0 始まり）の違いを、1 か所で吸収する。
- 範囲の外の値は `nil` で断り、安全に失敗させる。
