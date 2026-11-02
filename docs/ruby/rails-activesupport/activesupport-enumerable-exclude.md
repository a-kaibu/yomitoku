---
title: "include? の反対を、読みやすく書く"
description: "Enumerable#exclude? は、include? の結果を反対にしたものを返す。「含まれていない」を、否定の二重を避けて書ける。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [127, 129]
function: "Enumerable#exclude?"
difficulty: 1
format: 2
tags: ["イディオム", "API設計", "イテレータ"]
---
## ひとことで

`Enumerable#exclude?` は、`include?` の答えを反対にした **「含まれていないか」** を返すメソッドです。
`roles.exclude?(:admin)` は、`roles` に `:admin` が無ければ `true` になります。
`!roles.include?(:admin)` と同じ意味ですが、読み手が否定の意図を一目で読み取れます。

## コード

```ruby:line-numbers=127
  def exclude?(object)
    !include?(object)
  end
```

## 前提知識

- **`Enumerable`**: 配列、範囲、ハッシュなど「要素を順に取り出せるもの」が持つ共通のメソッドの集まりです。
- **`include?`**: 要素が含まれているかを調べて、真偽値を返します。
- **`!`（否定）**: 真なら偽、偽なら真にします。
- **メソッドの委譲**: `exclude?` の中で `include?` を呼ぶ、つまり既存のメソッドを土台にして新しい名前を与える書き方です。

## 何をしているか

### 1. 含まれているかを調べる

```ruby:line-numbers=128
    !include?(object)
```

`include?(object)` で、要素が含まれているかを調べます。ここでは、判定をそのまま使います。

### 2. 結果を反対にして返す

```ruby:line-numbers=128
    !include?(object)
```

`!` で結果を反対にして返します。含まれていれば `false`、含まれていなければ `true` です。

## ここがすごい

### 否定の二重を避ける

`!list.include?(x)` は、文の中に否定が入ります。`if !list.include?(x)` と書くと、少し読みにくくなります。
`if list.exclude?(x)` と書けば、「除外しているかどうか」という意図を直接読めます。

### 既存の判定をそのまま使う

新しい判定方法を作らず、`include?` の結果を反対にするだけです。
`include?` を持つすべてのコレクションで、同じ振る舞いになります。

### 読みやすさを優先した追加

Ruby の標準には `exclude?` がありませんが、Rails はよく使う否定形を追加して、コードを自然な英語に近づけています。

## まとめ

- 否定の判定は、専用の名前を付けると読みやすくなります。
- 既存のメソッドを土台にすると、動きが一貫して保たれます。
- 読み手が意図を一目で理解できることは、小さなメソッドでも大切です。
