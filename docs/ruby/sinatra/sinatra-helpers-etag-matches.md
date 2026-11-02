---
title: "If-None-Match の一覧と、ETag を照らし合わせる"
description: "Sinatra の etag_matches? は、クライアントが送った ETag の一覧に、今の応答の ETag が含まれるかを調べる。* は、更新系のリクエストでだけ一致とみなす。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [709, 713]
function: "Sinatra::Helpers#etag_matches?"
difficulty: 2
format: 2
tags: ["ネットワーク", "キャッシュ", "パース"]
---
## ひとことで

`Sinatra::Helpers#etag_matches?` は、クライアントが送ってきた **ETag の一覧** の中に、今の応答の ETag が含まれているかを調べるメソッドです。
含まれていれば、内容が変わっていないと判断して、`304 Not Modified` の応答に使えます。
`*` が指定された場合は、リクエストの種類によって答えが変わります。

## コード

```ruby:line-numbers=709
    def etag_matches?(list, new_resource = request.post?)
      return !new_resource if list == '*'

      list.to_s.split(',').map(&:strip).include?(response['ETag'])
    end
```

## 前提知識

- **ETag**: 応答の内容を表す識別子です。内容が変わるたびに値も変わります。
- **If-None-Match**: クライアントが「この ETag と同じなら、本文はいりません」と伝えるヘッダです。ここでは、その一覧を `list` として受け取ります。
- **`*`**: 「どの ETag でも」という意味の印です。
- **`split(',').map(&:strip)`**: カンマで分けて、前後の空白を取り除きます。
- **`include?`**: 配列に、その値が含まれるかを調べます。
- **`request.post?`**: リクエストが POST かを調べます。

## 何をしているか

### 1. `*` は、リクエストの種類で決める

```ruby:line-numbers=710
      return !new_resource if list == '*'
```

一覧が `*` のとき、`new_resource` が偽なら `true` を返します。既定の `new_resource` は、POST かどうかを表します。つまり、新しい作成（POST）ではなく、既存の資源への問い合わせなら、一致とみなします。

### 2. 一覧を分けて、今の ETag を探す

```ruby:line-numbers=712
      list.to_s.split(',').map(&:strip).include?(response['ETag'])
```

一覧をカンマで分け、前後の空白を取り除いて、今の応答の `ETag` が含まれるかを `include?` で調べます。

## ここがすごい

### `*` の意味を、リクエストの種類で切り替える

`*` は「どんな資源でもよい」という意味ですが、POST で新しい資源を作るときは、既存の資源が無いことを確かめる必要があります。
このメソッドは、POST と GET で、`*` の意味を正しく変えています。

### 一覧の形のゆらぎを吸収する

ヘッダの一覧は、空白が入っていたり、ないことがあったりします。
`strip` と `split` を組み合わせて、どの書き方でも同じ判定になるようにしています。

### 文字列にそろえてから比べる

`list.to_s` とすることで、`nil` が渡されても例外にならず、空の一覧として扱えます。

## まとめ

- ETag の一致は、一覧を分けて、今の値と照らし合わせると簡単に判定できます。
- 特殊な印（`*`）の意味は、リクエストの種類によって変わる場合があるので、注意して扱います。
- 入力の空白や `nil` を先に整えると、判定が安定します。
