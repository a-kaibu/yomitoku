---
title: "空でないときだけ値を使う、presence"
description: "Object#presence は、blank? でなければ自分自身を返し、空なら nil を返す。「値があるときだけ使う」を 1 行で書ける。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/object/blank.rb
lines: [58, 60]
function: "Object#presence"
difficulty: 1
format: 2
tags: ["イディオム", "API設計", "防御的プログラミング"]
---
## ひとことで

`Object#presence` は、値が **空でなければ自分自身を返し、空なら `nil` を返す** メソッドです。
`name.presence || "匿名"` のように書くと、空文字列や空の配列のときだけ既定値を使えます。
「値があるときだけ使う」という処理を、1 語で表します。

## コード

```ruby:line-numbers=58
  def presence
    self if present?
  end
```

## 前提知識

- **`blank?`**: 値が「空」かを調べるメソッドです。`nil`、空文字列、空白だけの文字列、空の配列やハッシュが該当します。
- **`present?`**: `blank?` の反対です。空でなければ `true` になります。
- **`self if 条件`**: 条件が真のときだけ、自分を返します。偽なら `nil` になります。
- **`||`（または）**: 左の値が偽や `nil` なら、右の値を使います。
- **Ruby の真偽**: `nil` と `false` だけが偽です。空文字列や 0 は真なので、`||` では空かどうか判定できません。

## 何をしているか

### 1. 空でなければ、自分を返す

```ruby:line-numbers=59
    self if present?
```

`present?` が真なら、`self` を返します。つまり、そのまま値として使えます。

### 2. 空なら、`nil` を返す

`present?` が偽のときは、`self if` の結果が `nil` になります。`nil` は `||` で既定値に置き換えられるので、既定値を続けて書けます。

## ここがすごい

### `||` の弱点を補う

Ruby の `||` は、`nil` と `false` だけを「ない」とみなします。
フォームの入力のように、空文字列が「入力なし」を意味するときは、`||` では足りません。
`presence` を挟むと、空文字列も「ない」として扱えます。

### 1 つのメソッドで、型を問わない

文字列、配列、ハッシュなど、`blank?` を持つものなら何にでも使えます。
型ごとに空かどうかの判定を書き分ける必要がありません。

### 連鎖しやすい

`params[:name].presence || default_name` のように、途中の値の存在を確かめながら、既定値へ流せます。
読み手は、「空なら既定値」という意図を、左から右へ読んで理解できます。

## まとめ

- 「空なら既定値」は、`presence` と `||` を組み合わせると簡潔に書けます。
- Ruby の `||` は空文字列を「ない」とみなさないので、空かどうかは `blank?` で判定します。
- 型に関係なく空を判定できるメソッドは、入力の検査を統一する助けになります。
