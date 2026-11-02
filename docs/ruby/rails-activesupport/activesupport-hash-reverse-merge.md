---
title: "既定値を先に置いて、あとから上書きさせない"
description: "Hash#reverse_merge は、引数のハッシュと自分を合わせるとき、自分の値を優先する。既定値を後ろに置く書き方を 1 語で表す。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/hash/reverse_merge.rb
lines: [18, 20]
function: "Hash#reverse_merge"
difficulty: 1
format: 2
tags: ["データ構造", "イディオム", "API設計"]
---
## ひとことで

`Hash#reverse_merge` は、引数のハッシュと自分を合わせた新しいハッシュを返しますが、**同じ鍵があったら自分の値を優先** します。
既定値のハッシュに、利用者が渡した値を上書きさせない、という書き方に使われます。
元のハッシュは変わりません。

## コード

```ruby:line-numbers=18
  def reverse_merge(other_hash)
    other_hash.merge(self)
  end
```

## 前提知識

- **`merge`**: 2 つのハッシュを合わせた新しいハッシュを作ります。同じ鍵は、引数の値で上書きされます。
- **既定値（デフォルト）**: 利用者が指定しなかったときに使われる値です。
- **`reverse_merge` の意味**: 「逆向きに merge する」ことです。引数を先に、自分を後に合わせると、自分の値が勝ちます。
- **`reverse_merge!`**: 同じ処理を、自分自身を書き換えて行う版です。

## 何をしているか

### 1. 引数を先に、自分を後にして合わせる

```ruby:line-numbers=19
    other_hash.merge(self)
```

`other_hash.merge(self)` は、引数のハッシュに、自分を上書きする形で合わせます。同じ鍵があれば、後から合わせた自分の値が使われます。

例えば `{ color: "red" }.reverse_merge(color: "blue", size: 1)` は、`color` が `"red"`、`size` が `1` のハッシュになります。

## ここがすごい

### 順番を逆にするだけで、優先順位が変わる

`merge` の順番を入れ替えるだけで、「既定値を後ろに置く」という意図を表せます。
新しい規則を作らず、既存の仕組みを使うので、すぐ理解できる書き方です。

### 既定値を書く場所が自然になる

メソッドの中で、「まず既定値を並べ、利用者の指定で上書き」という形を書くとき、`options = defaults.merge(options)` より、`options.reverse_merge(defaults)` のほうが、何をしたいかが伝わります。

### 元を書き換えない

通常の版は新しいハッシュを作ります。元の引数や設定を汚さないので、同じ既定値を何度も使い回せます。

## まとめ

- 既定値と利用者の指定を合わせるときは、どちらが優先されるかを意識して順番を決めます。
- 「逆向きの merge」と名前で伝えると、読み手が優先順位をすぐ理解できます。
- 新しいハッシュを返す版を使うと、元の設定が変わらず安全です。
