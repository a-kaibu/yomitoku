---
title: "配列を「key[]=a&key[]=b」の URL パラメータにする to_query"
description: "配列を URL のクエリ文字列に変換する。要素ごとに to_query を呼ぶ再帰の形で、入れ子の配列やハッシュにも対応している。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/object/to_query.rb
lines: [67, 78]
function: "Array#to_query"
difficulty: 2
tags: [ネットワーク, 再帰, 文字列処理]
---

## ひとことで

`Array#to_query(key)` は、配列を **URL のクエリ文字列** に変換するメソッドです。
`["Rails", "coding"].to_query("hobbies")` は `"hobbies%5B%5D=Rails&hobbies%5B%5D=coding"` になります。`%5B%5D` は `[]` を URL 用に変換（エスケープ）したもので、元に戻すと `hobbies[]=Rails&hobbies[]=coding` です。
Rails はこの形式を受け取ると、`params[:hobbies]` を配列として復元します。

## コード

```ruby:line-numbers=67
  def to_query(key)
    prefix = "#{key}[]"

    if empty?
      nil.to_query(prefix)
    else
      filter_map { |value|
        next if (value.is_a?(Hash) || value.is_a?(Array)) && value.empty?
        value.to_query(prefix)
      }.join "&"
    end
  end
```

## 前提知識

- **クエリ文字列**: URL の `?` の後ろに付く `name=value&name2=value2` の部分です。サーバに値を渡すのに使います。
- **`key[]` の慣習**: Rails や PHP では、`hobbies[]=a&hobbies[]=b` のように名前に `[]` を付けると「配列の要素」として扱う約束があります。
- **`to_query`**: Rails がすべてのオブジェクトに定義したメソッドです。文字列や数値なら `key=value` を作り、ハッシュなら各キーについて、配列ならこのメソッドが呼ばれます。
- **`filter_map { ... }`**: 各要素にブロックを適用し、結果が `nil` や `false` でないものだけを集めます（`map` と `compact` を同時にする感じ）。
- **ブロック内の `next`**: ブロックの中で `next` すると、その要素の処理を終えて次へ進みます。値を書かない `next` の結果は `nil` になります。
- **`join "&"`**: 配列の要素を `&` でつないで 1 つの文字列にします。

## 何をしているか

### 1. 名前に [] を付ける（68 行目）

`"hobbies"` から `"hobbies[]"` を作ります。

### 2. 空の配列のとき（70〜71 行目）

`[].to_query("hobbies")` は `nil.to_query("hobbies[]")` になり、`"hobbies%5B%5D="` を返します。「空の配列を送った」という情報が、値のない `hobbies[]=` として伝わります。

### 3. 要素ごとに変換してつなぐ（73〜76 行目）

各要素に対して `value.to_query("hobbies[]")` を呼びます。`"Rails".to_query("hobbies[]")` は `"hobbies%5B%5D=Rails"` を返します。
ただし、要素が **空の配列や空のハッシュ** の場合は `next` で `nil` にし、`filter_map` で取り除きます。最後に `&` でつなぎます。

## ここがすごい

### 再帰を「各クラスの to_query」に任せる

要素が配列やハッシュでも、このメソッドの中で特別に分岐していません。`value.to_query(prefix)` を呼ぶだけで、要素がハッシュならハッシュ用の、配列なら配列用の `to_query` が動きます。
たとえば `[{ name: "a" }].to_query("users")` なら、ハッシュ側が `users[][name]=a` を作ってくれます。入れ子が深くても同じ仕組みで処理されます。

### 空の入れ子を捨てる理由

`[[], "x"]` の内側の `[]` をそのまま変換すると `key[][]=` のような、受け取り側で意味のない値が混ざります。74 行目で取り除くことで、受け取ったときに余計な空要素ができないようにしています。

### 配列そのものが空なら情報を残す

一方で、配列そのものが空のときは `key[]=` を残します。何も出力しないと「パラメータがない」と区別できなくなるからです。**どの「空」を残し、どれを捨てるか** を意識して書き分けています。

## まとめ

- `key[]=a&key[]=b` は、配列を URL で送るための広く使われている形式です。
- 要素ごとに同じ名前のメソッドを呼ぶと、入れ子のデータも自然に再帰的に変換できます。
- `filter_map` と `next` を組み合わせると、「変換しつつ不要なものを捨てる」が 1 回で書けます。
- 「空」の扱いは場所によって意味が違うので、残すか捨てるかを意識しましょう。
