---
title: "文字列から一部を取り除いた、新しい文字列を作る"
description: "String#remove は、指定したパターンに一致する部分を取り除いた新しい文字列を返す。元の文字列は変えず、複製に対して remove! を呼ぶ。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/string/filters.rb
lines: [45, 47]
function: "String#remove"
difficulty: 1
format: 2
tags: ["文字列処理", "イディオム", "API設計"]
---
## ひとことで

`String#remove` は、文字列から **指定したパターンに一致する部分をすべて取り除いた、新しい文字列** を返すメソッドです。
`"Hello, World!".remove(",", "!")` は `"Hello World"` になります。
元の文字列は変わりません。

## コード

```ruby:line-numbers=45
  def remove(*patterns)
    dup.remove!(*patterns)
  end
```

## 前提知識

- **文字列の複製（`dup`）**: 同じ内容の、別の文字列オブジェクトを作ります。
- **破壊的メソッド（`!` 付き）**: 元のオブジェクトを書き換えるメソッドです。Ruby では、名前の最後に `!` を付けて区別します。
- **`remove!`**: 自分自身から、パターンに一致する部分を削除します。
- **可変長引数（`*patterns`）**: 引数をいくつ渡しても、配列にまとめて受け取ります。

## 何をしているか

### 1. 元の文字列を複製する

```ruby:line-numbers=46
    dup.remove!(*patterns)
```

`dup` で、自分と同じ内容の新しい文字列を作ります。この複製に対して、取り除く処理を行います。

### 2. 複製から、パターンを取り除く

```ruby:line-numbers=46
    dup.remove!(*patterns)
```

`remove!(*patterns)` は、複製（新しい文字列）の中から、パターンに一致する部分を削除します。複数のパターンは、順に取り除かれます。

### 3. 結果の文字列を返す

`dup.remove!` の戻り値が、取り除いた後の文字列です。元の文字列は、最後まで変わりません。

## ここがすごい

### 破壊的な版と、安全な版を分ける

Ruby の多くのメソッドには、元を書き換える版（`!`）と、新しい値を返す版があります。
このメソッドは、新しい値を返す版として `dup` で作業用の複製を使い、元の値を安全に保ちます。

### 既存の破壊的な処理を再利用する

取り除く処理を `remove!` に任せ、この関数は「複製してから呼ぶ」だけを担当します。
同じ処理を 2 か所に書かずに、2 つの振る舞いを両方使えます。

### 可変長引数で、使いやすくする

引数を配列にまとめて扱うので、1 つのパターンでも、複数のパターンでも同じ書き方で呼べます。

## まとめ

- 文字列を変えたくないときは、複製してから破壊的なメソッドを呼ぶと安全です。
- 破壊的な版と安全な版を両方用意すると、用途に合わせて選べます。
- 可変長引数を使うと、呼び出し側の書き方が柔軟になります。
