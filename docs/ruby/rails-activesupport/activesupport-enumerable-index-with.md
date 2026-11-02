---
title: "要素をキーにした、ハッシュを一度に作る"
description: "Enumerable#index_with は、要素をそのままキーにしたハッシュを作る。ブロックで値を決めるか、既定値を全部に入れるか、列挙子を返すかを切り替える。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [85, 93]
function: "Enumerable#index_with"
difficulty: 2
format: 2
tags: ["データ構造", "イテレータ", "API設計"]
---
## ひとことで

`Enumerable#index_with` は、要素を **そのまま鍵にしたハッシュ** を作るメソッドです。
ブロックを渡すと、各要素に対応する値をブロックが決めます。
`%w[a b].index_with { |s| s.upcase }` は `{ "a" => "A", "b" => "B" }` になります。

## コード

::: code-group

```ruby:line-numbers=85 [日本語訳]
  def index_with(default = (no_default = true))
    if block_given?
      to_h { |elem| [elem, yield(elem)] } # rubocop の警告を、この行だけ無効にする（Rails/IndexWith）
    elsif no_default
      to_enum(:index_with) { size if respond_to?(:size) }
    else
      to_h { |elem| [elem, default] } # rubocop の警告を、この行だけ無効にする（Rails/IndexWith）
    end
  end
```

```ruby:line-numbers=85 [原文]
  def index_with(default = (no_default = true))
    if block_given?
      to_h { |elem| [elem, yield(elem)] } # rubocop:disable Rails/IndexWith
    elsif no_default
      to_enum(:index_with) { size if respond_to?(:size) }
    else
      to_h { |elem| [elem, default] } # rubocop:disable Rails/IndexWith
    end
  end
```

:::

## 前提知識

- **ハッシュ**: 鍵と値の対応表です。鍵から値をすぐに取り出せます。
- **`to_h`**: 配列などを、`[鍵, 値]` の組の並びとしてハッシュに変えます。ブロックを渡すと、各要素から組を作れます。
- **`to_enum`**: ブロックなしで呼ばれたとき、あとで繰り返せる列挙子を返します。
- **`block_given?`**: メソッドにブロックが渡されたかを調べます。
- **`rubocop:disable`**: 静的解析ツールの警告を、その行だけ無効にする指示です。

## 何をしているか

### 1. ブロックがあれば、値をブロックで決める

::: code-group

```ruby:line-numbers=86 [日本語訳]
    if block_given?
      to_h { |elem| [elem, yield(elem)] } # rubocop の警告を、この行だけ無効にする（Rails/IndexWith）
```

```ruby:line-numbers=86 [原文]
    if block_given?
      to_h { |elem| [elem, yield(elem)] } # rubocop:disable Rails/IndexWith
```

:::

ブロックがあるときは、各要素 `elem` を鍵に、`yield(elem)` の結果を値にした組を作り、ハッシュにします。

### 2. ブロックがなければ、列挙子を返す

```ruby:line-numbers=88
    elsif no_default
      to_enum(:index_with) { size if respond_to?(:size) }
```

値が何も指定されていなければ、`to_enum` で列挙子を返します。あとから `.with` のように値の決め方を渡せる形を保ちます。

### 3. 既定値があれば、全部に同じ値を入れる

::: code-group

```ruby:line-numbers=90 [日本語訳]
    else
      to_h { |elem| [elem, default] } # rubocop の警告を、この行だけ無効にする（Rails/IndexWith）
```

```ruby:line-numbers=90 [原文]
    else
      to_h { |elem| [elem, default] } # rubocop:disable Rails/IndexWith
```

:::

既定値が渡されたときは、すべての要素に同じ値を入れます。

## ここがすごい

### 3 つの使い方を 1 つのメソッドにまとめる

ブロックで値を決める、値を全部同じにする、何も渡さず次の処理に任せる、という 3 つの使い方を、引数の有無で切り替えています。
利用者は、目的に合った形を、同じ名前で書けます。

### 列挙子を返して、遅延させる

ブロックがないとき、すぐ計算せずに列挙子を返すと、後の処理で必要になったときだけ値を作れます。
大きなコレクションでも、無駄な計算を避けられます。

### 警告を理由つきで無効にする

`rubocop:disable` の行は、`index_with` という名前の意図的な使い方を、静的解析から除外しています。
そのための理由が、名前（`Rails/IndexWith`）で示されています。

## まとめ

- 要素からハッシュを作るときは、値の決め方を引数やブロックで選ぶと、使い道が広がります。
- ブロックがないときは列挙子を返すと、後から値を指定できる柔軟な API になります。
- 意図的に警告を外すときは、その理由が分かる形で残すと、後の人が判断しやすくなります。
