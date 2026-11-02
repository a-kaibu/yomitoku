---
title: "\"Foo::Bar::Baz\" から \"Foo(::Bar(::Baz)?)?\" を組み立てる"
description: "定数名の「前の方だけ一致」を探せる正規表現の文字列を作る内部メソッド。配列を逆順にして inject で内側から包んでいく。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/inflector/methods.rb
lines: [411, 421]
function: "ActiveSupport::Inflector#const_regexp"
difficulty: 3
format: 2
tags: [正規表現, 関数型, メタプログラミング]
---

## ひとことで

`const_regexp` は、`"Foo::Bar::Baz"` のような定数名から、**先頭から途中までの一致も許す正規表現** の文字列 `"Foo(::Bar(::Baz)?)?"` を作る内部メソッドです。
この正規表現は `Foo`、`Foo::Bar`、`Foo::Bar::Baz` のどれにもマッチします。
Rails が定数の読み込みに失敗したとき、「どこまでの名前が見つからなかったのか」を判断するために使われます。

## コード

```ruby:line-numbers=411
      def const_regexp(camel_cased_word)
        parts = camel_cased_word.split("::")

        return Regexp.escape(camel_cased_word) if parts.empty?

        last = parts.pop

        parts.reverse!.inject(last) do |acc, part|
          part.empty? ? acc : "#{part}(::#{acc})?"
        end
      end
```

## 前提知識

- **`split("::")`**: 文字列を `::` で区切った配列にします。`"Foo::Bar::Baz"` は `["Foo", "Bar", "Baz"]`、`"::"` は `[]`（空の配列）です。
- **`Regexp.escape`**: 正規表現で特別な意味を持つ文字（`.` や `:` など）をエスケープします。
- **`pop`**: 配列の最後の要素を取り除いて返します。
- **`reverse!`**: 配列を逆順にします（自分自身を書き換えて、自分を返します）。
- **`inject(初期値) { |acc, x| ... }`**: 配列の要素を順に取り出し、`acc`（ここまでの結果）と組み合わせて新しい結果を作ることを繰り返します。最後の結果が戻り値です（`reduce` とも呼ばれます）。
- **`(...)?`**: 正規表現で「このグループはあってもなくてもよい」という意味です。

## 何をしているか

### 1. 部品に分ける

```ruby:line-numbers=412
        parts = camel_cased_word.split("::")

        return Regexp.escape(camel_cased_word) if parts.empty?
```
`"Foo::Bar::Baz"` は `["Foo", "Bar", "Baz"]` になります。`"::"` のように中身のない名前なら、エスケープしてそのまま返します。

### 2. 最後の部品を種にする

```ruby:line-numbers=416
        last = parts.pop
```
`last = "Baz"`、`parts = ["Foo", "Bar"]` です。

### 3. 内側から包んでいく

```ruby:line-numbers=418
        parts.reverse!.inject(last) do |acc, part|
          part.empty? ? acc : "#{part}(::#{acc})?"
        end
```
`parts` を逆順の `["Bar", "Foo"]` にして、`inject("Baz")` で処理します。

1. `acc = "Baz"`、`part = "Bar"` → `"Bar(::Baz)?"`
2. `acc = "Bar(::Baz)?"`、`part = "Foo"` → `"Foo(::Bar(::Baz)?)?"`

`"::Foo"` のように先頭が `::` の名前では、`split` の結果の先頭が空文字になります。そのときは `part.empty? ? acc : ...` によって何も包まずに `acc` をそのまま返します。

## ここがすごい

### 入れ子の正規表現を「畳み込み」で作る

`(::Bar(::Baz)?)?` のように括弧が入れ子になる文字列を、ループと文字列の連結で作ろうとすると、閉じ括弧の数を数えるなど面倒です。
**いちばん内側（最後の部品）から始めて、外側の部品で 1 段ずつ包む** と考えれば、`inject` 1 回で自然に作れます。逆順にしているのは、内側から外側へ処理するためです。

### 正規表現を文字列で返す

コード中のコメントにあるように、戻り値を `Regexp` ではなく文字列にしています。呼び出し側で `/\A#{const_regexp(name)}\z/` のように、ほかの正規表現に埋め込みやすくするためです。

### 前方一致の判定に使える

`"Foo::Bar::Baz"` を読み込もうとして「`Foo::Bar` が見つからない」というエラーが出たとき、そのエラーの名前がこの正規表現にマッチすれば、「探していた名前の途中が見つからなかった」と判断できます。関係ない別の定数のエラーと区別できるわけです。

## まとめ

- 入れ子の構造は「内側から外側へ包む」と考えると、`inject`（畳み込み）で簡単に作れます。
- 外側から順に並んだ配列は、`reverse` すれば内側から処理できます。
- 正規表現を文字列として返すと、ほかの正規表現に埋め込んで再利用しやすくなります。
