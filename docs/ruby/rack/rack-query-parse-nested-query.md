---
title: "a[b][c]=1 のような入れ子の名前を、ハッシュの中へ広げる"
description: "クエリ文字列の角括弧で書かれた名前を、入れ子のハッシュや配列に変換する。型が食い違うときは例外にする。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/query_parser.rb
lines: [115, 123]
function: "Rack::QueryParser#parse_nested_query"
difficulty: 3
format: 2
tags: [パース, ハッシュ, 再帰]
---

## ひとことで

`parse_nested_query` は、`user[name]=a&user[age]=20` のような **入れ子の名前** を、本当に入れ子のハッシュにするメソッドです。
結果は `{"user" => {"name" => "a", "age" => "20"}}` になります。
同じ名前が違う型（値と、入れ子のどちらか）で衝突したときは、`ParameterTypeError` を出します。

## コード

```ruby:line-numbers=115
    def parse_nested_query(qs, separator = nil)
      params = make_params

      each_query_pair(qs, separator) do |k, v|
        _normalize_params(params, k, v, 0)
      end

      return params.to_h
    end
```

## 前提知識

- **角括弧の名前**: `a[b][c]` は「a の中の b の中の c」を表す書き方です。
- **`make_params`**: 結果の入れ物を作るメソッドです。
- **`each_query_pair`**: 組を 1 つずつ渡してくる補助メソッドです。
- **`_normalize_params`**: 1 組を、入れ子の名前に沿って入れ物に広げる補助メソッドです。同じクラスにあります。
- **`ParameterTypeError`**: 型が食い違ったときの例外です。同じファイルで定義されています。

## 何をしているか

### 1. 入れ物を用意する

```ruby:line-numbers=116
      params = make_params
```

空の入れ物を作ります。

### 2. 組ごとに広げる

```ruby:line-numbers=118
      each_query_pair(qs, separator) do |k, v|
        _normalize_params(params, k, v, 0)
      end
```

各組について、名前の角括弧に沿って、入れ物の中に入れ子の場所を作ります。`0` は、名前の何番目まで見たかを表す位置です。

### 3. ハッシュにして返す

```ruby:line-numbers=122
      return params.to_h
```

## ここがすごい

### 名前を解析する処理を分ける

このメソッドは、組を回すだけです。角括弧を読んで入れ子を作る仕事は、`_normalize_params` に任せています。読む側は、全体の流れと細かい規則を別々に理解できます。

### 食い違いは黙らせない

同じファイルの説明にあるように、`a=1&a[b]=2` のように値と入れ子が衝突したときは、例外を出します。黙って上書きすると、データが静かに壊れてしまうからです。

### 位置を数えながら進む

`0` という引数で、どこまで名前を読んだかを追跡しています。再帰で一段ずつ下りるので、名前が深くても同じ仕組みで扱えます。

## まとめ

- 名前の入れ子は、分ける処理と広げる処理を分けると読みやすくなります。
- 型の食い違いは例外にすると、データの壊れを早く見つけられます。
- 再帰で位置を数えると、深さに関係なく同じ規則が使えます。
