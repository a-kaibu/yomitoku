---
title: "要素の一部分の値で、最小の要素を探す"
description: "Enumerable#minimum は、各要素に指定したメソッドを適用して、その最小値を返す。キーにシンボルを渡すと、そのメソッドを呼ぶ簡潔な書き方になる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [34, 36]
function: "Enumerable#minimum"
difficulty: 1
format: 2
tags: ["イテレータ", "API設計", "イディオム"]
---
## ひとことで

`Enumerable#minimum` は、各要素に **指定したメソッドを適用した結果の中で、最も小さい値** を返すメソッドです。
`users.minimum(:age)` は、全員の `age` のうち最も小さい値を返します。
最小の要素そのものではなく、その要素から取り出した値を返す点に注意してください。

## コード

```ruby:line-numbers=34
  def minimum(key)
    map(&key).min
  end
```

## 前提知識

- **`map`**: 各要素を変換して、新しい配列を作ります。
- **`&key`（シンボル・ブロック）**: `&:age` は `{ |x| x.age }` の省略形です。各要素に同じメソッドを呼びます。
- **`min`**: 配列の中で最も小さい値を返します。
- **`Enumerable`**: 要素を順に取り出せるものに共通する、メソッドの集まりです。

## 何をしているか

### 1. 各要素から、キーの値を取り出す

```ruby:line-numbers=35
    map(&key).min
```

`map(&key)` は、各要素に `key` で指定したメソッドを呼び、その結果の配列を作ります。`:age` なら、各人の年齢の配列になります。

### 2. 取り出した値の中から、最小を選ぶ

```ruby:line-numbers=35
    map(&key).min
```

`min` は、その値の配列の中で最小の値を返します。元の要素ではなく、取り出した値の最小です。

## ここがすごい

### 「何で比べるか」を 1 語で伝える

`min { |x| x.age }` と書く代わりに、`minimum(:age)` と書けます。
比べる基準が、名前のすぐ後ろに書かれていて、一目で伝わります。

### 最小の要素と、最小の値を区別する

このメソッドが返すのは値なので、「一番若い人」が欲しいときは、`min_by` を使う必要があります。
名前の違いが、戻り値の違いを明確にしています。

### 途中の配列を作る

`map` で中間の配列を作るため、要素が非常に多いときはメモリを使います。
小さなコレクションでは気になりませんが、規模が大きくなるときは、このことを意識すると良いです。

## まとめ

- 比較の基準をメソッドの名前で渡すと、コードを短く読みやすくできます。
- 「最小の値」と「最小の要素」は違うので、目的に応じて別のメソッドを使います。
- 中間の配列を作る処理は、規模を考えて選びます。
