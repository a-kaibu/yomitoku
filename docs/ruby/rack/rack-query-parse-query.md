---
title: "同じ名前のパラメータを、配列にまとめる parse_query"
description: "クエリ文字列を、名前と値のハッシュにする。同じ名前が 2 回以上出てきたら、値を配列にまとめる。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/query_parser.rb
lines: [79, 95]
function: "Rack::QueryParser#parse_query"
difficulty: 2
format: 2
tags: [パース, ハッシュ, API設計]
---

## ひとことで

`parse_query` は、URL の `?` の後ろの **クエリ文字列**（`a=1&b=2`）を、ハッシュにするメソッドです。
`"tag=ruby&tag=rails&page=2"` からは `{"tag" => ["ruby", "rails"], "page" => "2"}` が得られます。
同じ名前が 2 回以上出てくると、値が配列にまとめられます。

## コード

```ruby:line-numbers=79
    def parse_query(qs, separator = nil, &unescaper)
      params = make_params

      each_query_pair(qs, separator, unescaper) do |k, v|
        if cur = params[k]
          if cur.class == Array
            params[k] << v
          else
            params[k] = [cur, v]
          end
        else
          params[k] = v
        end
      end

      return params.to_h
    end
```

## 前提知識

- **クエリ文字列**: `?name=value&name2=value2` の部分です。`&` で区切られた組が並びます。
- **`each_query_pair`**: 同じクラスにある補助メソッドで、`&` で分けた組を 1 つずつブロックに渡します。
- **`make_params`**: 結果を入れる入れ物を作るメソッドです。
- **`if cur = params[k]`**: 代入した値が `nil` でなければ真になります。すでに値があるかを確かめつつ、その値を `cur` に入れます。
- **`cur.class == Array`**: 既存の値が配列かどうかを調べます。
- **`to_h`**: 入れ物を普通のハッシュに変えて返します。

## 何をしているか

### 1. 組を 1 つずつ受け取る

```ruby:line-numbers=82
      each_query_pair(qs, separator, unescaper) do |k, v|
```

`each_query_pair` が、名前と値の組を順に渡してきます。

### 2. 初めての名前なら、そのまま入れる

```ruby:line-numbers=89
        else
          params[k] = v
```

まだ無い名前なら、値をそのまま入れます。

### 3. 2 回目以降は配列にする

```ruby:line-numbers=83
        if cur = params[k]
          if cur.class == Array
            params[k] << v
          else
            params[k] = [cur, v]
          end
```

すでに値がある場合、その値が配列なら末尾に足します。配列でなければ、`[今の値, 新しい値]` の配列にします。

### 4. ハッシュにして返す

```ruby:line-numbers=94
      return params.to_h
```

## ここがすごい

### 1 つの入れ物で、2 つの形を扱う

値は「1 つなら文字列、複数なら配列」という形になります。同じ名前が来るたびに、配列に変えるか足すかを判断するので、ハッシュの作り方が 1 つのループに収まっています。

### 既存の値の型で分ける

`cur.class == Array` で、すでに配列になっているかを見ています。毎回ゼロから配列を作らず、既にある配列に足すので無駄がありません。

### 最後だけハッシュにする

作業中は入れ物を使い、最後に `to_h` で返します。途中の型の扱いを、呼び出し側に見せない作りです。

## まとめ

- 同じ名前が繰り返されるデータは、「1 つ目はそのまま、2 つ目以降は配列」と決めると、扱いやすくなります。
- 既存の値の型を確かめてから追加すると、無駄な配列を作りません。
- 作業用の入れ物と結果の形を分けると、途中の処理を単純にできます。
