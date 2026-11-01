---
title: "2 つの範囲が重なるかを、重なった長さで判定する"
description: "Foundation の NSRange どうしが重なるかを、NSIntersectionRange で重なりの長さを求めて調べる SwiftLint の intersects。複数の範囲との判定も含む。"
language: swift
project: "SwiftLint"
repo: https://github.com/realm/SwiftLint
license: MIT
copyright: "Copyright (c) 2025 The SwiftLint Contributors."
commit: "ec4691d9e813a1d3358e82917326b56b0a71d3c9"
file: Source/SwiftLintCore/Extensions/NSRange+SwiftLint.swift
lines: [4, 13]
function: "intersects(_:) と intersects(_:)（配列版）"
difficulty: 1
tags: [文字列処理, アルゴリズム]
format: 2
---
## ひとことで

コードの文字列の中で、違反が見つかった位置（`NSRange`）と、無視すべき位置が重なるかを調べる必要があります。この拡張は、重なった部分の長さが 0 より大きいかで、重なりを判定します。

## コード

```swift:line-numbers=4
    func intersects(_ range: NSRange) -> Bool {
        NSIntersectionRange(self, range).length > 0
    }

    func intersects(_ ranges: [NSRange]) -> Bool {
        for range in ranges where intersects(range) {
            return true
        }
        return false
    }
```

## 前提知識

- **`NSRange`**: 文字列の中の位置と長さを表す Foundation の型です。`location` が先頭の位置、`length` が長さです。
- **`NSIntersectionRange(_:_:)`**: 2 つの `NSRange` が重なる部分を返す関数です。重ならなければ、長さが 0 の範囲を返します。
- **半開区間**: `[location, location + length)` の範囲です。終わりの位置は、範囲に含まれません。
- **`where` 句**: `for ... where 条件` で、条件に合う要素だけを対象にする書き方です。

## 何をしているか

### 1. 重なった部分の長さで判定する

2 つの範囲の共通部分を求め、その長さが 0 より大きければ重なっています。長さが 0 なら、接しているだけか、離れているので重なっていません。

```swift:line-numbers=5
        NSIntersectionRange(self, range).length > 0
```
### 2. 複数の範囲のどれかと重なるか

配列の中の範囲を 1 つずつ調べ、1 つでも重なれば `true` を返します。すべて重ならなければ `false` です。

```swift:line-numbers=8
    func intersects(_ ranges: [NSRange]) -> Bool {
        for range in ranges where intersects(range) {
            return true
        }
        return false
    }
```
## ここがすごい

- **重なりを長さで決める**: 位置の大小を比べる式を書くより、共通部分の長さが 0 より大きいかだけで判定できます。端の扱いの間違いが起きにくくなります。
- **早く抜ける**: 配列の中で 1 つ重なった時点で `return true` します。残りの範囲は調べません。
- **元の範囲を変えない**: `NSRange` は値型なので、判定をしても、もとの範囲は変わりません。

## まとめ

- 2 つの範囲の共通部分の長さが 0 より大きければ、重なっている。
- 複数の範囲は、1 つでも重なれば `true` になる。
- 重なりの判定は、長さだけで書ける。
