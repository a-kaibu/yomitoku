---
title: "配列に「phone? が含まれる？」と聞ける ArrayInquirer"
description: "配列版の StringInquirer。any? を拡張してシンボルと文字列の両方で探し、method_missing で variants.phone? のような問い合わせを実現する。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/array_inquirer.rb
lines: [32, 53]
function: "ActiveSupport::ArrayInquirer#method_missing"
difficulty: 2
format: 2
tags: [メタプログラミング, 可読性, API設計]
---

## ひとことで

`ArrayInquirer` は、配列に **「この要素を含んでいますか？」をメソッド名で聞ける** ようにするクラスです。
`variants = ActiveSupport::ArrayInquirer.new([:phone, :tablet])` とすると、`variants.phone?` は `true`、`variants.desktop?` は `false` になります。
Rails では、リクエストの端末の種類（バリアント）を調べる `request.variant.phone?` などに使われています。

## コード

```ruby:line-numbers=32
    def any?(*candidates)
      if candidates.none?
        super
      else
        candidates.any? do |candidate|
          include?(candidate.to_sym) || include?(candidate.to_s)
        end
      end
    end

    private
      def respond_to_missing?(name, include_private = false)
        name.end_with?("?") || super
      end

      def method_missing(name, ...)
        if name.end_with?("?")
          any?(name[0..-2])
        else
          super
        end
      end
```

## 前提知識

- **このクラスは Array を継承している**: ファイルの前の部分で `class ArrayInquirer < Array` と定義されています。そのため配列のメソッドはすべて使えます。
- **`*candidates`**: 渡された引数をすべて配列で受け取ります。何も渡されなければ空の配列です。
- **`none?` / `any?`**: `none?` は「真になる要素が 1 つもない」（空の配列なら真）、`any?` はブロックが真を返す要素が 1 つでもあれば真です。
- **`super`**: 親クラス（ここでは `Array`）の同じ名前のメソッドを呼びます。
- **シンボルと文字列**: `:phone` と `"phone"` は Ruby では別の値で、`==` で比べると等しくありません。`to_sym` と `to_s` で相互に変換できます。
- **`method_missing` / `respond_to_missing?`**: 存在しないメソッドを呼ばれたときの処理と、`respond_to?` への答えを定義するメソッドです。

## 何をしているか

### 1. 引数なしの any? は配列の any?

```ruby:line-numbers=32
    def any?(*candidates)
      if candidates.none?
        super
```
`variants.any?` のように引数なしで呼ばれたら、親クラス `Array` の `any?`（空でなければ真）を使います。

### 2. 引数ありの any? は「どれかを含むか」

```ruby:line-numbers=35
      else
        candidates.any? do |candidate|
          include?(candidate.to_sym) || include?(candidate.to_s)
        end
      end
```
`variants.any?(:phone, "desktop")` なら、候補ごとに **シンボルとしても文字列としても** 探します。`:phone` が見つかるので `true` です。
配列の中身が `[:phone]` でも `["phone"]` でも、同じように見つけられます。

### 3. 「?」で終わるメソッドを any? に変える

```ruby:line-numbers=47
      def method_missing(name, ...)
        if name.end_with?("?")
          any?(name[0..-2])
        else
          super
        end
      end
```
`variants.tablet?` は `method_missing(:tablet?)` になり、`any?("tablet")` が呼ばれます。中身がシンボルの `:tablet` でも、`include?(candidate.to_sym) || include?(candidate.to_s)` のおかげで見つかります。

## ここがすごい

### 既存のメソッドを「上書きしつつ互換を保つ」

`any?` は配列にもともとあるメソッドです。引数なしのときは元の振る舞いを `super` で残し、引数ありのときだけ新しい意味を加えています。**元の使い方を壊さずに機能を足す** うまい拡張です。

### シンボルと文字列の違いを吸収する

Rails では、同じ値がシンボルで来たり文字列で来たりすることがよくあります（設定ファイルやリクエストパラメータからの値など）。`to_sym` と `to_s` の両方を試すことで、使う側はどちらで入っているかを気にせずに済みます。

### method_missing の処理はたった 1 行

問い合わせのメソッドは、名前から `?` を取って `any?` に渡すだけです。判定のロジックは `any?` の 1 か所にまとまっているので、`variants.phone?` と `variants.any?(:phone)` の結果が食い違うことがありません。

### StringInquirer とそろった設計

同じ Active Support の `StringInquirer`（`Rails.env.production?`）と同じ書き方・同じ作法（`respond_to_missing?` も定義）になっています。ライブラリ内で使い方がそろっていると、覚えることが少なくて済みます。

## まとめ

- 継承したメソッドを上書きするときは、元の使い方を `super` で残すと互換性が保てます。
- シンボルと文字列の両方で探すと、値の出どころを気にせずに済みます。
- `method_missing` の中は既存のメソッドに委ねると、判定ロジックが 1 か所にまとまります。
