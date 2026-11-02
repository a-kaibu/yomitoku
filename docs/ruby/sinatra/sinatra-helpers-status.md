---
title: "引数があるときだけ、応答のステータスを変える"
description: "Sinatra の status は、引数が渡されたときだけ応答のステータスを設定し、いつでも現在の値を返す。ステータス名も数値も受け付ける。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [288, 291]
function: "Sinatra::Helpers#status"
difficulty: 1
format: 2
tags: ["ネットワーク", "API設計", "イディオム"]
---
## ひとことで

`Sinatra::Helpers#status` は、応答のステータスコード（200、404 など）を **引数があれば設定し、いつでも現在の値を返す** メソッドです。
`status 404` と書くとステータスを変え、`status` だけなら今の値を読めます。
名前（`:not_found` など）でも数値でも渡せます。

## コード

```ruby:line-numbers=288
    def status(value = nil)
      response.status = Rack::Utils.status_code(value) if value
      response.status
    end
```

## 前提知識

- **ステータスコード**: 応答の結果を表す 3 桁の番号です。200 は成功、404 は見つからない、500 はサーバーの内部エラーです。
- **`response.status`**: 応答オブジェクトのステータスです。
- **`Rack::Utils.status_code`**: 名前（例: `:not_found`）を、数値のステータスコードに変えます。
- **`if value`**: 引数が渡されたかを調べます。省略されると `nil` です。
- **メソッドの戻り値**: 最後に評価した式の値が返ります。ここでは `response.status` です。

## 何をしているか

### 1. 引数があれば、ステータスを設定する

```ruby:line-numbers=289
      response.status = Rack::Utils.status_code(value) if value
```

引数が渡されたときだけ、`Rack::Utils.status_code` で数値に直してから設定します。名前でも数値でも、同じ結果になります。

### 2. 現在のステータスを返す

```ruby:line-numbers=290
      response.status
```

引数の有無にかかわらず、最後に今のステータスを返します。設定した直後の値を、そのまま受け取れます。

## ここがすごい

### 読み書きを 1 つのメソッドにまとめる

`status` と `status 200` の両方を、同じ名前で書けます。
ゲッターとセッターを別々の名前にせず、引数の有無で動きを切り替えるのは、Ruby らしい書き方です。

### 名前でも数字でも使える

`status :not_found` と `status 404` は同じ意味になります。
名前は読みやすく、数字は仕様の表と照らしやすいという、それぞれの利点を両方取れます。

### 値を書き換えても、読み戻せる

設定した値を、同じメソッドで読めるので、テストや途中の判断で状態を確かめやすくなります。

## まとめ

- 引数の有無で読み書きを切り替えると、名前が少なく済みます。
- 名前と数値の両方を受け取れると、読みやすさと仕様との対応を両立できます。
- 変更後の値を返すと、呼び出し側が状態をすぐ確認できます。
