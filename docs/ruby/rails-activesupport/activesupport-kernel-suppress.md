---
title: "指定した例外だけを黙って無視する"
description: "Kernel#suppress は、ブロックの中で指定した種類の例外が起きたとき、何もせずに続きへ進む。例外を全部無視するのではなく、種類を選べる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/kernel/reporting.rb
lines: [45, 48]
function: "Kernel#suppress"
difficulty: 2
format: 2
tags: ["エラー処理", "イディオム", "API設計"]
---
## ひとことで

`Kernel#suppress` は、ブロックの中で **指定した種類の例外が起きたときだけ、それを無視して先へ進める** メソッドです。
`suppress(Errno::ENOENT) { File.delete("tmp.txt") }` は、ファイルが無くても例外を出さずに終わります。
指定していない種類の例外は、ふつうどおり外へ伝わります。

## コード

```ruby:line-numbers=45
  def suppress(*exception_classes)
    yield
  rescue *exception_classes
  end
```

## 前提知識

- **例外（exception）**: 処理の途中で起きた問題を知らせる仕組みです。`raise` で発生させ、`rescue` で受け止めます。
- **`rescue`**: 指定した例外が起きたとき、その処理を行うための節です。
- **`*exception_classes`**: 例外の種類を、いくつでも並べて受け取る可変長引数です。
- **`yield`**: メソッドに渡されたブロックを実行します。
- **`Errno::ENOENT`**: ファイルが見つからないときに起きる例外の種類です。

## 何をしているか

### 1. ブロックを実行する

```ruby:line-numbers=46
    yield
```

`yield` で、渡されたブロックの中の処理を実行します。ここで例外が起きなければ、そのまま結果が返ります。

### 2. 指定された種類の例外だけを受け止める

```ruby:line-numbers=47
  rescue *exception_classes
```

`rescue *exception_classes` は、指定された種類の例外が起きたときだけ、受け止めます。受け止めた後は何もせず、メソッドが終わります。

`suppress` 全体の結果は `nil` になります。例外を無視したことを表すためです。

## ここがすごい

### 「何を無視するか」を、呼び出し側が決める

例外を全部無視すると、本当に困るエラーまで隠れてしまいます。
このメソッドは種類を指定させるので、「ファイルが無いのは構わないが、権限のエラーは知らせる」という判断を、呼び出し側が書けます。

### 1 行で意図が読める

`begin ... rescue ... end` の 5 行を、`suppress(...) { ... }` の 1 行に置き換えられます。
「この例外は気にしない」という意図が、名前と引数に表れています。

### ブロックと組み合わせる

ブロックの中の処理が、どんな例外を起こすかを、呼び出し側は引数の並びで宣言できます。
処理と例外の扱いが、同じ場所に並んで書かれるので、後から読み直しやすくなります。

## まとめ

- 無視してよい例外は、種類を限定して指定すると、重要な問題を見逃しません。
- 例外を受け止める範囲を小さくすると、読み手が意図を把握しやすくなります。
- 無視したことを戻り値などで明示すると、後の処理の判断材料になります。
