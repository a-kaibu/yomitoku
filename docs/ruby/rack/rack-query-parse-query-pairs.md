---
title: "同じ名前も全部残して、組の配列を返す parse_query_pairs"
description: "クエリ文字列を、名前と値の組の配列にする。同じ名前が何度出ても、まとめずにすべて残す。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/query_parser.rb
lines: [100, 108]
function: "Rack::QueryParser#parse_query_pairs"
difficulty: 1
format: 2
tags: [パース, API設計, イテレータ]
---

## ひとことで

`parse_query_pairs` は、クエリ文字列を **名前と値の組の配列** にするメソッドです。
`"tag=ruby&tag=rails"` は `[["tag", "ruby"], ["tag", "rails"]]` になります。
同じ名前が何度出ても、まとめずにすべて残します。

## コード

```ruby:line-numbers=100
    def parse_query_pairs(qs, separator = nil)
      pairs = []

      each_query_pair(qs, separator) do |k, v|
        pairs << [k, v]
      end

      pairs
    end
```

## 前提知識

- **組（ペア）**: `[名前, 値]` の 2 つ組の配列です。
- **`each_query_pair`**: 同じクラスにある補助メソッドで、`&` で分けた組を 1 つずつブロックに渡します。
- **`<<`**: 配列の末尾に要素を足します。
- **ブロックの引数 `|k, v|`**: 渡された組を、名前と値の 2 つの変数に分けて受け取ります。

## 何をしているか

### 1. 結果の入れ物を作る

```ruby:line-numbers=101
      pairs = []
```

空の配列を用意します。

### 2. 組を順に足す

```ruby:line-numbers=103
      each_query_pair(qs, separator) do |k, v|
        pairs << [k, v]
      end
```

`each_query_pair` が渡してくる名前と値を、そのまま組にして足します。同じ名前でも、そのまま残します。

### 3. 配列を返す

```ruby:line-numbers=107
      pairs
```

## ここがすごい

### まとめない選択

`parse_query` は同じ名前を配列にまとめますが、このメソッドはまとめません。順番も含めてすべてを残すので、同じ名前の値の並び順が大事な場面で使えます。

### 同じ仕組みを 2 通りに

2 つのメソッドは、どちらも `each_query_pair` の上に作られています。分け方の部分は共通で、まとめるかどうかだけが違います。

### 単純な形で、ほかの処理の材料に

結果が単純な配列なので、ほかの処理（並べ替え、変換など）の材料にしやすくなっています。

## まとめ

- 元の順番と重複を残したいときは、配列のまま扱うと失いません。
- 同じ分け方の処理を共有すると、「まとめる」「残す」の違いだけを書けます。
- 結果の形を単純にしておくと、次の処理につなげやすくなります。
