---
title: "Content-Type から「text/html」だけを取り出し、小文字にそろえる"
description: "Content-Type ヘッダの「;」や「,」より前の部分を取り出し、前後の空白を消して小文字にする。大文字小文字の違いで別物にならないようにする。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/media_type.rb
lines: [16, 22]
function: "Rack::MediaType.type"
difficulty: 1
format: 2
tags: [文字列処理, パース, API設計]
---

## ひとことで

`type` は、`Content-Type` ヘッダから **メディアタイプ（`text/html` などの種類の部分）だけ** を取り出すメソッドです。
`"Text/HTML; charset=utf-8"` は `"text/html"` になり、空や `nil` なら `nil` を返します。
後ろの `charset` などの条件は、前の記事の `params` が扱います。

## コード

```ruby:line-numbers=16
      def type(content_type)
        return nil unless content_type && !content_type.empty?
        type = content_type.split(SPLIT_PATTERN, 2).first
        type.rstrip!
        type.downcase!
        type
      end
```

## 前提知識

- **メディアタイプ**: `type/subtype` の形で、中身の種類を表します（例: `application/json`）。大文字小文字は区別しない決まりです。
- **`split(パターン, 2)`**: 区切りで最大 2 つに分けます。`2` を付けると、2 つ目以降に `;` が出てきても分割しません。`first` で最初の部分を取ります。
- **`rstrip!` / `downcase!`**: 末尾の空白を消す、小文字にする、という変更を、その場で行います。
- **`nil`**: 「値がない」を表します。`return nil unless ...` は、条件が偽なら `nil` を返して終わります。

## 何をしているか

### 1. 何もなければ nil を返す

```ruby:line-numbers=17
        return nil unless content_type && !content_type.empty?
```

`nil` や空文字列では、型を取り出せないので `nil` を返します。

### 2. `;` より前を取り出して整える

```ruby:line-numbers=18
        type = content_type.split(SPLIT_PATTERN, 2).first
        type.rstrip!
        type.downcase!
        type
```

`"Text/HTML; charset=utf-8"` を `;` で分けると、最初は `"Text/HTML"` です。`rstrip!` で末尾の空白を消し、`downcase!` で `"text/html"` にします。

## ここがすごい

### 分割の回数を 2 に絞る

`split` に `2` を渡すことで、条件の部分に `;` が何回出てきても、分割は最初の 1 回だけになります。必要な部分だけを取るので、無駄な配列を作りません。

### 比較しやすい形に揃える

メディアタイプを小文字にしておけば、`text/html` と `Text/HTML` を同じものとして比べられます。比較の前に正規化するのは、HTTP の仕様に沿った安全な書き方です。

### 元の値を壊さない

`split` は新しい文字列を作るので、呼び出し元の `content_type` は変わりません。その後の `!` 付きのメソッドは、その新しい文字列に対してだけ働きます。

## まとめ

- 区切りで最初の部分だけが欲しいときは、分割の回数を指定すると効率的です。
- 比べる前に正規化（空白の除去、小文字化）すると、表記の違いで迷いません。
- `nil` を返す条件を最初に書くと、その後の処理が単純になります。
