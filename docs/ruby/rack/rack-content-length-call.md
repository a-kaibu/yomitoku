---
title: "Content-Length を、本文から自動で計算する"
description: "Rack::ContentLength#call は、本文が配列で既に全部そろっているとき、そのバイト数を合計して Content-Length ヘッダを付ける。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/content_length.rb
lines: [19, 32]
function: "Rack::ContentLength#call"
difficulty: 2
format: 2
tags: ["ネットワーク", "API設計", "防御的プログラミング"]
---
## ひとことで

`Rack::ContentLength#call` は、アプリが **Content-Length（本文の長さ）を指定していない応答に、本文のバイト数を自動で付ける** ミドルウェアの処理です。
本文が配列としてすでに全部そろっているときだけ、長さを計算します。
ステータスが本文を持たない（304 など）場合や、`Transfer-Encoding` があるときは、何もしません。

## コード

```ruby:line-numbers=19
    def call(env)
      status, headers, body = response = @app.call(env)

      if !STATUS_WITH_NO_ENTITY_BODY.key?(status.to_i) &&
         !headers[CONTENT_LENGTH] &&
         !headers[TRANSFER_ENCODING] &&
         body.respond_to?(:to_ary)

        response[2] = body = body.to_ary
        headers[CONTENT_LENGTH] = body.sum(&:bytesize).to_s
      end

      response
    end
```

## 前提知識

- **Content-Length**: 本文のバイト数を表すヘッダです。受け取る側は、どこまで読めばよいかが分かります。
- **Transfer-Encoding**: 本文を分割して送る方式を指定するヘッダです。この方式のときは、長さを前もって書く必要がありません。
- **`body.to_ary`**: 本文が配列として取り出せるかを確かめるメソッドです。配列として全部そろっているものだけを対象にします。
- **`sum(&:bytesize)`**: 各要素のバイト数を、すべて足し合わせます。
- **多重代入**: `status, headers, body = response = ...` のように、配列の要素を複数の変数に分けて受け取ります。

## 何をしているか

### 1. 応答を受け取る

```ruby:line-numbers=20
      status, headers, body = response = @app.call(env)
```

アプリの応答（ステータス、ヘッダ、本文）を受け取ります。同時に `response` という変数にも入れておきます。

### 2. 長さを付けてよいかを調べる

```ruby:line-numbers=22
      if !STATUS_WITH_NO_ENTITY_BODY.key?(status.to_i) &&
         !headers[CONTENT_LENGTH] &&
         !headers[TRANSFER_ENCODING] &&
         body.respond_to?(:to_ary)
```

次の 3 つを満たすときだけ、長さを付けます。

- 本文を持つステータスである
- まだ `Content-Length` も `Transfer-Encoding` も無い
- 本文が配列に変換できる

### 3. 本文を配列にして、バイト数を入れる

```ruby:line-numbers=27
        response[2] = body = body.to_ary
        headers[CONTENT_LENGTH] = body.sum(&:bytesize).to_s
```

本文を配列に変えて、各要素のバイト数の合計を `Content-Length` に入れます。`response[2]` にも同じ本文を入れ直すので、応答の中身が一致します。

### 4. 応答を返す

```ruby:line-numbers=31
      response
```

変更を加えた応答を、そのまま返します。

## ここがすごい

### 本文の型で、安全な場合だけ計算する

本文が配列でなければ、全部を読み込まずに長さを知ることはできません。
`to_ary` で、すでにそろっているものだけに限ることで、読み込みを強いる副作用を避けています。

### 既存の指定を尊重する

アプリが長さを指定していれば、そのまま使います。ミドルウェアが勝手に上書きすると、アプリの意図と食い違うことがあります。

### 応答を入れ直して、整合性を保つ

本文を配列にしたら、応答の中の本文も同じものに置き換えます。
ヘッダと本文のどちらも、同じデータから作られるので、食い違いが起きません。

## まとめ

- 応答の長さは、本文がすでに全部そろっているときだけ、安全に計算できます。
- 既存のヘッダは上書きせず、無いときだけ補うと、利用者の指定を守れます。
- 変換した本文を応答に戻すと、ヘッダと本文が一致した状態を保てます。
