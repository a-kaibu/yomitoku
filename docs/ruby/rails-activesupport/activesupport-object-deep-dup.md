---
title: "コピーできるものは、深く複製する"
description: "Object#deep_dup は、複製できるオブジェクトなら dup を呼んで複製し、複製できないもの（nil や整数など）はそのまま返す。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/object/deep_dup.rb
lines: [17, 19]
function: "Object#deep_dup"
difficulty: 2
format: 2
tags: ["メモリ管理", "API設計", "イディオム"]
---
## ひとことで

`Object#deep_dup` は、オブジェクトを **複製できるなら複製し、複製できないものはそのまま返す** メソッドです。
文字列や配列など、中身を書き換えられるものは別の値としてコピーされます。
数値や `nil` のように、複製の必要がないものは、そのまま同じ値を返します。

## コード

```ruby:line-numbers=17
  def deep_dup
    duplicable? ? dup : self
  end
```

## 前提知識

- **`dup`**: オブジェクトの浅いコピー（複製）を作ります。中身の参照は同じものを指します。
- **深いコピー（deep copy）**: 中に入っている値まで、再帰的に複製することです。
- **`duplicable?`**: そのオブジェクトを `dup` できるかを調べます。`nil`、`true`、`false` や数値などは、複製が不要か、できないとされています。
- **`三項演算子`**: `条件 ? A : B` の形で、条件によって値を選びます。

## 何をしているか

### 1. 複製できるかを確かめる

```ruby:line-numbers=18
    duplicable? ? dup : self
```

`duplicable?` が真なら、`dup` で複製します。偽なら、自分自身をそのまま返します。

### 2. 配列では、中の要素も複製する

Array 版の `deep_dup` は、ほかのメソッドと組み合わさって、中の要素を 1 つずつ `deep_dup` します。
これにより、入れ子になった配列やハッシュも、中身まで別のものになります。

## ここがすごい

### 同じ名前で、型ごとの振る舞いを変える

`Object` の既定の定義と、`Array` や `Hash` の定義が、同じ `deep_dup` という名前で振る舞いを変えます。
利用者は、型を気にせず同じ名前で複製を頼めます。

### 複製できないものを、無理に複製しない

`nil` や数値は、`dup` しても同じ値が返るだけで、複製の意味がありません。
`duplicable?` で先に確かめることで、安全に扱えます。

### 浅いコピーの落とし穴を避ける

`dup` は、中の配列まで別物にしません。そのため、コピーの中身を変えると元も変わる、という問題が起きます。
`deep_dup` を使うと、その問題を避けられます。

## まとめ

- 複製が必要かどうかは、型によって違うので、`duplicable?` で判断します。
- 浅いコピーでは、入れ子の値が共有されることに注意します。
- 同じ名前のメソッドを型ごとに定義すると、呼び出し側は型を気にせず使えます。
