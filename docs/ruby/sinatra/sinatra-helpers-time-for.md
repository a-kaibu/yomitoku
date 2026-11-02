---
title: "いろいろな値を、時刻（Time）に直す"
description: "Sinatra の time_for は、数値・文字列・日時のオブジェクトを Time に変換する。変換できないときは、わかりやすい ArgumentError に統一する。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [692, 704]
function: "Sinatra::Helpers#time_for"
difficulty: 2
format: 2
tags: ["日時", "エラー処理", "API設計"]
---
## ひとことで

`Sinatra::Helpers#time_for` は、数値、文字列、日時のオブジェクトなど、**いろいろな形の値を `Time` オブジェクトに直す** メソッドです。
数値は「1970 年からの秒数」、文字列は日時として読み取ります。
変換できないときは、どんな値が悪かったかを示す `ArgumentError` に統一します。

## コード

```ruby:line-numbers=692
    def time_for(value)
      if value.is_a? Numeric
        Time.at value
      elsif value.respond_to? :to_s
        Time.parse value.to_s
      else
        value.to_time
      end
    rescue ArgumentError => e
      raise e
    rescue Exception
      raise ArgumentError, "unable to convert #{value.inspect} to a Time object"
    end
```

## 前提知識

- **`Time`**: Ruby で日時を表すクラスです。`Time.at(秒数)` は、1970 年 1 月 1 日からの秒数から時刻を作ります。
- **`Time.parse`**: 「2020-01-01 12:00」のような文字列を読み取って、`Time` にします。
- **`respond_to?`**: オブジェクトが、そのメソッドを持つかを調べます。
- **`rescue`**: 例外が起きたときの処理です。`rescue ArgumentError => e` の形で、その種類を指定できます。
- **`raise`**: 例外を発生させます。`raise e` は、受け止めた例外をもう一度投げ直します。

## 何をしているか

### 1. 数値は秒数として扱う

```ruby:line-numbers=693
      if value.is_a? Numeric
        Time.at value
```

`Numeric`（数値）なら、`Time.at` で秒数から時刻を作ります。

### 2. 文字列は、日時として読み取る

```ruby:line-numbers=695
      elsif value.respond_to? :to_s
        Time.parse value.to_s
```

`to_s` を持つものは、文字列にしてから `Time.parse` で読み取ります。読み取れない文字列は、ここで例外になります。

### 3. それ以外は、`to_time` に任せる

```ruby:line-numbers=697
      else
        value.to_time
```

それ以外のものは、`to_time` メソッドを持っていれば、それで `Time` にします。

### 4. エラーをわかりやすくする

```ruby:line-numbers=700
    rescue ArgumentError => e
      raise e
    rescue Exception
      raise ArgumentError, "unable to convert #{value.inspect} to a Time object"
```

`ArgumentError` は、そのまま投げ直します。それ以外の例外は、「どの値が変換できなかったか」を含んだ `ArgumentError` に変えて投げます。

## ここがすごい

### 入力の種類を、順に判定する

数値、文字列、その他、と順番に型を調べることで、一度に 1 つの変換規則だけを確かめれば済みます。
新しい型が増えたときも、判定の列に 1 つ足せば対応できます。

### エラーを、利用者に分かる形にそろえる

標準の例外は、内部の事情で変わることがあります。
`ArgumentError` と値の表示をそろえると、どんな入力で失敗したのかを、呼び出し側が一目で判断できます。

### 例外の種類で、扱いを分ける

`ArgumentError` はすでに意図どおりなので、そのまま返します。
それ以外は、予想外の失敗なので、説明を加えて変換しています。例外を「そのまま」と「包み直す」で使い分けています。

## まとめ

- いろいろな型の値を一つの型にするときは、型ごとの変換を順に並べると整理できます。
- エラーは、利用者が原因を理解できる形で投げると、問題の特定が速くなります。
- 例外の種類で扱いを分けると、想定内と想定外の失敗を区別できます。
