---
title: "先読み・後読みで「単語の境目」に _ を差し込む underscore"
description: "\"ActiveModel::Errors\" を \"active_model/errors\" にする。大文字と小文字の並びを先読みと後読みで調べ、文字を消さずに境目へ _ を入れる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/inflector/methods.rb
lines: [113, 121]
function: "ActiveSupport::Inflector#underscore"
difficulty: 3
format: 2
tags: [正規表現, 文字列処理]
---

## ひとことで

`underscore` は、`ActiveModel` のようなキャメルケースを、`active_model` のような **小文字と `_` の形** に変換するメソッドです。
名前空間の `::` は `/` に変わるので、`underscore("ActiveModel::Errors")` は `"active_model/errors"` になります。
クラス名からファイルのパスを求める、`camelize` の逆の変換です。

## コード

```ruby:line-numbers=113
    def underscore(camel_cased_word)
      return camel_cased_word.to_s.dup unless /[A-Z-]|::/.match?(camel_cased_word)
      word = camel_cased_word.to_s.gsub("::", "/")
      word.gsub!(inflections.acronyms_underscore_regex) { "#{$1 && '_' }#{$2.downcase}" }
      word.gsub!(/(?<=[A-Z])(?=[A-Z][a-z])|(?<=[a-z\d])(?=[A-Z])/, "_")
      word.tr!("-", "_")
      word.downcase!
      word
    end
```

## 前提知識

- **`/正規表現/.match?(文字列)`**: マッチするかどうかだけを真偽値で返します。
- **`gsub("::", "/")`**: すべての `::` を `/` に置き換えた新しい文字列を返します。
- **先読み `(?=...)` と後読み `(?<=...)`**: 「この位置の後ろに〜が続く」「この位置の前に〜がある」という **条件だけ** を表し、文字そのものにはマッチしません。そのため、これだけで作った正規表現は「文字と文字の間の位置」にマッチします。
- **`tr!("-", "_")`**: 文字を 1 対 1 で置き換えます。ここでは `-` を `_` にします。
- **`downcase!`**: すべて小文字にします（自分自身を書き換えます）。
- **`"#{$1 && '_' }#{$2.downcase}"`**: `$1` があれば `_` を、なければ何も入れず、続けて `$2` を小文字にしたものをつなぎます。

## 何をしているか

### 1. 変換が要らなければすぐ返す

```ruby:line-numbers=114
      return camel_cased_word.to_s.dup unless /[A-Z-]|::/.match?(camel_cased_word)
```
大文字も `-` も `::` も含まない文字列（`"post"` など）は、すでに変換後の形なので、コピーを返して終わります。

### 2. 名前空間をパスにする

```ruby:line-numbers=115
      word = camel_cased_word.to_s.gsub("::", "/")
```
`"ActiveModel::Errors"` → `"ActiveModel/Errors"`

### 3. 登録された略語を処理する

```ruby:line-numbers=116
      word.gsub!(inflections.acronyms_underscore_regex) { "#{$1 && '_' }#{$2.downcase}" }
```
`SSL` などの略語が登録されていると、`"SSLError"` が `"ssl_error"` のように 1 単語として扱われます。

### 4. 単語の境目に _ を入れる

```ruby:line-numbers=117
      word.gsub!(/(?<=[A-Z])(?=[A-Z][a-z])|(?<=[a-z\d])(?=[A-Z])/, "_")
```
正規表現は 2 つの「位置」の条件の「または」です。

- `(?<=[A-Z])(?=[A-Z][a-z])`: 大文字の後で、「大文字＋小文字」の前。`"HTMLParser"` の `L` と `P` の間です。
- `(?<=[a-z\d])(?=[A-Z])`: 小文字か数字の後で、大文字の前。`"ActiveModel"` の `e` と `M` の間です。

`"ActiveModel/Errors"` は `"Active_Model/Errors"` に、`"HTMLParser"` は `"HTML_Parser"` になります。

### 5. 仕上げ

```ruby:line-numbers=118
      word.tr!("-", "_")
      word.downcase!
      word
```
`-` を `_` にし、全体を小文字にします。`"active_model/errors"` の完成です。

## ここがすごい

### 文字を消さずに「間」に挿入する

先読み・後読みだけでできた正規表現は、文字ではなく **位置** にマッチします。そのため `gsub!(..., "_")` は、文字を置き換えるのではなく、境目に `_` を差し込むことになります。
同じ 2 つの条件をキャプチャで `/([A-Z])([A-Z][a-z])|([a-z\d])([A-Z])/` のように書いて置き換えると、マッチした文字が「消費」されてしまいます。たとえば `"A1BCd"` では、`1B` にマッチした時点で `B` が使われてしまい、続く `B` と `C` の間の境目を見つけられず `"A1_BCd"` になります。位置にマッチさせる方法なら文字を消費しないので、境目が隣り合っていても `"A1_B_Cd"` と正しく区切れます。

### 連続した大文字の境目を正しく見つける

`"HTMLParser"` は人間なら「HTML」と「Parser」に分けます。「大文字の後に大文字＋小文字が来る位置」という 1 つ目の条件が、この **略語と次の単語の境目** を見つけています。2 つ目の条件だけだと、`"htmlparser"` のようにつながってしまいます。

### 変換不要な入力を最初に除く

最初の `return ... unless /[A-Z-]|::/.match?(...)` の判定のおかげで、すでに小文字のスネークケースの文字列には、正規表現の置換を 1 回もしません。Rails は内部で `underscore` を大量に呼ぶので、この早期リターンは効きます。

## まとめ

- 先読み `(?=...)`・後読み `(?<=...)` を使うと、文字と文字の「間」にマッチさせられます。
- 位置にマッチさせて置換すると、文字を消さずに区切り文字を挿入できます。
- 「略語の後の単語」のような境目も、大文字と小文字の並び方の条件で見つけられます。
- 変換が要らない入力を最初に返すと、全体が速くなります。
