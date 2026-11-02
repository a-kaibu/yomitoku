---
title: "指定した位置から最後までを、安全に取り出す"
description: "Array#from は、指定した位置から末尾までの配列を返す。範囲の外を指定したときは、例外ではなく空の配列を返す。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/array/access.rb
lines: [15, 17]
function: "Array#from"
difficulty: 1
format: 2
tags: ["データ構造", "API設計", "防御的プログラミング"]
---
## ひとことで

`Array#from` は、配列の **指定した位置から最後までを取り出した新しい配列** を返すメソッドです。
`%w[a b c d].from(2)` は `["c", "d"]` になります。
位置が配列の長さを超えていても、エラーにせず空の配列を返します。

## コード

```ruby:line-numbers=15
  def from(position)
    self[position, length] || []
  end
```

## 前提知識

- **添字（インデックス）**: 配列の位置を表す番号で、先頭は 0 から数えます。
- **`self[位置, 長さ]`**: 位置から、指定した長さの部分を取り出します。`長さ` を省略すると、末尾までの意味になります。
- **`||`（または）**: 左の値が `nil` なら、右の値を使います。
- **範囲外の添字**: 配列の長さより先の位置を指定すると、Ruby の標準では `nil` が返ります。

## 何をしているか

### 1. 位置と、残りの長さを使って取り出す

```ruby:line-numbers=16
    self[position, length] || []
```

`self[position, length]` は、位置から配列の末尾までを取り出します。`length` は今の配列の長さなので、ちょうど残りすべてになります。

### 2. 取り出せなければ、空の配列

```ruby:line-numbers=16
    self[position, length] || []
```

位置が配列の範囲を超えていると、取り出しの結果は `nil` になります。`|| []` によって、その場合は空の配列を返します。

## ここがすごい

### `nil` の代わりに、空の配列を返す

呼び出し側は、結果がいつも配列だと信じて、`each` などを続けて書けます。
`nil` を確かめる必要がないので、コードが短くなります。

### 配列の長さを、あらかじめ知らなくてもよい

`length` を渡しているので、どれだけ取り出すかを呼び出し側が数えなくても済みます。
「この位置からずっと最後まで」という意図が、そのまま書けます。

### 反対の操作と対になる

同じ場所の `to` は、先頭から位置までを返します。`from` と `to` は対になっていて、配列を前後に分けるときに読みやすい組になっています。

## まとめ

- 配列の一部分を取り出すときは、範囲外の場合に空の配列を返すと、後の処理が楽になります。
- `nil` の代わりに空の配列を返すと、呼び出し側は安全に反復できます。
- 対になるメソッドを用意すると、読み手が配列の分け方を直感的に理解できます。
