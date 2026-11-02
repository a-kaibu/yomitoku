---
title: "文字列の鍵を、シンボルに直して扱いやすくする"
description: "Hash#symbolize_keys は、to_sym できる鍵をすべてシンボルに直した新しいハッシュを返す。直せない鍵は、そのまま残す。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/hash/keys.rb
lines: [31, 34]
function: "Hash#symbolize_keys"
difficulty: 1
format: 2
tags: ["データ構造", "API設計", "防御的プログラミング"]
---
## ひとことで

`Hash#symbolize_keys` は、ハッシュの **鍵をシンボルに変えた新しいハッシュ** を返すメソッドです。
`{ "name" => "Ann" }` は `{ name: "Ann" }` になります。
シンボルに直せない鍵は、そのまま残します。`alias to_options` があるので、オプションの受け取りでもよく使われます。

## コード

```ruby:line-numbers=31
  def symbolize_keys
    transform_keys { |key| key.to_sym rescue key }
  end
  alias_method :to_options,  :symbolize_keys
```

## 前提知識

- **シンボル**: `:name` のように、名前を表す変わらない値です。
- **`to_sym`**: 文字列をシンボルに変えます。`"name".to_sym` は `:name` です。
- **`rescue` の修飾子**: `式 rescue 代わりの値` の形で、式でエラーが出たら代わりの値を使います。
- **`alias_method`**: 同じメソッドに、別の名前を付けます。
- **`transform_keys`**: 鍵だけを、ブロックの結果で置き換えた新しいハッシュを作ります。

## 何をしているか

### 1. 鍵をシンボルにしようとする

```ruby:line-numbers=32
    transform_keys { |key| key.to_sym rescue key }
```

各鍵に `to_sym` を呼びます。文字列はシンボルになり、もともとシンボルの鍵はそのままです。

### 2. 変換できない鍵は、そのまま残す

```ruby:line-numbers=32
    transform_keys { |key| key.to_sym rescue key }
```

`rescue key` の部分は、`to_sym` を持たない鍵（整数や `nil` など）でエラーになったとき、元の鍵を使うという意味です。ハッシュ全体が失敗しないようにしています。

### 3. 別名 `to_options` を付ける

```ruby:line-numbers=34
  alias_method :to_options,  :symbolize_keys
```

同じ処理を、`to_options` という名前でも呼べるようにしています。オプションを受け取るメソッドで、読みやすい名前として使えます。

## ここがすごい

### 失敗を鍵ごとに閉じ込める

すべての鍵を変換しようとして、1 つの鍵の失敗で全体が止まると、呼び出し側が困ります。
このメソッドは、変換できない鍵だけを残して、ほかは変換を続けます。

### 「文字列でもシンボルでも受け取れる」入口

設定ファイルや HTTP から届いた値は、文字列の鍵のことが多いです。
入口でこのメソッドを通せば、そのあとの処理はシンボルの鍵だけを前提に書けます。

### 別名で意図を伝える

`to_options` という名前は、「オプションを表す形にする」という目的を伝えます。
同じ処理でも、名前を変えることで読み手の理解が変わります。

## まとめ

- 外から届く鍵はシンボルにそろえると、内部の処理が単純になります。
- 変換できないものは、例外で止めずに残すと、データの欠落を防げます。
- 同じ処理に目的を表す別名を付けると、読みやすくなります。
