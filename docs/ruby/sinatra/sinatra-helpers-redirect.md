---
title: "リダイレクトの番号を、HTTP の決まりで選ぶ"
description: "Sinatra の redirect は、HTTP/1.1 で GET 以外のときは 303、それ以外は 302 を返す。Location ヘッダには絶対 URL を入れて、処理を止める。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [310, 322]
function: "Sinatra::Helpers#redirect"
difficulty: 2
format: 2
tags: ["ネットワーク", "API設計", "イディオム"]
---
## ひとことで

`Sinatra::Helpers#redirect` は、利用者を **別の URL へ移動させる** 応答を作るメソッドです。
HTTP/1.1 で GET 以外のリクエスト（POST など）なら `303 See Other`、それ以外は `302 Found` を使います。
移動先は、絶対 URL にして `Location` ヘッダに入れ、そのあと処理を止めます。

## コード

::: code-group

```ruby:line-numbers=310 [日本語訳]
    def redirect(uri, *args)
      http_version = env['SERVER_PROTOCOL']
      if (http_version == 'HTTP/1.1') && (env['REQUEST_METHOD'] != 'GET')
        status 303
      else
        status 302
      end

      # RFC 2616 の 14.30 節によれば「フィールドの値は
      # 1 つの絶対 URI からなる」とされている
      response['Location'] = uri(uri.to_s, settings.absolute_redirects?, settings.prefixed_redirects?)
      halt(*args)
    end
```

```ruby:line-numbers=310 [原文]
    def redirect(uri, *args)
      http_version = env['SERVER_PROTOCOL']
      if (http_version == 'HTTP/1.1') && (env['REQUEST_METHOD'] != 'GET')
        status 303
      else
        status 302
      end

      # According to RFC 2616 section 14.30, "the field value consists of a
      # single absolute URI"
      response['Location'] = uri(uri.to_s, settings.absolute_redirects?, settings.prefixed_redirects?)
      halt(*args)
    end
```

:::

## 前提知識

- **リダイレクト**: 応答で「別の場所を見てください」と伝え、ブラウザに再度アクセスさせることです。
- **`Location` ヘッダ**: リダイレクト先の URL を入れるヘッダです。
- **ステータスコード 302 と 303**: どちらも「別の場所へ」という意味ですが、303 は「次は GET で見てください」という意味合いを持ちます。
- **`halt`**: 処理をその場で止めて、応答を返します。Sinatra の中で、途中の処理を打ち切るために使われます。
- **`env['SERVER_PROTOCOL']`**: 通信のプロトコル（`HTTP/1.1` など）を表す値です。

## 何をしているか

### 1. HTTP のバージョンと、リクエストの種類でステータスを決める

```ruby:line-numbers=311
      http_version = env['SERVER_PROTOCOL']
      if (http_version == 'HTTP/1.1') && (env['REQUEST_METHOD'] != 'GET')
        status 303
      else
        status 302
      end
```

HTTP/1.1 で、GET 以外の操作（フォームの送信など）のあとのリダイレクトは `303`、それ以外は `302` にします。`303` は、移動先を GET で見るように、ブラウザに伝える番号です。

### 2. 移動先の URL を絶対 URL にして入れる

```ruby:line-numbers=320
      response['Location'] = uri(uri.to_s, settings.absolute_redirects?, settings.prefixed_redirects?)
```

`Location` ヘッダに、`uri` で絶対化した移動先を入れます。RFC 2616 の仕様で、このヘッダには 1 つの絶対 URI が必要です。

### 3. 処理を止める

```ruby:line-numbers=321
      halt(*args)
```

`halt` で、後続の処理を行わずに応答を返します。`*args` は、本文やステータスを追加で指定するための引数です。

## ここがすごい

### 同じ「移動」でも、番号を使い分ける

POST の後に 302 で移動すると、ブラウザによっては、もう一度 POST を送ってしまうことがあります。
303 を使うと、「次は GET で移動先を見る」と明示できるので、この混乱を避けられます。
リクエストごとに番号を変えるのは、HTTP の決まりを正しく守るための工夫です。

### 移動先を必ず絶対化する

古い仕様では、`Location` に相対パスを書くことを認めない実装もありました。
`uri` を通すことで、どんな環境でも確実に解釈される URL を入れられます。

### 処理を `halt` で打ち切る

リダイレクトを指定した後に、ほかの処理が続くと、矛盾した応答が返るおそれがあります。
`halt` で、この時点で応答を確定させています。

## まとめ

- リダイレクトの番号は、HTTP の決まりとリクエストの種類で選ぶと、ブラウザの動きが安定します。
- ヘッダに入れる URL は、仕様に合う絶対 URL にします。
- 応答を確定させる処理（`halt`）は、後続の処理との矛盾を防ぎます。
