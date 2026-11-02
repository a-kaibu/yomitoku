---
title: "Accept の好みに合う、応答の型を選ぶ"
description: "Sinatra の preferred_type は、クライアントの Accept ヘッダの順番に従って、サーバーが返せる MIME 型を 1 つ選ぶ。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [52, 62]
function: "Sinatra::Request#preferred_type"
difficulty: 3
format: 2
tags: ["ネットワーク", "パース", "アルゴリズム"]
---
## ひとことで

`Sinatra::Request#preferred_type` は、クライアントの `Accept` ヘッダの **好みの順番** に従って、サーバーが返せる MIME 型の中から **最も好まれるものを 1 つ選ぶ** メソッドです。
引数がなければ、クライアントが一番に希望した型を返します。
候補が 1 つも合わなければ、`nil` を返します。

## コード

```ruby:line-numbers=52
    def preferred_type(*types)
      return accept.first if types.empty?

      types.flatten!
      return types.first if accept.empty?

      accept.detect do |accept_header|
        type = types.detect { |t| MimeTypeEntry.new(t).accepts?(accept_header) }
        return type if type
      end
    end
```

## 前提知識

- **`Accept` ヘッダ**: クライアントが、受け取りたい形式（`text/html`、`application/json` など）を、好みの順番で送るヘッダです。
- **MIME 型**: `text/html` のように、データの形式を表す名前です。
- **`detect`**: 条件に当てはまる最初の要素を返します。見つからなければ `nil` です。
- **`return` を `detect` の中で使う**: ブロックの中の `return` は、外のメソッドを抜けて値を返します。ここでは、最初に合った型を、そのまま結果にします。
- **`flatten!`**: 配列の中の配列を、一段の配列に変えます。

## 何をしているか

### 1. 引数がなければ、一番の希望を返す

```ruby:line-numbers=53
      return accept.first if types.empty?
```

引数が無いときは、`Accept` の先頭（最も好まれる型）を返します。

### 2. 候補の型を、一列の配列にする

```ruby:line-numbers=55
      types.flatten!
      return types.first if accept.empty?
```

候補を `flatten!` で平らにし、`Accept` ヘッダが空なら、候補の先頭を返します。ヘッダが無い場合は、どの型でも構わないという扱いです。

### 3. 希望の順番に、候補を当てはめる

```ruby:line-numbers=58
      accept.detect do |accept_header|
        type = types.detect { |t| MimeTypeEntry.new(t).accepts?(accept_header) }
        return type if type
      end
```

`accept` の希望を先頭から順に見て、その希望を受け付ける候補があれば、その候補を返します。最初に見つかった希望が、最も優先されるものです。

## ここがすごい

### 希望の順番を、そのまま使う

候補の順番ではなく、クライアントの希望の順番で探します。
サーバーが優先したい型より、利用者が強く望む型を優先できます。

### 最初の一致で止める

`return` を使えば、最初の一致で探索を終えられます。
すべての組み合わせを調べる必要がないので、処理が速く、結果も分かりやすくなります。

### 候補がないときは、既定の型で続ける

`Accept` が空なら、候補の先頭を選びます。
クライアントが何も指定していなくても、必ず 1 つの型を返せるように設計されています。

## まとめ

- 内容の交渉（コンテントネゴシエーション）は、クライアントの希望の順に探すと、利用者の意向に沿えます。
- 最初に見つかったものを返すと、無駄な探索を避けられます。
- 希望がないときの既定値を決めておくと、応答が必ず決まります。
