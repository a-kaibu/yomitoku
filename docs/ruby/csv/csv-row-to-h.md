---
title: "CSV の 1 行を、重複を除いたハッシュにする"
description: "CSV::Row#to_h は、ヘッダと値の組を、同じヘッダの 2 回目以降を捨てたハッシュにする。ブロックを渡すと、鍵と値を自由に作り直せる。"
language: ruby
project: "Ruby csv (標準ライブラリ)"
repo: https://github.com/ruby/csv
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (C) 2005-2016 James Edward Gray II. All rights reserved."
commit: "afbee5e3548d38914706ae0de8a6cf421ba43187"
file: lib/csv/row.rb
lines: [660, 683]
function: "CSV::Row#to_h"
difficulty: 2
format: 2
tags: ["データ構造", "ファイル", "イテレータ"]
---
## ひとことで

`CSV::Row#to_h` は、CSV の 1 行を **ヘッダの名前を鍵にしたハッシュ** に変えるメソッドです。
同じヘッダが 2 回出てきたら、最初の値だけを残します。ブロックを渡すと、鍵と値を自由に作り直せます。
`row.to_h` は `{"name" => "Ann", "age" => "3"}` のような、読みやすい形になります。

## コード

```ruby:line-numbers=660
    def to_h
      hash = {}

      if block_given?
        each do |key, _value|
          result = yield(key, self[key])
          result_array = Array.try_convert(result)
          raise TypeError, "wrong element type #{result.class} (expected array)" if result_array.nil?
          raise ArgumentError, "wrong array length (expected 2, was #{result_array.size})" unless result_array.size == 2

          key, value = result_array
          next if hash.key?(key)

          key.freeze if key.is_a?(String) && !key.frozen?
          hash[key] = value
        end
      else
        each do |key, _value|
          hash[key] = self[key] unless hash.key?(key)
        end
      end

      hash
    end
```

## 前提知識

- **`CSV::Row`**: CSV の 1 行を表すオブジェクトです。ヘッダと値の組を、順に保存しています。
- **ハッシュ**: 鍵と値の対応表です。鍵でその行の値を引けます。
- **`block_given?`**: ブロックが渡されたかを調べます。
- **`Array.try_convert`**: 値を配列として扱えるかを調べます。配列でなければ `nil` を返します。
- **`freeze`**: 文字列を変更できないようにします。鍵の文字列を、ハッシュの中で書き換えられないようにするためです。
- **`next`**: 繰り返しの今の回を終えて、次の回へ進みます。

## 何をしているか

### 1. ブロックがある場合は、鍵と値を作り直す

```ruby:line-numbers=663
      if block_given?
        each do |key, _value|
          result = yield(key, self[key])
          result_array = Array.try_convert(result)
          raise TypeError, "wrong element type #{result.class} (expected array)" if result_array.nil?
          raise ArgumentError, "wrong array length (expected 2, was #{result_array.size})" unless result_array.size == 2

          key, value = result_array
          next if hash.key?(key)

          key.freeze if key.is_a?(String) && !key.frozen?
          hash[key] = value
        end
```

ブロックには、鍵と値を渡し、戻り値は `[新しい鍵, 新しい値]` の 2 要素の配列であることを求めます。配列でない、または要素数が 2 でないと、型や長さのエラーにします。

同じ新しい鍵が既にあれば、`next` で飛ばします。最初の値を優先するためです。

### 2. ブロックがない場合は、そのまま組み立てる

```ruby:line-numbers=677
        each do |key, _value|
          hash[key] = self[key] unless hash.key?(key)
```

ブロックがなければ、ヘッダをそのまま鍵にして、同じ値を入れます。重複があれば、最初の値だけを残します。

### 3. ハッシュを返す

```ruby:line-numbers=682
      hash
    end
```

作ったハッシュを返します。

## ここがすごい

### 同じ鍵は、先に来た値を残す

CSV では、ヘッダが同じ名前で何度も現れることがあります。
`next if hash.key?(key)` によって、最初の列の値を一貫して使うことができます。

### 鍵の文字列を、変更されないように固定する

文字列の鍵は、後から書き換えられるとハッシュの仕組みが壊れます。
`freeze` によって、鍵を変更できない状態にしてから入れています。

### 戻り値の形を厳しく検査する

ブロックの戻り値が 2 要素の配列でないと、どの鍵と値を入れればよいか分かりません。
型と長さを先に確かめて、わかりやすいエラーで知らせています。

## まとめ

- 行をハッシュに変えるときは、重複の扱いを決めておくと、結果が予測できます。
- 鍵の文字列は、ハッシュに入れる前に固定すると、後の変更で壊れません。
- ブロックから返される形は、型と長さを検査すると、誤った使い方を早く見つけられます。
