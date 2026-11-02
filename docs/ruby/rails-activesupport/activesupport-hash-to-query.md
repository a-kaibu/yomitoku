---
title: "ハッシュを、順番の決まった URL の問い合わせ文字列にする"
description: "Hash#to_query は、ハッシュを「キー=値&...」の文字列にする。空の配列やハッシュは省き、キーを並べ替えて、同じ内容なら同じ文字列になるようにする。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/object/to_query.rb
lines: [98, 106]
function: "Hash#to_query"
difficulty: 2
format: 2
tags: ["ネットワーク", "文字列処理", "イディオム"]
---
## ひとことで

`Hash#to_query` は、ハッシュを **URL の問い合わせ文字列（`キー=値&...`）** にするメソッドです。
空の配列やハッシュは省きます。キーは並べ替えてから連結するので、同じ内容のハッシュは、いつも同じ文字列になります。
`{ b: 2, a: 1 }.to_query` は `"a=1&b=2"` になります。

## コード

```ruby:line-numbers=98
  def to_query(namespace = nil)
    query = filter_map do |key, value|
      next if (value.is_a?(Hash) || value.is_a?(Array)) && value.empty?
      value.to_query(namespace ? "#{namespace}[#{key}]" : key)
    end

    query.sort! unless namespace.to_s.include?("[]")
    query.join("&")
  end
```

## 前提知識

- **問い合わせ文字列（クエリ）**: URL の `?` の後ろに付く、`キー=値` を `&` でつないだ文字列です。
- **入れ子のキー**: `user[name]=Ann` のように、角括弧でハッシュの中のキーを表す書き方です。
- **`filter_map`**: 要素を変換しながら、`nil` を取り除いた配列を作ります。`next` で飛ばした要素は含みません。
- **`sort!`**: 配列を、その場で並べ替えます。
- **再帰的な `to_query`**: 値が入れ子のハッシュや配列なら、その値自身の `to_query` を呼びます。

## 何をしているか

### 1. 各組を、文字列の断片にする

```ruby:line-numbers=99
    query = filter_map do |key, value|
      next if (value.is_a?(Hash) || value.is_a?(Array)) && value.empty?
      value.to_query(namespace ? "#{namespace}[#{key}]" : key)
```

キーと値の組を順に見ます。値が空のハッシュや配列なら、`next` で飛ばします。そうでなければ、その値の `to_query` を呼んで、断片を作ります。入れ子の場合は、`user[name]` のように、キーを角括弧でつなぎます。

### 2. 並べ替えて、順番を固定する

```ruby:line-numbers=104
    query.sort! unless namespace.to_s.include?("[]")
```

名前空間を指定していないときは、断片を並べ替えます。ハッシュの書き順に関係なく、同じ内容なら同じ文字列になるようにするためです。

### 3. `&` でつないで返す

```ruby:line-numbers=105
    query.join("&")
```

断片を `&` でつないで、1 つの問い合わせ文字列にします。

## ここがすごい

### 同じ内容なら、同じ文字列

ハッシュは、キーを挿入した順番を覚えています。並べ替えないと、同じ内容でも文字列が違って見えます。
キャッシュのキーや、署名の計算に使うとき、この安定性が大切です。

### 入れ子を、同じ仕組みで扱う

値の型に応じて、その型の `to_query` に任せるので、ハッシュの中の配列やハッシュも、同じ規則で書けます。
新しい型を足すときも、その型の `to_query` を定義すれば対応できます。

### 空の値を省く

空の配列やハッシュを出すと、`tags[]=` のような意味のない断片が残ります。
この処理で、そうした断片を前もって取り除いています。

## まとめ

- 問い合わせ文字列は、並べ替えると、同じ内容から同じ文字列が得られます。
- 入れ子の値は、その型の変換に任せると、規則を重ねずに済みます。
- 意味のない空の値は、組み立ての途中で省くと、URL が簡潔になります。
