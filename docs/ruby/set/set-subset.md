---
title: "部分集合かどうかを、相手の型で速さを変えて調べる"
description: "Set#subset? は、引数の集合が同じ種類なら内部のハッシュの比較を使い、そうでなければ要素を 1 つずつ確かめる。集合以外は例外にする。"
language: ruby
project: "Ruby set (標準ライブラリ)"
repo: https://github.com/ruby/set
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002-2024 Akinori MUSHA <knu@iDaemons.org>"
commit: "0801252fbc76d6fc3eab694e7790a4ca72271552"
file: lib/set.rb
lines: [431, 440]
function: "Set#subset?"
difficulty: 2
format: 2
tags: ["データ構造", "API設計", "最適化"]
---
## ひとことで

`Set#subset?` は、この集合が **引数の集合の部分集合**（すべての要素が含まれている）かを調べるメソッドです。
`Set[1, 2].subset?(Set[1, 2, 3])` は `true` になります。
引数が集合でないときは、`ArgumentError` を出します。

## コード

```ruby:line-numbers=431
  def subset?(set)
    case
    when set.instance_of?(self.class) && @hash.respond_to?(:<=)
      @hash <= set.instance_variable_get(:@hash)
    when set.is_a?(Set)
      size <= set.size && all?(set)
    else
      raise ArgumentError, "value must be a set"
    end
  end
```

## 前提知識

- **部分集合**: ある集合の要素が、すべて別の集合にも含まれている関係です。同じ集合も部分集合とみなされます。
- **`case` 式（条件なし）**: `case` の後に `when 条件` を並べると、最初に真になった枝を実行します。
- **`instance_of?`**: オブジェクトが、そのクラスそのものかを調べます。サブクラスは含みません。
- **`respond_to?(:<=)`**: 比較の演算子 `<=` を持つかを調べます。内部のハッシュが、部分集合の比較を持つかを確かめるために使われます。
- **`instance_variable_get`**: 他のオブジェクトの、インスタンス変数の値を取り出します。

## 何をしているか

### 1. 同じ種類の集合なら、内部のハッシュで比べる

```ruby:line-numbers=433
    when set.instance_of?(self.class) && @hash.respond_to?(:<=)
      @hash <= set.instance_variable_get(:@hash)
```

引数も同じクラスの集合で、内部のハッシュが `<=` を持つなら、そのハッシュどうしの部分集合の比較を使います。内部の仕組みに任せるので、速く判定できます。

### 2. 別の集合なら、サイズと要素の包含で比べる

```ruby:line-numbers=435
    when set.is_a?(Set)
      size <= set.size && all?(set)
```

引数が `Set` なら、要素数が少ないことと、すべての要素が含まれていることを確かめます。

### 3. 集合でなければ、例外にする

```ruby:line-numbers=437
    else
      raise ArgumentError, "value must be a set"
```

それ以外の値は、集合として比べられないので、`ArgumentError` を出します。

## ここがすごい

### 同じ種類なら、内部の仕組みを使う

同じクラスの集合どうしなら、中のハッシュ同士を比べる、もっと速い方法が使えます。
速さを上げる分岐を、先頭の条件に置いています。

### 条件を `case` の中に並べて、読みやすくする

「同じ種類の場合」「集合の場合」「それ以外」という 3 つの場合を、上から順に書いています。
読み手は、どの場合にどの比較を使うかを、順番に追えます。

### 不正な入力を、はっきり拒否する

集合でない値を比べようとすると、誤った答えを返すよりも、例外で止める方が安全です。
エラーメッセージで、何が求められているかを伝えています。

## まとめ

- 比較の方法は、入力の種類に応じて切り替えると、速さと正しさを両立できます。
- 同じ種類なら内部の仕組みに任せると、実装の詳細を再利用できます。
- 想定外の入力は、早く例外にすると、誤った結果を防げます。
