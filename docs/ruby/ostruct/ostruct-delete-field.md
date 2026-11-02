---
title: "属性を、読み書きのメソッドごと消す"
description: "OpenStruct#delete_field は、指定した属性の値と、そのアクセサのメソッドを取り除く。無いときは、ブロックの値を返すか、NameError を出す。"
language: ruby
project: "Ruby ostruct (標準ライブラリ)"
repo: https://github.com/ruby/ostruct
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "476379564ad6f752e2e4d1d9cd7ab5bff5d55fb4"
file: lib/ostruct.rb
lines: [374, 384]
function: "OpenStruct#delete_field"
difficulty: 2
format: 2
tags: ["データ構造", "API設計", "エラー処理"]
---
## ひとことで

`OpenStruct#delete_field` は、指定した **属性の値と、その読み書きのメソッドを、まとめて取り除く** メソッドです。
`person.delete_field(:name)` のあとは、`person.name` を呼ぶと、もう属性がありません。
その属性が無かったときは、ブロックの値を返すか、`NameError` を出します。

## コード

```ruby:line-numbers=374
  def delete_field(name, &block)
    sym = name.to_sym
    begin
      singleton_class.remove_method(sym, "#{sym}=")
    rescue NameError
    end
    @table.delete(sym) do
      return yield if block
      raise! NameError.new("no field '#{sym}' in #{self}", sym)
    end
  end
```

## 前提知識

- **属性とメソッド**: `OpenStruct` では、属性を追加すると、その名前のメソッドが付きます。属性を消すときは、値とメソッドの両方を消す必要があります。
- **特異クラスからメソッドを消す**: `singleton_class.remove_method` で、オブジェクトだけのメソッドを取り除きます。
- **`NameError`**: 名前が見つからないときの例外の種類です。
- **`@table.delete(キー) { ... }`**: 鍵が無かったときに、ブロックを実行します。ここでは、その場合の処理を決めています。
- **`return yield if block`**: 呼び出し側がブロックを渡していれば、その結果を、このメソッドの結果として返します。

## 何をしているか

### 1. 名前をシンボルにし、メソッドを取り除く

```ruby:line-numbers=375
    sym = name.to_sym
    begin
      singleton_class.remove_method(sym, "#{sym}=")
    rescue NameError
    end
```

`name.to_sym` で名前を変換します。そのあと、読み取りと書き込みの 2 つのメソッドを、特異クラスから取り除きます。もしメソッドが無ければ、`NameError` を無視して先へ進みます。

### 2. 表から値を削除し、無かったときの処理をする

```ruby:line-numbers=380
    @table.delete(sym) do
      return yield if block
      raise! NameError.new("no field '#{sym}' in #{self}", sym)
    end
```

内部の表 `@table` から、その鍵を削除します。鍵が無かったときは、ブロックがあればその結果を返し、無ければ `NameError` を発生させます。

## ここがすごい

### 値とメソッドを、一緒に消す

値だけ消してメソッドが残ると、読んでも `nil` が返るような、中途半端な状態になります。
2 つを同じメソッドで消すことで、属性が本当に無くなったことを保てます。

### 無かったときの扱いを、呼び出し側が選べる

ブロックを渡すと、「無ければ既定の値にする」という選択ができます。
渡さなければ、例外で知らせます。どちらを使うかは、呼び出し側の意図に任されています。

### メソッドの削除は、例外を無視する

メソッドが既に無いときは、`NameError` を飛ばします。
消したい状態が既に実現されているだけなので、エラーにする必要はありません。

## まとめ

- 属性を消すときは、値とメソッドを一緒に消すと、中途半端な状態を防げます。
- 無かったときの扱いは、ブロックで呼び出し側に選ばせると、柔軟になります。
- 既に望む状態になっている場合の例外は、無視してよいことがあります。
