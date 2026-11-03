---
title: "要素の間にだけ区切りを入れる、PP の seplist"
description: "PP#seplist は、配列の要素を 1 つずつ yield し、2 つ目以降の前にだけ区切りを挟む。最初の要素の前に区切りが付かないようにする仕組み。"
language: ruby
project: "Ruby pp (標準ライブラリ)"
repo: https://github.com/ruby/pp
license: "BSD-2-Clause OR Ruby"
copyright: "Ruby is copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "ddff8fe31cd47c2c6d0e8f49b4974b3f355c4f04"
file: lib/pp.rb
lines: [268, 278]
function: "PP::PPMethods#seplist"
difficulty: 2
format: 2
tags: ["イテレータ", "イディオム", "文字列処理"]
---
## ひとことで

`seplist` は、リストの要素を、区切りを挟みながら順に表示するための部品です。
配列の要素のあいだにだけ、カンマと改行できる場所（`breakable`）を入れます。
最初の要素の前には、区切りを入れません。`pp` が見やすい整形をするときに使われています。

## コード

```ruby:line-numbers=268
      sep ||= lambda { comma_breakable }
      first = true
      kwsplat = EMPTY_KWHASH
      list.__send__(iter_method) {|*v|
        if first
          first = false
        else
          sep.call
        end
        kwsplat ? yield(*v, **kwsplat) : yield(*v)
      }
```

## 前提知識

- **`pp`（Pretty Print）**: 長いオブジェクトを、画面の幅に合わせて、見やすく改行しながら表示する標準ライブラリです。
- **`lambda`**: 名前の付かない関数（無名関数）を作る書き方です。`sep.call` で呼び出せます。
- **`yield`**: メソッドに渡されたブロックを呼び出します。ここでは、要素ごとに、呼び出し側の処理を実行します。
- **`__send__`**: 名前を文字列や記号で指定して、メソッドを呼ぶ方法です。`iter_method` が `:each` なら、`each` を呼びます。
- **`breakable`**: 必要なら改行、そうでなければ空白になる場所を表す、`PrettyPrint` の機能です。

## 何をしているか

### 1. 区切りの処理を、デフォルトで決める

```ruby:line-numbers=268
      sep ||= lambda { comma_breakable }
```

呼び出し側が区切りを指定しなければ、`comma_breakable`（カンマと改行できる場所）を使います。
`||=` なので、指定されたときは、その区切りがそのまま使われます。

### 2. 最初の要素だけ、区切りを飛ばす

```ruby:line-numbers=269
      first = true
```

```ruby:line-numbers=272
        if first
          first = false
        else
          sep.call
        end
```

`first` は、最初の要素かどうかを覚えておく旗です。最初の要素では、`first = false` にするだけで、区切りは入れません。
2 つ目以降の要素の前に、初めて `sep.call` が呼ばれます。

### 3. 要素を、呼び出し側に渡す

```ruby:line-numbers=277
        kwsplat ? yield(*v, **kwsplat) : yield(*v)
```

要素は、`yield` によって、呼び出し側のブロックに渡されます。
`kwsplat` は、キーワード引数を渡すための空のハッシュです。Ruby 3.0 以降では、それを一緒に渡し、古い版では渡しません。

## ここがすごい

### 「最初だけ」を、旗 1 つで表す

「2 つ目以降の前にだけ区切る」は、配列の添字を使っても書けます。
しかし、`each` のように添字が無いものにも使うため、旗の `first` を使っています。どんな反復でも同じ形で書けます。

### 区切りを、関数として差し替えられる

`sep` は、単なる文字列ではなく、呼ばれたときに処理を行う関数です。
区切りが「カンマと改行可能な場所」なら `comma_breakable`、ほかの区切りなら別の処理を渡せます。
表示の形を変えたいときに、この部分だけを変えれば済みます。

### `yield` で、中身の表示は呼び出し側に任せる

`seplist` は区切りだけを担当し、要素をどう表示するかは知りません。
表示の責任を分けておくことで、配列でも、ハッシュの組でも、同じ仕組みを使えます。

## まとめ

- `seplist` は、要素のあいだにだけ区切りを入れて、順に処理します。
- 旗の `first` によって、最初の要素の前には区切りを入れません。
- 区切りは `lambda` として渡せるので、表示の形を変えられます。
- 要素の表示は呼び出し側に任せ、区切りの責任だけを持ちます。
