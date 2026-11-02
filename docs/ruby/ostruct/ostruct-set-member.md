---
title: "名前を後から決めて、属性を追加する"
description: "OpenStruct の []= は、名前を Symbol に直してから、未知の属性なら先に登録し、値を内部の表に保存する。"
language: ruby
project: "Ruby ostruct (標準ライブラリ)"
repo: https://github.com/ruby/ostruct
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "476379564ad6f752e2e4d1d9cd7ab5bff5d55fb4"
file: lib/ostruct.rb
lines: [321, 325]
function: "OpenStruct#[]="
difficulty: 2
format: 2
tags: ["データ構造", "メタプログラミング", "API設計"]
---
## ひとことで

`OpenStruct#[]=` は、`person[:age] = 42` のように **名前を指定して属性へ値を入れる** メソッドです。
名前は必ず `Symbol`（記号名）に直し、まだ無い属性なら先にアクセス用のメソッドを作ります。
そのあと、値を内部の表（`@table`）に保存します。

## コード

```ruby:line-numbers=321
  def []=(name, value)
    name = name.to_sym
    new_ostruct_member!(name)
    @table[name] = value
  end
```

## 前提知識

- **`OpenStruct`**: 名前と値を自由に追加できる、箱のようなオブジェクトです。`person.name` のように、属性名がメソッドのように使えます。
- **`Symbol`（シンボル）**: `:age` のように、変わらない名前を表す値です。同じ名前の `Symbol` は、同じオブジェクトになります。
- **`to_sym`**: 文字列を `Symbol` に変換します。
- **`@table`**: 属性の名前と値を保存しておく、ハッシュのインスタンス変数です。
- **`alias_method`**: 同じメソッドに別の名前を付けます。ここでは内部用に `set_ostruct_member_value!` を作っています。
- **`private`**: 外からは呼べないメソッドにします。

## 何をしているか

### 1. 名前を Symbol に直す

```ruby:line-numbers=322
    name = name.to_sym
```

`"age"` でも `:age` でも、同じ属性として扱えるように、まず `Symbol` に変換します。

### 2. 属性がまだ無ければ、メソッドを用意する

```ruby:line-numbers=323
    new_ostruct_member!(name)
```

`new_ostruct_member!` は、その名前のための読み書き用のメソッドを、このオブジェクトに定義します。すでにあれば、何もしません。

### 3. 値を内部の表に保存する

```ruby:line-numbers=324
    @table[name] = value
```

値は `@table` に、`Symbol` の名前をキーにして保存します。`person.age` のような読み取りは、この表から値を取り出します。

## ここがすごい

### 「メソッドを後から作る」を、同じ入口にまとめる

`person.age = 42` と `person[:age] = 42` は、どちらも同じ処理を通ります。
利用者は、どちらの書き方でも、新しい属性を自由に足せます。

### 名前を統一してから、表に入れる

`"age"` と `:age` を別々の属性として扱うと、同じ値が 2 つに分かれてしまいます。
`to_sym` で名前を 1 つの形にそろえることで、この問題を防いでいます。

### 初回だけメソッドを作る

属性をいちいち定義せず、必要になったときにだけ作るので、使わない名前のために無駄なメソッドを増やしません。

## まとめ

- 名前を指定する書き方は、内部では `Symbol` にそろえると、表記の違いで壊れません。
- 動的に増える属性は、必要になったときに定義すると、無駄を減らせます。
- 同じ処理をする入口をまとめると、書き方が変わっても同じ結果になります。
