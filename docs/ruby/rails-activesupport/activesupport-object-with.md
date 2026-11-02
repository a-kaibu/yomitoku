---
title: "一時的に値を変えて、必ず元に戻す Object#with"
description: "ブロックの間だけオブジェクトの属性を書き換え、終わったら（例外が起きても）元の値に戻す。ensure を使った後片付けの定番。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/object/with.rb
lines: [31, 44]
function: "Object#with"
difficulty: 2
format: 2
tags: [エラー処理, メタプログラミング, イディオム]
---

## ひとことで

`with` は、**ブロックを実行する間だけ属性を別の値にして、終わったら元に戻す** メソッドです。
`client.with(timeout: 5) { client.get("/") }` と書くと、その呼び出しの間だけ `timeout` が 5 になり、ブロックを抜けると元の値に戻ります。
テストで設定を一時的に変えたいときなどに便利です。

## コード

```ruby:line-numbers=31
  def with(**attributes)
    old_values = {}
    begin
      attributes.each do |key, value|
        old_values[key] = public_send(key)
        public_send("#{key}=", value)
      end
      yield self
    ensure
      old_values.each do |key, old_value|
        public_send("#{key}=", old_value)
      end
    end
  end
```

## 前提知識

- **`**attributes`**: キーワード引数をまとめてハッシュで受け取ります。`with(timeout: 5, retries: 0)` なら `{timeout: 5, retries: 0}` です。
- **ゲッターとセッター**: Ruby では、`obj.timeout` で値を読むメソッドと、`obj.timeout = 5` で値を書くメソッド（名前は `timeout=`）が別々にあります。
- **`public_send(名前, 引数)`**: メソッドを名前で呼び出します。`public_send("timeout=", 5)` は `obj.timeout = 5` と同じです。
- **`begin ... ensure ... end`**: `ensure` 節は、`begin` の中が正常に終わっても、例外で中断しても **必ず** 実行されます。後片付けのための仕組みです。
- **`yield self`**: 渡されたブロックを、自分自身を引数にして実行します。

## 何をしているか

### 1. 古い値を覚えてから書き換える

```ruby:line-numbers=32
    old_values = {}
    begin
      attributes.each do |key, value|
        old_values[key] = public_send(key)
        public_send("#{key}=", value)
      end
```
`client.with(timeout: 5, retries: 0)` の場合、

1. `client.timeout` を読んで `old_values[:timeout]` に保存し、`client.timeout = 5` にする
2. `client.retries` を読んで保存し、`client.retries = 0` にする

### 2. ブロックを実行する

```ruby:line-numbers=38
      yield self
```
書き換えた状態でブロックを実行します。ブロックの結果が `with` の戻り値になります。

### 3. 必ず元に戻す

```ruby:line-numbers=39
    ensure
      old_values.each do |key, old_value|
        public_send("#{key}=", old_value)
      end
```
`ensure` の中で、保存しておいた値を順に書き戻します。ブロックの中で例外が起きても、ここは実行されます。

## ここがすごい

### 書き換えに成功したものだけを戻す

`old_values` には「書き換える直前に読んだ値」を 1 つずつ追加しています。もし 2 つ目の属性の書き換えで例外が起きても、`old_values` には 1 つ目だけが入っているので、**実際に変えたものだけ** が元に戻されます。
最初に全部の古い値を読み、その後で全部書き換える方式だと、途中で失敗したときに「書き換えていないものまで書き戻す」ことになります。

### begin の位置が工夫されている

`old_values = {}` は `begin` の外にあり、書き換えの処理は `begin` の中にあります。こうすることで、書き換えの途中で失敗した場合にも `ensure` が動き、それまでに変えた値を戻せます。

### 何にでも使える汎用性

特定のクラス向けではなく、`Object` に定義されています。条件は「読み書きの public メソッドがあること」だけです（コード中のコメント）。`public_send` で名前から呼び出すので、どんな属性名でも動きます。

### 「一時的に変える」の定型を 1 つにまとめた

このパターンを毎回手で書くと、

```ruby
old = obj.timeout
obj.timeout = 5
begin
  ...
ensure
  obj.timeout = old
end
```

のように 6 行ほど必要で、`ensure` を書き忘れるバグも起きがちです。`with` を使えば 1 行で、安全に書けます。

## まとめ

- 「一時的に変えて、必ず戻す」には `begin ... ensure` が欠かせません。
- 元の値は「変える直前」に 1 つずつ保存すると、途中で失敗しても正しく戻せます。
- `public_send("#{key}=", value)` のように名前を組み立てると、どの属性にも使える汎用のメソッドになります。
