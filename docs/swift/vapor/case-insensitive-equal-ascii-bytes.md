---
title: "英字だけを、大文字と小文字を無視して比べる"
description: "ASCII の英字 A〜Z だけを、大文字と小文字を区別せずに比べる文字列の比較。UTF-8 のバイトを 1 つずつ見て、英字だけを小文字に直す。HTTP のヘッダー名のように、ASCII で決まる値の比較に使う。"
language: swift
project: "Vapor"
repo: https://github.com/vapor/vapor
license: MIT
copyright: "Copyright (c) 2020 Qutheory, LLC"
commit: "0f2a8ee9f38b2589c066b604de3e3168ed54c82d"
file: Sources/Vapor/Utilities/StringProtocol+isCaseInsensitiveEqualASCII.swift
lines: [1, 13]
function: "StringProtocol.isCaseInsensitiveEqualASCII(to:)"
difficulty: 1
tags: [文字列処理, ネットワーク, 防御的プログラミング]
format: 2
---
## ひとことで

HTTP のヘッダー名（`Content-Type` など）は、大文字と小文字を区別しないと決まっています。`content-type` も `Content-Type` も同じです。
この関数は、2 つの文字列を、**ASCII の英字だけ** について大文字と小文字を無視して比べます。日本語などの文字は、そのまま比べます。

## コード

::: code-group

```swift:line-numbers=1 [日本語訳]
extension StringProtocol {
    func isCaseInsensitiveEqualASCII(to other: some StringProtocol) -> Bool {
        let a = self.utf8
        let b = other.utf8
        guard a.count == b.count else { return false }
        for (x, y) in zip(a, b) {
            let fx = (0x41...0x5A).contains(x) ? x &+ 0x20 : x  // A〜Z だけを小文字にします（ASCII の英字のみ）。
            let fy = (0x41...0x5A).contains(y) ? y &+ 0x20 : y
            if fx != fy { return false }
        }
        return true
    }
}
```

```swift:line-numbers=1 [原文]
extension StringProtocol {
    func isCaseInsensitiveEqualASCII(to other: some StringProtocol) -> Bool {
        let a = self.utf8
        let b = other.utf8
        guard a.count == b.count else { return false }
        for (x, y) in zip(a, b) {
            let fx = (0x41...0x5A).contains(x) ? x &+ 0x20 : x  // fold A–Z only
            let fy = (0x41...0x5A).contains(y) ? y &+ 0x20 : y
            if fx != fy { return false }
        }
        return true
    }
}
```

:::

## 前提知識

- **UTF-8 のバイト列**: 文字列を、`utf8` で 1 バイトずつの列として見られます。英字は 1 バイトです。
- **ASCII の英字**: `A` は 0x41、`Z` は 0x5A、`a` は 0x61 です。大文字と小文字の差は、どちらも `0x20`（32）です。
- **`zip`**: 2 つの列を、同じ位置どうしで組にして順に取り出す関数です。

## 何をしているか

### 1. 長さが違えば、すぐ `false`

バイトの数が違えば、同じになりえません。すぐに `false` を返します。

```swift:line-numbers=3
        let a = self.utf8
        let b = other.utf8
        guard a.count == b.count else { return false }
```
### 2. 1 バイトずつ、英字だけを小文字にして比べる

2 つのバイトを同じ位置で取り出し、`A` から `Z` の範囲なら `0x20` を足して小文字にします。その上で比べ、違えば `false` です。

```swift:line-numbers=6
        for (x, y) in zip(a, b) {
            let fx = (0x41...0x5A).contains(x) ? x &+ 0x20 : x  // A〜Z だけを小文字にします（ASCII の英字のみ）。
            let fy = (0x41...0x5A).contains(y) ? y &+ 0x20 : y
            if fx != fy { return false }
```
### 3. 最後まで一致すれば `true`

すべての位置が一致したら、`true` を返します。

```swift:line-numbers=11
        return true
```
例として、`Content-Type` と `content-type` は、長さが同じで、`C` と `c`、`T` と `t` などが小文字にそろうので、一致します。一方、`É` と `é` は、英字ではないので小文字にならず、一致しません。

## ここがすごい

- **英字だけを畳み込む**: `lowercased()` は Unicode 全体を変換します。この関数は `A〜Z` だけを変換するので、ASCII の決まりを厳密に守れます。
- **バイトで比べるので速い**: 文字の境界を探さず、バイトを 1 つずつ比べます。ヘッダーのように短く何度も比べる値に向いています。
- **0x20 の差を使う**: 大文字と小文字は、ビット 1 つ分（0x20）だけ違います。足し算だけで小文字にできます。

## まとめ

- ASCII の英字だけを比べるなら、バイトを 1 つずつ見て、`A〜Z` を `0x20` 足して比べる。
- 長さが違えば、中身を見ずに `false` にする。
- Unicode 全体を小文字にする `lowercased()` とは、比べる範囲が違う。用途に合わせて使い分ける。
