---
title: "複数の提供元から、メタデータを 1 つにまとめる"
description: "swift-log の MetadataProvider.multiplex(_:) が、複数の提供元を 1 つにまとめる処理。各提供元の値を順に reduce で辞書へ併合し、後から来たものが同じキーを上書きする。"
language: swift
project: "Swift Log"
repo: https://github.com/apple/swift-log
license: Apache-2.0
copyright: "Copyright (c) 2018-2022 Apple Inc. and the Swift Logging API project authors"
commit: "d0f784af9ea2bc75e557c3d2bb628a68248605f3"
file: Sources/Logging/MetadataProvider.swift
lines: [103, 113]
function: "Logger.MetadataProvider.multiplex(_:)"
difficulty: 2
tags: [設計パターン, ログ]
format: 2
---
## ひとことで

ログに付けるメタデータ（追加情報）を、複数の場所から集めたいことがあります。たとえば、リクエスト ID と、ユーザー情報を別々に用意する場合です。この関数は、それらを 1 つの提供元にまとめます。

## コード

```swift:line-numbers=103
    public static func multiplex(_ providers: [Logger.MetadataProvider]) -> Logger.MetadataProvider? {
        assert(!providers.isEmpty, "providers MUST NOT be empty")

        return Logger.MetadataProvider {
            providers.reduce(into: Logger.Metadata()) { merged, provider in
                let provided = provider.get()
                guard !provided.isEmpty else { return }
                merged.merge(provided, uniquingKeysWith: { _, rhs in rhs })
            }
        }
    }
```

## 前提知識

- **`MetadataProvider`**: 呼ばれるたびに、ログに付けるメタデータを返す仕組みです。
- **`Metadata`**: キーと値の辞書です。ログの追加情報を入れます。
- **`reduce(into:)`**: 結果の値を 1 つ用意して、各要素をその中へ少しずつ足していく書き方です。
- **`merge(_:uniquingKeysWith:)`**: 2 つの辞書を合わせます。同じキーがあるときは、どちらの値を使うかを決める関数を渡します。

## 何をしているか

### 1. 空の提供元は飛ばす前提で、必要な配列を確かめる

providers が空では意味がないので、`assert` で開発中だけ確かめます。

```swift:line-numbers=104
        assert(!providers.isEmpty, "providers MUST NOT be empty")
```
### 2. 提供元の値を集めて、1 つの辞書に足す

まとめた提供元は、呼ばれるたびに、各提供元の `get()` を順に呼びます。値が空でなければ、結果の辞書に併合します。

```swift:line-numbers=106
        return Logger.MetadataProvider {
            providers.reduce(into: Logger.Metadata()) { merged, provider in
                let provided = provider.get()
                guard !provided.isEmpty else { return }
                merged.merge(provided, uniquingKeysWith: { _, rhs in rhs })
            }
```
### 3. 同じキーは後から来た値で上書きする

`uniquingKeysWith` で、同じキーがあったときは右側、つまり後から来た値を使います。

```swift:line-numbers=110
                merged.merge(provided, uniquingKeysWith: { _, rhs in rhs })
```
## ここがすごい

- **呼ぶ側は 1 つの提供元だけを見る**: 複数の取得元を、1 つの値として扱えます。
- **空を先に弾く**: 何も返さない提供元は、併合の前に読み飛ばします。
- **遅く評価される**: `get()` は、ログを書くときにだけ呼ばれます。

## まとめ

- 提供元を 1 つの提供元にまとめる。
- 各提供元の値を、順に 1 つの辞書へ併合する。
- 同じキーは後から来た値を使う。
