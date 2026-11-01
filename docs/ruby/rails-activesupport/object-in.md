---
title: "引数側に問い合わせる逆向きの include? ── Object#in?"
description: "x.in?(list) で「x は list に含まれるか」を調べる。Range なら cover? を使い、include? を持たない引数には分かりやすいエラーを出す。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/object/inclusion.rb
lines: [19, 28]
function: "Object#in?"
difficulty: 1
tags: [可読性, エラー処理, API設計]
---

## ひとことで

`in?` は、`x.in?(collection)` の形で **「x は collection に含まれるか」** を調べるメソッドです。
`1.in?([1, 2])` は `true`、`"lo".in?("hello")` も `true`、`25.in?(18..30)` も `true` です。
`[1, 2].include?(1)` と同じことを、主語を入れ替えて書けるようにしたものです。

## コード

```ruby:line-numbers=19
  def in?(another_object)
    case another_object
    when Range
      another_object.cover?(self)
    else
      another_object.include?(self)
    end
  rescue NoMethodError
    raise ArgumentError.new("The parameter passed to #in? must respond to #include?")
  end
```

## 前提知識

- **`case ... when クラス`**: `when Range` は「値が Range（範囲）のオブジェクトなら」という意味です。内部では `Range === 値` が使われます。
- **Range（範囲）**: `18..30` は「18 から 30 まで」を表すオブジェクトです。
- **`include?` と `cover?`**: Range の `include?` は「その値が範囲の要素に含まれるか」、`cover?` は「その値が始まりと終わりの間にあるか」を比較だけで調べます。
- **メソッド全体の `rescue`**: `def ... rescue ... end` のように、メソッド本体の最後に `rescue` を書くと、メソッドのどこで例外が起きても受け止められます（`begin` を省略できます）。
- **`NoMethodError`**: 存在しないメソッドを呼んだときの例外です。

## 何をしているか

### 1. Range のときは cover?（21〜22 行目）

`25.in?(18..30)` は `(18..30).cover?(25)` になり、`18 <= 25 && 25 <= 30` の比較だけで `true` を返します。

### 2. それ以外は include?（23〜24 行目）

配列、ハッシュ、文字列、Set など、`include?` を持つものなら何でも使えます。`"lo".in?("hello")` は `"hello".include?("lo")` です。

### 3. include? がなければ説明付きのエラー（26〜27 行目）

`1.in?(5)` のように、整数（`include?` を持たない）を渡すと `NoMethodError` が起きます。それを受け止めて、「`#in?` の引数は `#include?` を持つ必要があります」という `ArgumentError` に変換します。

## ここがすごい

### 読む順番で書ける

`if [:admin, :owner].include?(user.role)` は、英語として読むと「リストが役割を含むなら」で、主語がリストになります。`if user.role.in?([:admin, :owner])` なら「役割が admin か owner なら」と、**考える順番どおり** に読めます。中身は同じでも、読みやすさのためだけにメソッドを用意しているのが Rails らしいところです。

### Range では cover? を選ぶ

Range の `include?` は、範囲の種類によっては要素を 1 つずつ数え上げることがあり、時刻や文字列の範囲だと遅かったり、思わぬ結果になったりします。`cover?` は両端との比較 2 回だけで判定できるので、速く、意図どおりに動きます。

### エラーメッセージを使う人向けに直す

`NoMethodError: undefined method 'include?' for 5` というエラーでは、`in?` を呼んだ人は「なぜ include? が出てくるのか」と戸惑います。内部の事情を隠し、**呼んだメソッドの言葉で** 原因を伝えています。

## まとめ

- 同じ判定でも、主語を入れ替えるだけで読みやすくなることがあります。
- 範囲に含まれるかは `cover?`（比較だけ）で調べると速く確実です。
- 内部で起きたエラーを、使う人に分かる言葉のエラーに変換すると親切です。
- `def` の本体に直接 `rescue` を書くと、`begin` なしで例外を受け止められます。
