---
title: "認証の有無で、次の処理へ進むか、401 を返すかを決める"
description: "Basic 認証のミドルウェア。認証情報がなければ 401、形式が違えば 400 を返し、正しければユーザー名を env に入れて次のアプリを呼ぶ。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/auth/basic.rb
lines: [15, 29]
function: "Rack::Auth::Basic#call"
difficulty: 2
format: 2
tags: [セキュリティ, ネットワーク, 防御的プログラミング]
---

## ひとことで

`call` は、Basic 認証（ユーザー名とパスワードを `Authorization` ヘッダで送る方式）の **入り口** です。
認証が通れば、ユーザー名を `REMOTE_USER` に入れて、後ろのアプリを呼びます。通らなければ、そのまま `401`（認証が必要）や `400`（形式が正しくない）を返します。
Rack のミドルウェアは、このように「通すか、止めるか」を決める形で書かれています。

## コード

```ruby:line-numbers=15
      def call(env)
        auth = Basic::Request.new(env)

        return unauthorized unless auth.provided?

        return bad_request unless auth.basic?

        if valid?(auth)
          env['REMOTE_USER'] = auth.username

          return @app.call(env)
        end

        unauthorized
      end
```

## 前提知識

- **ミドルウェア**: リクエストとアプリの間に入り、リクエストを見てから後ろのアプリを呼ぶ（または呼ばずに返す）部品です。`call(env)` を持ちます。
- **`env`**: リクエストの情報が入ったハッシュです。ここにユーザー名を入れると、後のアプリが使えます。
- **`return 値 unless 条件`**: 条件が偽のとき、その値を返して処理を終えます。
- **`provided?` / `basic?`**: 認証情報があるか、Basic 方式か、を調べるメソッドです。
- **`@app.call(env)`**: 後ろにつながっているアプリを呼びます。

## 何をしているか

### 1. 認証情報を読む

```ruby:line-numbers=16
        auth = Basic::Request.new(env)
```

`env` から `Authorization` の情報を読み取る部品を作ります。

### 2. 情報がなければ 401、形式が違えば 400

```ruby:line-numbers=18
        return unauthorized unless auth.provided?

        return bad_request unless auth.basic?
```

認証情報が無ければ `unauthorized`（401）を返します。Basic 以外の方式なら、`bad_request`（400）を返します。どちらも後ろのアプリは呼ばれません。

### 3. 正しければ通す

```ruby:line-numbers=22
        if valid?(auth)
          env['REMOTE_USER'] = auth.username

          return @app.call(env)
        end
```

`valid?` で中身を確かめ、正しければユーザー名を `REMOTE_USER` に入れて、後ろのアプリに渡します。

### 4. 合わなければ 401

```ruby:line-numbers=28
        unauthorized
```

ユーザー名かパスワードが違うときは、401 を返します。

## ここがすごい

### 止める条件を先に並べる

失敗の理由ごとに `return` を並べ、それぞれ別の応答を返しています。読むと、「どの段階で止まるか」が上から順に分かります。

### 通したときだけ、アプリを呼ぶ

後ろのアプリは `valid?` が真のときにだけ呼ばれます。認証に失敗したリクエストが、アプリの中身まで届くことはありません。

### ユーザー名を env に残す

`REMOTE_USER` は CGI の慣習で使われる名前です。後のアプリは、認証済みのユーザーを同じ方法で取り出せます。

## まとめ

- ミドルウェアは、条件に合わないときに早く返すと、後ろの処理を守れます。
- 失敗の理由ごとに応答を分けると、利用者が原因を判断しやすくなります。
- 認証に通ったあとで得た情報は、env に入れて後ろに渡すのが Rack の作法です。
