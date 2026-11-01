---
title: "並べたい順番のリストで並べ替える in_order_of"
description: "ID のリストなど「この順に並べてほしい」という指定どおりに要素を並べる。group_by と values_at の組み合わせで一気に並べ替える。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [219, 225]
function: "Enumerable#in_order_of"
difficulty: 2
format: 2
tags: [ソート, ハッシュ, イディオム]
---

## ひとことで

`in_order_of(key, series)` は、要素の `key` の値が `series`（順番のリスト）に並んだ順になるよう、要素を並べ替えるメソッドです。
`[Person(5), Person(3), Person(1)].in_order_of(:id, [1, 5, 3])` は `[Person(1), Person(5), Person(3)]` になります。
検索エンジンが返した ID の順番どおりに、データベースから取ってきたレコードを並べたいときなどに使います。

## コード

```ruby:line-numbers=219
  def in_order_of(key, series, filter: true)
    if filter
      group_by(&key).values_at(*series).compact.flatten(1)
    else
      sort_by { |v| series.index(v.public_send(key)) || series.size }
    end
  end
```

## 前提知識

- **キーワード引数 `filter: true`**: 名前付きで渡す引数です。省略すると `true` になります。
- **`group_by(&key)`**: 各要素の `key` の値でグループ分けし、`{値 => [要素, ...]}` のハッシュを作ります。`&key` はシンボル `:id` を「`x.id` を呼ぶブロック」に変える書き方です。
- **`values_at(*series)`**: ハッシュから、指定したキーの値を **指定した順番で** まとめて取り出します。存在しないキーの値は `nil` になります。`*series` は配列を引数に展開する書き方です。
- **`compact`**: 配列から `nil` を取り除きます。
- **`flatten(1)`**: 配列の配列を 1 段だけ平らにします。`[[a], [b, c]]` → `[a, b, c]` です。
- **`sort_by { ... }`**: ブロックが返す値の小さい順に並べ替えます。
- **`series.index(x)`**: 配列の中で `x` が何番目にあるかを返します。なければ `nil` です。

## 何をしているか

### 1. フィルタありの場合

```ruby:line-numbers=220
    if filter
      group_by(&key).values_at(*series).compact.flatten(1)
```
ID が 5, 3, 1 の人を `[1, 5, 3]` の順に並べる例です。

1. `group_by(&:id)` → `{5 => [p5], 3 => [p3], 1 => [p1]}`
2. `values_at(1, 5, 3)` → `[[p1], [p5], [p3]]`
3. `compact` → `series` にあってデータにない ID（`nil`）を除く
4. `flatten(1)` → `[p1, p5, p3]`

`series` に含まれない ID の要素は、そもそも取り出されないので結果に入りません。

### 2. フィルタなしの場合

```ruby:line-numbers=222
    else
      sort_by { |v| series.index(v.public_send(key)) || series.size }
```
`filter: false` なら、`series` の中での位置を並べ替えのキーにします。`series` にない要素は `series.size`（どの位置よりも大きい値）になり、**末尾にまとめて** 置かれます。

## ここがすごい

### 並べ替えをせずに並べ替える

1 つ目の方法では、比較による並べ替え（ソート）を一度もしていません。グループ分けして、欲しい順にキーで取り出すだけです。
`sort_by { series.index(...) }` の方法は、要素ごとに `series` を先頭から探すので、要素も `series` も多いと遅くなります。ハッシュを使う方法なら、取り出しは一瞬です。

### 重複にも対応している

`group_by` は同じキーの要素を配列にまとめるので、同じ ID の要素が 2 つあっても失われません。`index_by` を使うと後の要素で上書きされてしまいます。`flatten(1)` で 1 段だけ平らにしているのは、要素そのものが配列だった場合に、それまで崩さないための配慮です。

### 用途に合わせて 2 つの戦略

「指定にないものは捨てる」場合と「後ろに回す」場合では、適したやり方が違います。オプション 1 つで、それぞれに合った実装に切り替えています。

## まとめ

- 「指定した順に並べる」は、ソートしなくても、グループ分けとキーでの取り出しで実現できます。
- `values_at` はハッシュから「この順で」値を取り出せる便利なメソッドです。
- `flatten(1)` のように段数を指定すると、平らにしすぎる事故を防げます。
- 存在しないキーをどう扱うか（捨てる・末尾に回す）は、オプションで選べると便利です。
