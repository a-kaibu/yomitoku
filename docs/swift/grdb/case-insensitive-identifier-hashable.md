---
title: "大文字と小文字を区別せずに比べるが、元の表記は残す"
description: "GRDB で、SQLite の識別子（テーブル名や列名）を、大文字と小文字を区別せずに比べる型。元の表記は保ったまま、比べるときとハッシュの計算に小文字版を使う。"
language: swift
project: "GRDB"
repo: https://github.com/groue/GRDB.swift
license: MIT
copyright: "Copyright (C) 2015-2025 Gwendal Roué"
commit: "92a554cd0d5e8d67cb18993c6054e73fe42c066c"
file: GRDB/Utils/CaseInsensitiveIdentifier.swift
lines: [3, 19]
function: "CaseInsensitiveIdentifier (==, hash(into:))"
difficulty: 2
tags: [文字列処理, ハッシュ, 設計パターン]
format: 2
---
## ひとことで

SQLite の識別子（テーブル名や列名）は、大文字と小文字を区別しないものとして扱われます。`Users` と `users` は同じテーブルです。
ただし、コードでは元の書き方をそのまま表示したいことがあります。この型は、**元の表記（`rawValue`）は保ったまま**、比べるときは小文字版で比べます。

## コード

```swift:line-numbers=3
struct CaseInsensitiveIdentifier: Hashable {
    private let lowercased: String
    let rawValue: String
    
    init(rawValue: String) {
        self.lowercased = rawValue.lowercased()
        self.rawValue = rawValue
    }
    
    static func == (lhs: CaseInsensitiveIdentifier, rhs: CaseInsensitiveIdentifier) -> Bool {
        lhs.lowercased == rhs.lowercased
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(lowercased)
    }
}
```

## 前提知識

- **`Hashable`**: 辞書や集合で使うための型です。`==` で等しいと判定したものは、`hash(into:)` で同じハッシュ値になる必要があります。この約束を守らないと、辞書で見つからなくなります。
- **`lowercased()`**: 文字列の小文字版を返します。
- **`private let`**: 型の外からは読めない、保存された値です。ここでは比較用の小文字版を隠しています。

## 何をしているか

### 1. 作るときに、小文字版を一緒に保存する

初期化の時点で、小文字版を `lowercased` に保存します。元の文字列は `rawValue` に、そのまま残します。

```swift:line-numbers=7
    init(rawValue: String) {
        self.lowercased = rawValue.lowercased()
        self.rawValue = rawValue
    }
```
### 2. 等しさは、小文字版どうしで比べる

2 つの識別子が等しいかは、小文字版が同じかで決めます。元の表記が違っても、比べるときは同じとみなします。

```swift:line-numbers=12
    static func == (lhs: CaseInsensitiveIdentifier, rhs: CaseInsensitiveIdentifier) -> Bool {
        lhs.lowercased == rhs.lowercased
    }
```
### 3. ハッシュも、小文字版から計算する

ハッシュ値も小文字版から計算します。`==` で等しい 2 つの値は、同じハッシュ値になります。これで、辞書や集合で正しく扱えます。

```swift:line-numbers=16
    func hash(into hasher: inout Hasher) {
        hasher.combine(lowercased)
    }
```
例として、`Users` と `users` は、`==` で等しく、ハッシュ値も同じです。そのため、辞書のキーにすると、同じものとして扱われます。元の表記は `rawValue` で、それぞれ `Users` と `users` のまま取り出せます。

## ここがすごい

- **比べる基準を 1 か所に決める**: `==` とハッシュの両方が、同じ小文字版を使います。片方だけ別の基準にすると、辞書で見つからなくなるので、この約束を守るのが大切です。
- **表示と比較を分ける**: 表記は元のまま表示し、比較だけを正規化します。ユーザーに見せる名前を崩さずに済みます。
- **注意点: 比べ方が SQLite と完全には一致しない**: コメントは SQLite の `sqlite3_stricmp` に合わせると書かれています。しかし、`lowercased()` は Unicode の文字も小文字にするので、ASCII 以外の文字では SQLite と結果が違うことがあります。

## まとめ

- 大文字と小文字を区別せずに比べるには、小文字版を保存して、その上で `==` とハッシュを作る。
- `==` とハッシュは、同じ基準で作る。そうしないと、辞書で正しく扱えない。
- 元の表記は `rawValue` に残すと、表示と比較を両立できる。
