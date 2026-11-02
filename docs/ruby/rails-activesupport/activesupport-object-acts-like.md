---
title: "目印のメソッドで「〜のように振る舞うか」を調べる acts_like?"
description: "クラスを調べずに「時刻のように振る舞うか」を判定するダックタイピングの仕組み。よく使う名前だけ文字列を作らずに済ませている。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/object/acts_like.rb
lines: [38, 49]
function: "Object#acts_like?"
difficulty: 2
format: 2
tags: [型システム, メタプログラミング, 最適化]
---

## ひとことで

`acts_like?(:time)` は、オブジェクトが **時刻のように振る舞うか** を調べるメソッドです。
Rails では `Time` だけでなく、タイムゾーン付きの `ActiveSupport::TimeWithZone` も時刻として使えます。どちらも `acts_like?(:time)` が `true` になるので、クラスを気にせず扱えます。
仕組みは単純で、「`acts_like_time?` という目印のメソッドを持っているか」を調べているだけです。

## コード

```ruby:line-numbers=38
  def acts_like?(duck)
    case duck
    when :time
      respond_to? :acts_like_time?
    when :date
      respond_to? :acts_like_date?
    when :string
      respond_to? :acts_like_string?
    else
      respond_to? :"acts_like_#{duck}?"
    end
  end
```

## 前提知識

- **ダックタイピング**: 「アヒルのように歩き、アヒルのように鳴くなら、それはアヒルだ」という考え方です。オブジェクトのクラスではなく、**持っているメソッド** で扱い方を決めます。
- **`respond_to?(:名前)`**: そのオブジェクトが、指定した名前のメソッドを持っているかを返します。
- **シンボル `:time`**: 名前を表す軽量な値です。`:"acts_like_#{duck}?"` のように `:"..."` と書くと、式展開を使ってシンボルを作れます。
- **`case ... when`**: 値がどの `when` に当てはまるかで分岐します。シンボルどうしは `==` で比べられます。
- **目印のメソッド**: Rails の `Time` クラスには、中身が `true` を返すだけの `acts_like_time?` が定義されています。「私は時刻として扱えます」という宣言です。

## 何をしているか

### 1. よく使う 3 種類は名前を直接書く

```ruby:line-numbers=39
    case duck
    when :time
      respond_to? :acts_like_time?
    when :date
      respond_to? :acts_like_date?
    when :string
      respond_to? :acts_like_string?
```
`:time`、`:date`、`:string` のときは、それぞれ `acts_like_time?` などのメソッドを持っているかを調べます。

### 2. それ以外は名前を組み立てる

```ruby:line-numbers=46
    else
      respond_to? :"acts_like_#{duck}?"
```
たとえば `acts_like?(:duration)` なら、`:"acts_like_duration?"` というシンボルを作って調べます。

自分で作ったクラスに `def acts_like_string?; true; end` を定義しておけば、`MyText.new.acts_like?(:string)` は `true` になります。

## ここがすごい

### クラスの継承に縛られない

「時刻かどうか」を `is_a?(Time)` で調べると、`Time` を継承していないクラスは時刻として扱われません。`TimeWithZone` は `Time` を継承していませんが、時刻としてふるまいます。
目印のメソッドを使う方法なら、**どのクラスでも宣言するだけで仲間入り** できます。継承の関係を変えずに、振る舞いの互換性を表せるのが利点です。

### よくある名前は文字列を作らない

`else` の側だけでもすべてのケースに対応できます。それなのに `:time`、`:date`、`:string` だけを特別に書いているのはなぜでしょうか。
`:"acts_like_#{duck}?"` は、呼ぶたびに文字列を組み立て、それをシンボルに変換する処理が走ります。`acts_like?(:time)` は日付や時刻の計算の中で非常によく呼ばれるので、**よく使う名前だけは組み立てずに済むよう、あらかじめ書いておく** という最適化です。

### 汎用の道を残している

最適化した 3 つ以外にも、どんな名前でも使える一般的な道を最後に残しています。速さと拡張性の両方を保っています。

## まとめ

- ダックタイピングでは、クラスではなく「持っているメソッド」で扱い方を決めます。
- 中身が `true` を返すだけの「目印のメソッド」は、互換性を宣言する簡単な方法です。
- 頻繁に呼ばれる処理では、よく使う値だけを特別扱いして、文字列の組み立てを省くと効果があります。
