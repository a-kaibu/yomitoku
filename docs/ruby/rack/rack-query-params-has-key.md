---
title: "「a[b][c]」のような入れ子のキーが、本当に存在するかを確かめる"
description: "クエリ文字列を解析したハッシュの中に、角括弧で書かれた入れ子のキーがあるかを、一段ずつたどって調べる。配列の書き方は対象外にする。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/query_parser.rb
lines: [218, 228]
function: "Rack::QueryParser#params_hash_has_key?"
difficulty: 2
format: 2
tags: [パース, ハッシュ, 再帰]
---

## ひとことで

`params_hash_has_key?` は、`user[address][city]` のような **入れ子のキー** が、解析済みのハッシュにあるかを調べるメソッドです。
`{"user" => {"address" => {"city" => "Tokyo"}}}` の中に、`"user[address][city]"` はあるので `true` になります。`user[name]` はないので `false` です。
クエリ文字列の `user[name]=...` を、後から上書きして良いかの判断に使われます。

## コード

```ruby:line-numbers=218
    def params_hash_has_key?(hash, key)
      return false if /\[\]/.match?(key)

      key.split(/[\[\]]+/).inject(hash) do |h, part|
        next h if part == ''
        return false unless params_hash_type?(h) && h.key?(part)
        h[part]
      end

      true
    end
```

## 前提知識

- **角括弧の書き方**: `user[address][city]=Tokyo` は、「`user` の中の `address` の中の `city`」を表す書き方です。Rack はこれを入れ子のハッシュに変換します。
- **`match?(key)`**: 正規表現にマッチするかを真偽値で返します。
- **`split(/[\[\]]+/)`**: `[` または `]` の連続で区切ります。`"user[address][city]"` は `["user", "address", "city"]` になります。
- **`inject(初期値) do |h, part| ... end`**: 初期値から順に、ブロックで値を次々に作っていきます。途中の結果が次の入力になります。
- **`next h if ...`**: `next` は、ブロックの今の回を終わらせて、その値を返します。ここでは `h` をそのまま次へ渡します。
- **`kind_of?` と `key?`**: `kind_of?` はクラスの型を調べ、`key?` はハッシュにキーがあるかを調べます。

## 何をしているか

### 1. 配列の書き方は対象外

```ruby:line-numbers=219
      return false if /\[\]/.match?(key)
```

`tags[]` のような配列の書き方は、ハッシュのキーとしては扱えません。そのため、最初に `false` を返します。

### 2. キーを一段ずつたどる

```ruby:line-numbers=221
      key.split(/[\[\]]+/).inject(hash) do |h, part|
        next h if part == ''
        return false unless params_hash_type?(h) && h.key?(part)
        h[part]
      end
```

`"user[address][city]"` は `["user", "address", "city"]` に分かれます。`inject` は最初に `hash` を受け取り、`user` があるかを見て、その値を次の `h` にします。次に `address`、最後に `city` を同じように確かめます。

途中で、ハッシュでなくなったり、キーがなかったりすると、`return false` で即座に終わります。

### 3. 最後まで行けば true

```ruby:line-numbers=227
      true
```

すべての段階で見つかったら、`true` を返します。

## ここがすごい

### 途中で抜けるための `return`

`inject` のブロックの中で `return` を使うと、メソッド全体から抜けられます。途中で 1 つでも足りなければ、残りの段を見る必要がないので、すぐ `false` で終わります。

### 型の確認を、キーの確認と一緒に

`params_hash_type?(h)` で、今の値がハッシュ（または設定された型）かを調べてから `key?` を呼びます。文字列などに対して `key?` を呼んでエラーになるのを防いでいます。

### 配列の書き方を一か所で除外

`[]` を含むキーは、最初の 1 行だけで除外しています。残りの処理は、ハッシュのキーだけを相手にすればよくなります。

## まとめ

- 入れ子のデータの存在を調べるときは、道筋を分けて一段ずつ確かめると、途中の型のエラーを防げます。
- `inject` は、途中の結果を次の入力に渡す処理に向いています。
- 対象外の書き方は最初に取り除くと、後の処理が単純になります。
