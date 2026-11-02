---
title: "行の頭に、空白を一度にそろえて付ける"
description: "String#indent は、文字列の各行の頭に指定した幅の空白を付けた新しい文字列を返す。元の文字列は変えず、複製に indent! を使う。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/string/indent.rb
lines: [50, 52]
function: "String#indent"
difficulty: 1
format: 2
tags: ["文字列処理", "イディオム", "API設計"]
---
## ひとことで

`String#indent` は、文字列の **各行の先頭に、指定した幅の空白（または任意の文字）を付けた新しい文字列** を返すメソッドです。
`"a\nb".indent(2)` は `"  a\n  b"` になります。
元の文字列は変わりません。複製に対して、破壊的な版の `indent!` を呼ぶ形になっています。

## コード

```ruby:line-numbers=50
  def indent(amount, indent_string = nil, indent_empty_lines = false)
    dup.tap { |_| _.indent!(amount, indent_string, indent_empty_lines) }
  end
```

## 前提知識

- **インデント**: 行の頭に空白を入れて、字下げをすることです。コードのブロックの構造を見やすくするために使われます。
- **`dup`**: 文字列を複製します。
- **`tap`**: 自分自身を受け取ってブロックを実行し、その後で自分自身を返すメソッドです。途中の処理を挟みつつ、値を続けて使えます。
- **破壊的メソッド（`!`）**: 元の文字列を書き換えるメソッドです。
- **既定値の引数**: `indent_string = nil` のように、省略されたときの値を決めておく書き方です。

## 何をしているか

### 1. 元を変えない複製を作る

```ruby:line-numbers=51
    dup.tap { |_| _.indent!(amount, indent_string, indent_empty_lines) }
```

`dup` で複製し、`tap` で複製に対して `indent!` を実行します。`tap` は、その複製自身を返すので、結果として字下げ済みの新しい文字列が返ります。

### 2. 字下げの処理は破壊的な版に任せる

`indent!` は、幅、字下げに使う文字列、空行に字下げするかどうかを引数で受け取ります。`indent` は、それらの引数をそのまま渡すだけです。

## ここがすごい

### 2 つの版を 1 つの実装から作る

破壊的な `indent!` が本体で、安全な `indent` はその複製版です。
字下げの仕組みを 1 か所にまとめ、どちらの版でも同じ結果になるようにしています。

### `tap` で、複製と処理を 1 行にする

`dup.tap { ... }` は、「複製を作り、それに処理をして、その複製を返す」という流れを 1 つの式にします。
一時的な変数を作らずに済むので、短く書けます。

### 空行の扱いを選べる

コードや段落の空行に字下げを入れるかどうかは、場面によって違います。
`indent_empty_lines` で選べるようにして、利用者が目的に合う形を取れます。

## まとめ

- 文字列の加工は、破壊的な版と複製版を分けると、用途に応じて選べます。
- `tap` を使うと、複製と加工を続けて書けます。
- 例外的な扱い（空行など）は、引数で選べるようにすると、柔軟な部品になります。
