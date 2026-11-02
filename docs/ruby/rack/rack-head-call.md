---
title: "HEAD リクエストでは、本文を空にして返す"
description: "Rack::Head#call は、HEAD のリクエストに対して、本文を取り除いて返す。ヘッダはそのまま残るので、GET と同じ情報を確かめられる。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/head.rb
lines: [13, 22]
function: "Rack::Head#call"
difficulty: 1
format: 2
tags: ["ネットワーク", "API設計", "イディオム"]
---
## ひとことで

`Rack::Head#call` は、**HEAD リクエストに対して、本文を空にして応答を返す** ミドルウェアの処理です。
HEAD は、GET と同じヘッダを返すけれど、本文は送らない、という HTTP の仕様の要求です。
本文を持つ応答を作ったあとで、その本文を取り除きます。

## コード

```ruby:line-numbers=13
    def call(env)
      _, _, body = response = @app.call(env)

      if env[REQUEST_METHOD] == HEAD
        body.close if body.respond_to?(:close)
        response[2] = []
      end

      response
    end
```

## 前提知識

- **HEAD メソッド**: GET と同じ応答のヘッダを、本文なしで返すリクエストです。ファイルがあるか、大きさはどれくらいかを、本文を送らずに確かめられます。
- **Rack ミドルウェア**: アプリの前後で、リクエストや応答を加工する部品です。
- **`body.close`**: 本文が閉じられるべきものなら、それを閉じて、使っていた資源を解放します。
- **`respond_to?(:close)`**: 本文が `close` に応えるかを確かめます。
- **多重代入**: `_, _, body = response = ...` のように、配列の要素を変数に分けて受け取ります。`_` は使わない値を表します。

## 何をしているか

### 1. 応答を受け取る

```ruby:line-numbers=14
      _, _, body = response = @app.call(env)
```

アプリの応答を受け取ります。本文だけは、後で取り除くために、`body` という変数に入れておきます。

### 2. HEAD のときは、本文を閉じて空にする

```ruby:line-numbers=16
      if env[REQUEST_METHOD] == HEAD
        body.close if body.respond_to?(:close)
        response[2] = []
```

リクエストが HEAD なら、本文が閉じられるものかを確かめて、閉じます。そのあと、応答の本文を空の配列にします。

### 3. 応答を返す

```ruby:line-numbers=21
      response
```

ヘッダとステータスはそのままに、本文だけが空になった応答を返します。

## ここがすごい

### アプリの処理を変えずに、HEAD に対応する

アプリは、普通に GET の応答を作ります。
HEAD の対応を、ミドルウェアで一括して行うので、アプリごとに HEAD の処理を書く必要がありません。

### 本文を閉じてから捨てる

本文が、ファイルなどの資源を開いていることがあります。
捨てる前に `close` で閉じることで、資源の漏れを防いでいます。

### ヘッダは残す

HEAD の応答には、Content-Length などのヘッダが必要です。
本文だけを空にして、ヘッダを残すことで、クライアントは GET と同じ情報を確かめられます。

## まとめ

- 応答の本文だけを取り除く処理は、ミドルウェアにまとめると、アプリごとの対応が要りません。
- 捨てる前に資源を閉じると、ファイルなどのリソースを漏らさずに済みます。
- HEAD は本文を除くだけなので、ヘッダの情報を残すことが大切です。
