---
title: "委譲先のメソッドと、自分のメソッドを合わせて返す"
description: "Delegator#methods は、包んでいるオブジェクトのメソッド一覧と、自分自身のメソッド一覧を合わせて返す。委譲しているように見せるための小さな定義。"
language: ruby
project: "Ruby delegate (標準ライブラリ)"
repo: https://github.com/ruby/delegate
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "fb03e83ac2941188eb7748cfaba20bdc2fd8f122"
file: lib/delegate.rb
lines: [132, 134]
function: "Delegator#methods"
difficulty: 2
format: 2
tags: ["メタプログラミング", "API設計", "データ構造"]
---
## ひとことで

`Delegator#methods` は、委譲している（包んでいる）オブジェクトが持つメソッドの一覧と、**委譲するオブジェクト自身が持つメソッドの一覧を合わせて返す** メソッドです。
`SimpleDelegator.new("abc").methods` には、文字列のメソッドと、`SimpleDelegator` 自身のメソッドの両方が含まれます。
外から見ると、包まれたオブジェクトと同じように振る舞えることを示します。

## コード

```ruby:line-numbers=132
  def methods(all=true)
    __getobj__.methods(all) | super
  end
```

## 前提知識

- **委譲（Delegator）**: あるオブジェクトが、ほかのオブジェクトの仕事を任せる仕組みです。`SimpleDelegator` は、その代表的な例です。
- **`__getobj__`**: 委譲されている先のオブジェクトを返すメソッドです。
- **`super`**: 同じ名前の親のメソッドを呼び出します。ここでは、`Delegator` 自身の `methods` の処理を指します。
- **集合の和（`|`）**: 2 つの配列を合わせて、重複を除いた配列にします。
- **`all` 引数**: `true` なら、継承したものも含めてすべてのメソッドを返します。

## 何をしているか

### 1. 委譲先のメソッドを取り出す

```ruby:line-numbers=133
    __getobj__.methods(all) | super
```

`__getobj__.methods(all)` で、包まれたオブジェクトのメソッド名の配列を取り出します。引数 `all` は、そのまま渡されます。

### 2. 自分自身のメソッドと合わせる

```ruby:line-numbers=133
    __getobj__.methods(all) | super
```

`| super` で、`Delegator` 自身のメソッドの配列と合わせ、重複を取り除いた配列を返します。呼び出し側は、1 つの一覧として見られます。

## ここがすごい

### 委譲の見た目を、一覧にも反映する

`respond_to?` と同じように、`methods` も委譲先の内容を映します。
利用者がオブジェクトを調べたとき、委譲先のメソッドも見えるので、内部で何が起きているかが分かりやすくなります。

### 集合の和で、重複を除く

委譲先と自分の両方に、同じ名前のメソッドがあるかもしれません。
`|` で合わせると、重複が自然に消えるので、後始末をしなくてよくなります。

### `super` で、自分の仕事を残す

委譲先のメソッドだけを返すと、`Delegator` 自身のメソッドが隠れてしまいます。
`super` を使うことで、両方を合わせた結果を返せます。

## まとめ

- 委譲のオブジェクトは、メソッドの一覧も委譲先に合わせると、見た目が自然になります。
- 2 つの一覧を合わせるときは、集合の和を使うと重複が消えます。
- 親のメソッドを `super` で呼ぶと、自分の振る舞いを残したまま、足し算ができます。
