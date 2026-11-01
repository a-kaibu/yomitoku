---
title: "キーが 1 つか複数かで内側のループを省く pluck"
description: "ハッシュの配列から指定したキーの値だけを集める pluck。キーが 1 つのときは配列の配列を作らず、値をそのまま並べる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [158, 165]
function: "Enumerable#pluck"
difficulty: 1
format: 2
tags: [API設計, イテレータ]
---

## ひとことで

`pluck` は、ハッシュ（やハッシュのように `[]` で値を取り出せるもの）の集まりから、**指定したキーの値だけを抜き出す** メソッドです。
`[{ name: "David" }, { name: "Rafael" }].pluck(:name)` は `["David", "Rafael"]` になります。
キーを複数渡すと `pluck(:id, :name)` → `[[1, "David"], [2, "Rafael"]]` のように、各要素の値を組にして返します。

## コード

```ruby:line-numbers=158
  def pluck(*keys)
    if keys.many?
      map { |element| keys.map { |key| element[key] } }
    else
      key = keys.first
      map { |element| element[key] }
    end
  end
```

## 前提知識

- **可変長引数 `*keys`**: 渡された引数をすべて配列 `keys` にまとめて受け取ります。`pluck(:name)` なら `keys` は `[:name]` です。
- **`map { ... }`**: 各要素にブロックを適用し、その結果を集めた新しい配列を返します。
- **`element[key]`**: ハッシュからキーに対応する値を取り出します。`[]` メソッドを持つオブジェクトなら何でも使えます。
- **`many?`**: Rails が追加した「要素が 2 つ以上あるか」を調べるメソッドです。
- **`keys.first`**: 配列の最初の要素です。

## 何をしているか

### 1. キーが複数のとき

```ruby:line-numbers=159
    if keys.many?
      map { |element| keys.map { |key| element[key] } }
```
`pluck(:id, :name)` なら、各要素について `keys.map { |key| element[key] }` を計算します。
`{ id: 1, name: "David" }` からは `[1, "David"]` ができ、それを全要素ぶん集めて配列の配列にします。

### 2. キーが 1 つのとき

```ruby:line-numbers=161
    else
      key = keys.first
      map { |element| element[key] }
    end
```
キーを 1 つ取り出しておき、各要素から `element[key]` を取るだけです。結果は `["David", "Rafael"]` のような平らな配列になります。

## ここがすごい

### 使う人の期待に合わせて形を変える

もしキーの数に関係なく `keys.map { |key| element[key] }` の書き方をすると、`pluck(:name)` の結果は `[["David"], ["Rafael"]]` になってしまいます。1 つのキーを抜き出したいとき、二重の配列が欲しい人はほとんどいません。
キーの数で分岐することで、**よく使う 1 キーの場合はいちばん自然な形** で返しています。これは Active Record の `pluck`（データベースから列の値を取り出すメソッド）と同じ振る舞いで、Rails 全体で使い心地をそろえています。

### 内側のループも省ける

1 キーの場合、各要素について `keys.map` で小さな配列を作る必要がありません。要素が多いとき、この「小さな配列を作らない」ことが無駄なメモリ確保を減らします。

### ハッシュに限定しない

`element[key]` としか書いていないので、ハッシュだけでなく、`[]` で値を返すオブジェクト（Active Record のモデルなど）にも使えます。型を調べずに「`[]` ができればよい」とするのは、ダックタイピングと呼ばれる Ruby らしい考え方です。

## まとめ

- 引数の数で戻り値の形を変えると、よくある使い方が自然になります。
- その分岐は、余計な中間配列を作らない最適化にもなっています。
- 「`[]` が使えれば何でもよい」とするダックタイピングで、使える範囲が広がります。
