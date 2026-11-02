---
title: "文字列を、URL に使える形へ変える"
description: "String#parameterize は、文字列を URL のスラッグ（英小文字と区切り記号）にする。実際の変換は Inflector に任せ、このメソッドは既定の区切りを指定する入口になる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/string/inflections.rb
lines: [250, 252]
function: "String#parameterize"
difficulty: 1
format: 2
tags: ["文字列処理", "Unicode", "API設計"]
---
## ひとことで

`String#parameterize` は、文字列を **URL に使える「スラッグ」の形** に変えるメソッドです。
英小文字と数字、そして区切り文字（既定は `-`）だけからなる文字列になります。
`"Hello World!".parameterize` は `"hello-world"` になります。

## コード

```ruby:line-numbers=250
  def parameterize(separator: "-", preserve_case: false, locale: nil)
    ActiveSupport::Inflector.parameterize(self, separator: separator, preserve_case: preserve_case, locale: locale)
  end
```

## 前提知識

- **スラッグ（slug）**: URL の一部として使う、読みやすい短い名前です。`/articles/hello-world` の `hello-world` がスラッグです。
- **Unicode の正規化**: アクセント付きの文字を、基本の文字に直すことです。`é` を `e` にするなどの処理が含まれます。
- **キーワード引数**: `separator: "-"` のように、名前を付けて引数を渡す方法です。省略したときは既定値が使われます。
- **`preserve_case`**: 大文字を残すかどうかを決める引数です。既定では `false` で、小文字に変えます。
- **`locale`**: 言語ごとの変換規則を選ぶための引数です。

## 何をしているか

### 1. 変換の仕事を、Inflector に渡す

```ruby:line-numbers=251
    ActiveSupport::Inflector.parameterize(self, separator: separator, preserve_case: preserve_case, locale: locale)
```

このメソッドは、自分自身と、指定された区切り・大文字の扱い・言語を、`ActiveSupport::Inflector.parameterize` に渡します。実際の変換の規則は、そちらにあります。

### 2. 指定をそのまま渡す

```ruby:line-numbers=250
  def parameterize(separator: "-", preserve_case: false, locale: nil)
```

キーワード引数は、既定値を持っています。呼び出し側が何も指定しなければ、`-` 区切り、小文字、既定の言語で変換されます。

## ここがすごい

### 入口と仕事を分ける

`String` に付いているこのメソッドは、使いやすい入口です。変換の規則は `Inflector` にまとまっています。
同じ規則を `Symbol` などでも使いたいときに、規則を 1 か所で保てます。

### 引数の既定値で、よくある使い方を短くする

多くの場合、区切りは `-` で、大文字は残しません。
既定値を決めておくと、呼び出し側は何も書かずに、URL に適した形を得られます。

### 言語の違いを、引数で選べる

日本語や欧州の言語では、文字の変換の規則が違います。
`locale` を指定すると、その言語の規則で変換できます。

## まとめ

- 文字列を URL に使う形にするには、専用のメソッドを使うと、規則を自分で書かずに済みます。
- 入口のメソッドと、変換の規則を分けると、同じ規則をほかの型にも使えます。
- 既定値を用意すると、よくある使い方を 1 語で書けます。
