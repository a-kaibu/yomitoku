---
title: "Rails.env.production? を実現する method_missing の魔法"
description: "文字列に「〇〇?」と聞くと、自分が \"〇〇\" かどうかを答える StringInquirer。存在しないメソッドの呼び出しを捕まえて比較に変える。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/string_inquirer.rb
lines: [30, 43]
function: "ActiveSupport::StringInquirer#method_missing"
difficulty: 2
format: 2
tags: [メタプログラミング, 可読性, 文字列処理]
---

## ひとことで

`StringInquirer` は、文字列に **「あなたは production ですか？」と問い合わせられる** ようにするクラスです。
`env = ActiveSupport::StringInquirer.new("production")` とすると、`env.production?` は `true`、`env.development?` は `false` になります。
Rails でおなじみの `Rails.env.production?` は、この仕組みで動いています。

## コード

```ruby:line-numbers=30
  class StringInquirer < String
    private
      def respond_to_missing?(method_name, include_private = false)
        method_name.end_with?("?") || super
      end

      def method_missing(method_name, ...)
        if method_name.end_with?("?")
          self == method_name[0..-2]
        else
          super
        end
      end
  end
```

## 前提知識

- **継承 `< String`**: `StringInquirer` は `String` を継承しているので、ふつうの文字列として比較や表示ができます。
- **`method_missing`**: Ruby では、オブジェクトに存在しないメソッドを呼ぶと、最後の手段として `method_missing` が呼ばれます。第 1 引数に呼ばれたメソッド名（シンボル）が入ります。ここで独自の処理をすれば、定義していないメソッドにも応答できます。
- **`super`**: 親クラスの同じ名前のメソッドを呼びます。`method_missing` で `super` すると、通常どおり `NoMethodError` になります。
- **`...`**: 受け取った残りの引数（とブロック）をすべてそのまま転送するための書き方です。
- **`respond_to_missing?`**: `respond_to?(:production?)` と聞かれたとき、`method_missing` で応答できるメソッドについて `true` を返すためのメソッドです。
- **`method_name[0..-2]`**: 最後の 1 文字を除いた部分です。シンボルにも `[]` が使え、`:production?[0..-2]` は `"production"` になります。

## 何をしているか

### 1. 「?」で終わるメソッドを捕まえる

```ruby:line-numbers=36
      def method_missing(method_name, ...)
        if method_name.end_with?("?")
```
`env.production?` を呼ぶと、`StringInquirer` にも `String` にも `production?` は定義されていないので、`method_missing(:production?)` が呼ばれます。名前が `?` で終わっているので、次の処理に進みます。

### 2. 自分と比べる

```ruby:line-numbers=38
          self == method_name[0..-2]
```
`:production?` から最後の `?` を取った `"production"` と、自分自身（`"production"`）を比べます。等しいので `true` です。
`env.development?` なら `"development"` と比べて `false` になります。

### 3. それ以外は通常どおり失敗させる

```ruby:line-numbers=39
        else
          super
        end
```
`env.foo` のように `?` で終わらない名前なら `super` に任せ、ふつうの `NoMethodError` にします。

### 4. respond_to? にも正直に答える

```ruby:line-numbers=32
      def respond_to_missing?(method_name, include_private = false)
        method_name.end_with?("?") || super
      end
```
`env.respond_to?(:production?)` が `true` になるようにします。

## ここがすごい

### あらゆる環境名に、定義なしで対応

`production?`、`development?`、`test?` を 1 つずつメソッドとして定義することもできます。しかし、`staging?` や `preview?` のように、アプリごとに自由に作られる環境名すべてには対応できません。
`method_missing` を使えば、**どんな名前でも「その名前と等しいか」という意味で** 答えられます。

### 読みやすさのための仕組み

`if Rails.env == "production"` と書くと、文字列のタイプミス（`"prodution"`）に気づきにくいうえ、少し読みにくくなります。`Rails.env.production?` は英語の疑問文のように読めます。仕組みとしては文字列の比較にすぎませんが、コードの読みやすさが大きく変わります。

### respond_to_missing? をセットで書く

`method_missing` だけを定義すると、「呼べば答えるのに `respond_to?` では false」という食い違いが起きます。`method` メソッドで取り出すこともできません。`respond_to_missing?` も定義しておくのが、`method_missing` を使うときの正しい作法です。

### 文字列のまま使える

`String` を継承しているので、ログに出したり、`"production"` と比べたりもふつうにできます。新しい機能を足しつつ、元の文字列としての使い方を一切失っていません。

## まとめ

- `method_missing` を使うと、定義していない名前のメソッドにも応答できます。
- そのときは `respond_to_missing?` もセットで定義し、`super` で通常のエラーに戻す道を残します。
- 「名前そのものを引数のように使う」と、`env.production?` のような読みやすい API が作れます。
