---
title: "ハッシュを「キー=値&...」の文字列に組み立てる"
description: "Rack::Utils.build_query は、ハッシュを URL のクエリ文字列にする。配列の値は同じキーを繰り返し、値が nil ならキーだけを書く。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [109, 117]
function: "Rack::Utils.build_query"
difficulty: 2
format: 2
tags: ["文字列処理", "ネットワーク", "イディオム"]
---
## ひとことで

`Rack::Utils.build_query` は、ハッシュを **URL のクエリ文字列**（`name=value&...` の形）に組み立てるメソッドです。
`{"a" => 1, "b" => [2, 3]}` は `a=1&b=2&b=3` になります。
値が `nil` のキーは、`=` を付けずにキーだけを書きます。

## コード

```ruby:line-numbers=109
    def build_query(params)
      params.map { |k, v|
        if v.class == Array
          build_query(v.map { |x| [k, x] })
        else
          v.nil? ? escape(k) : "#{escape(k)}=#{escape(v)}"
        end
      }.join("&")
    end
```

## 前提知識

- **クエリ文字列**: URL の `?` の後ろに付く、`キー=値` を `&` で並べた文字列です。
- **`map` と `join`**: 配列の要素ごとに変換して、区切り文字でつなぎます。
- **`escape`**: 文字列を URL に入れられる形（`%20` など）に変えます。
- **`v.class == Array`**: 値が配列かを調べます。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` を返す式です。
- **再帰**: メソッドが、自分自身を呼び出すことです。

## 何をしているか

### 1. 配列の値は、同じキーを繰り返して書く

```ruby:line-numbers=111
        if v.class == Array
          build_query(v.map { |x| [k, x] })
```

値が配列なら、各要素 `x` と組にした `[k, x]` の配列を作り、自分自身（`build_query`）に渡します。
`b => [2, 3]` は `[["b", 2], ["b", 3]]` になり、`b=2&b=3` として書かれます。

### 2. `nil` 以外は、`キー=値` の形にする

```ruby:line-numbers=114
          v.nil? ? escape(k) : "#{escape(k)}=#{escape(v)}"
```

値が `nil` なら、キーだけを `escape(k)` で書きます。そうでなければ、キーと値の両方を `escape` して `=` でつなぎます。
`escape` は、空白や記号を URL の安全な形に変えます。

### 3. 全部を `&` でつなぐ

```ruby:line-numbers=109
    def build_query(params)
      params.map { |k, v|
        if v.class == Array
          build_query(v.map { |x| [k, x] })
        else
          v.nil? ? escape(k) : "#{escape(k)}=#{escape(v)}"
        end
      }.join("&")
```

`map` で作った各部分を、`join("&")` で 1 つの文字列にします。

## ここがすごい

### 同じ仕組みで配列も扱う

配列の処理は、要素ごとに組を作り直して、同じメソッドに戻すだけです。
特別な書き方を増やさずに、「値が配列の場合」を表せます。

### 自分で `=` を書かない

`nil` とそれ以外の場合分けを、1 つの三項演算子で書いています。
出力の形の違いが、コードの 1 行の中で完結しています。

### 値をすべて `escape` する

`&` や `=` を含む値をそのまま書くと、受け取る側が別のキーと誤解します。
キーも値も必ず `escape` することで、区切りの記号と値の中の記号を混同させません。

## まとめ

- 配列の値を表すには、同じキーを繰り返す形が URL の一般的な書き方です。
- 再帰で、特別な型の値を元の処理へ戻すと、コードを増やさずに済みます。
- URL に組み立てる値は、区切りの記号と混ざらないように必ずエスケープします。
