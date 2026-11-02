---
title: "ネストした属性を、鍵の列でたどって取り出す"
description: "OpenStruct#dig は、属性名とそれ以降の鍵の列をたどって、入れ子になった値を取り出す。途中で値がなければ nil を返す。"
language: ruby
project: "Ruby ostruct (標準ライブラリ)"
repo: https://github.com/ruby/ostruct
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "476379564ad6f752e2e4d1d9cd7ab5bff5d55fb4"
file: lib/ostruct.rb
lines: [343, 350]
function: "OpenStruct#dig"
difficulty: 2
format: 2
tags: ["データ構造", "API設計", "防御的プログラミング"]
---
## ひとことで

`OpenStruct#dig` は、属性名から始めて、**その先に続く鍵の列をたどって、入れ子になった値を取り出す** メソッドです。
`person.dig(:address, "zip")` は、`address` の中の `zip` の値を返します。
途中のどこかに値が無ければ、`nil` を返します。

## コード

```ruby:line-numbers=343
  def dig(name, *names)
    begin
      name = name.to_sym
    rescue NoMethodError
      raise! TypeError, "#{name} is not a symbol nor a string"
    end
    @table.dig(name, *names)
  end
```

## 前提知識

- **`dig`**: 入れ子になったハッシュや配列を、鍵や番号の列でたどって値を取り出すメソッドです。途中で `nil` になれば、そこで止まります。
- **`OpenStruct` の内部の表（`@table`）**: 属性の値を保存する、ハッシュです。
- **`to_sym`**: 文字列を、シンボルに変えます。
- **`begin ... rescue NoMethodError ... end`**: 特定の例外が起きたときだけ、代わりの処理をする書き方です。
- **可変長引数 `*names`**: 残りの鍵を、いくつでも配列で受け取ります。

## 何をしているか

### 1. 最初の名前を、シンボルに変える

```ruby:line-numbers=344
    begin
      name = name.to_sym
    rescue NoMethodError
      raise! TypeError, "#{name} is not a symbol nor a string"
    end
```

`name.to_sym` で名前を変換します。変換できない（`to_sym` を持たない）値なら、型のエラーとして例外を出します。

### 2. 内部の表から、続く鍵をたどる

```ruby:line-numbers=349
    @table.dig(name, *names)
```

`@table.dig(name, *names)` で、名前とそれ以降の鍵を使って、入れ子の値を取り出します。途中で値が無ければ、`nil` になります。

## ここがすごい

### 入れ子の値を、1 行でたどれる

`person.address.zip` と書くと、途中の `address` が `nil` のときに例外になります。
`dig` を使えば、途中の欠けを `nil` として扱えます。

### 内部の仕組みに、たどる処理を任せる

`@table` は通常のハッシュなので、その `dig` をそのまま使えます。
新しい探索の規則を書かず、既存の仕組みを再利用しています。

### 型の誤りを、わかりやすい例外にする

名前が文字列でも、シンボルでもない値は、`TypeError` で拒否されます。
元の例外メッセージを、利用者に分かりやすい形に整えています。

## まとめ

- 入れ子の値は、途中で `nil` になっても安全にたどれる `dig` を使うと、書きやすくなります。
- 内部のデータ構造が持つ仕組みを使うと、新しい規則を書かずに済みます。
- 型の誤りは、どの値が悪いのかが分かる例外で知らせると、原因を見つけやすくなります。
