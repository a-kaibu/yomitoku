---
title: "ハッシュの鍵を、すべて文字列に変える"
description: "Hash#stringify_keys は、シンボルの鍵を文字列に直した新しいハッシュを返す。JSON や外部の入力と形をそろえるときに使う。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/hash/keys.rb
lines: [12, 14]
function: "Hash#stringify_keys"
difficulty: 1
format: 2
tags: ["データ構造", "API設計", "イディオム"]
---
## ひとことで

`Hash#stringify_keys` は、ハッシュの **鍵をすべて文字列にした新しいハッシュ** を返すメソッドです。
`{ name: "Ann", age: 3 }` は `{ "name" => "Ann", "age" => 3 }` になります。
元のハッシュは変わりません。JSON や外部から届いたデータと、形をそろえるときに使います。

## コード

```ruby:line-numbers=12
  def stringify_keys
    transform_keys { |k| Symbol === k ? k.name : k.to_s }
  end
```

## 前提知識

- **ハッシュの鍵（キー）**: 値を探すための名前です。Ruby では、文字列の `"name"` とシンボルの `:name` は別物として扱われます。
- **シンボル**: `:name` のように、変わらない名前を表す値です。
- **`transform_keys`**: 鍵だけを、ブロックの結果に置き換えた新しいハッシュを作ります。値はそのままです。
- **`Symbol === k`**: `k` がシンボルかを調べます。`===` は「その型に当てはまるか」を判定する演算子です。
- **`k.name`**: シンボルを文字列にします。`:name.name` は `"name"` です。
- **`to_s`**: 値を文字列にします。

## 何をしているか

### 1. 鍵の種類に応じて、文字列にする

```ruby:line-numbers=13
    transform_keys { |k| Symbol === k ? k.name : k.to_s }
```

鍵がシンボルなら `name` で文字列に直し、それ以外なら `to_s` で文字列にします。文字列の鍵は、そのまま同じ文字列になります。

### 2. 新しいハッシュとして返す

このメソッドは `transform_keys` を使うので、元のハッシュには手を加えず、新しいハッシュを返します。値は変わりません。

## ここがすごい

### 変換の規則を 1 行に集める

鍵の形を変えるとき、全部の鍵を for 文で回して、新しいハッシュに入れ直すことも可能です。
`transform_keys` と 1 つのブロックに任せることで、「どう変えるか」だけを書けます。

### 元のハッシュを壊さない

Ruby には `stringify_keys!` のように元を書き換える版もあります。このメソッドは元を残すので、同じデータを別の用途にも使えます。

### 鍵の表記の違いを吸収する

Rails では、設定はシンボル、外部から届く JSON は文字列、という違いがよくあります。
このメソッドで文字列にそろえれば、比べたり、保存したりするときに迷いが減ります。

## まとめ

- ハッシュの鍵は、シンボルと文字列で別物なので、扱う前にどちらかにそろえると安心です。
- `transform_keys` を使うと、鍵だけを変える処理を短く書けます。
- 元を書き換えない版を選ぶと、他の場所に影響を与えずに済みます。
