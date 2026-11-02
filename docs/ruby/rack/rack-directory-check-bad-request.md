---
title: "不正なパスには、ほかの仕組みに任せる 400 応答"
description: "URL のパスが正しい形でないときに、本文が「Bad Request」の 400 応答を返す。x-cascade: pass を付けて、次の候補に処理を渡せるようにする。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/directory.rb
lines: [115, 122]
function: "Rack::Directory#check_bad_request"
difficulty: 1
format: 2
tags: [ネットワーク, エラー処理, 防御的プログラミング]
---

## ひとことで

`check_bad_request` は、URL のパスが **正しい形ではない** ときに、`400 Bad Request` の応答を作るメソッドです。
パスが正しければ `nil` を返し、呼び出し側に「問題なし」を伝えます。
応答には `x-cascade: pass` が付きます。これは「私は処理できなかったので、次の人に任せてほしい」という合図です。

## コード

```ruby:line-numbers=115
    def check_bad_request(path_info)
      return if Utils.valid_path?(path_info)

      body = "Bad Request\n"
      [400, { CONTENT_TYPE => "text/plain",
        CONTENT_LENGTH => body.bytesize.to_s,
        "x-cascade" => "pass" }, [body]]
    end
```

## 前提知識

- **Rack の応答**: `[ステータス, ヘッダのハッシュ, 本文の配列]` の 3 つの要素からなる配列です。
- **`x-cascade`**: Rack の `Cascade` という仕組みで、複数のアプリを順番に試すときに使われます。`pass` は「次へ回してほしい」の意味です。
- **`Utils.valid_path?`**: パスが正しい形かを調べるメソッドです。
- **`body.bytesize.to_s`**: 本文のバイト数を文字列にします。`Content-Length` ヘッダに入れるためです。
- **`return if 条件`**: 条件が真のとき、値を返さず（`nil` で）終わります。

## 何をしているか

### 1. 正しいパスなら何もしない

```ruby:line-numbers=116
      return if Utils.valid_path?(path_info)
```

パスが正しければ `nil` を返します。呼び出し側は、これを「問題なし」と判断します。

### 2. 不正なら 400 の応答を作る

```ruby:line-numbers=118
      body = "Bad Request\n"
      [400, { CONTENT_TYPE => "text/plain",
        CONTENT_LENGTH => body.bytesize.to_s,
        "x-cascade" => "pass" }, [body]]
```

本文は短いテキストです。ヘッダに種類とサイズを入れ、ステータス 400 と一緒に返します。

## ここがすごい

### 「nil か応答か」で判断を渡す

このメソッドは、問題があるかどうかを「応答があるか、`nil` か」で伝えます。`check_forbidden` と同じ形なので、`get` の中では `||` でまとめて試せます。

### x-cascade で次の人に任せる

`x-cascade: pass` があると、Rack の `Cascade` は、この応答を最終結果にせず、次のアプリに回せます。他の仕組みが同じパスを扱えるかもしれない、という余地を残しています。

### 本文の長さを正しく書く

`Content-Length` を本文のバイト数で書くのは、HTTP で正しい応答を返すための基本です。文字数ではなくバイト数を使う点が大事です。

## まとめ

- 「問題がなければ `nil`」という形にすると、複数の確認を `||` でつなげます。
- HTTP の応答は、ステータス、ヘッダ、本文の 3 つをそろえて返します。
- `Content-Length` は文字数ではなくバイト数で書くと、正しく届きます。
