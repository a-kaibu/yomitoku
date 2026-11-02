---
title: "リクエストの場所から、絶対 URL を組み立てる"
description: "Sinatra の uri は、相対パスを、今のリクエストの https や host、スクリプトの場所を使って絶対 URL にする。すでに URL なら、そのまま返す。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [326, 341]
function: "Sinatra::Helpers#uri"
difficulty: 2
format: 2
tags: ["ネットワーク", "API設計", "文字列処理"]
---
## ひとことで

`Sinatra::Helpers#uri` は、アプリの中で書いた **相対的なパス**（例: `"/users"`）を、今のリクエストの情報を使って **完全な URL**（例: `https://example.com/users`）に変えるメソッドです。
すでに `http:` のような形で始まる URL なら、何もせずにそのまま返します。
リダイレクト先や、メール本文のリンクづくりに使われます。

## コード

```ruby:line-numbers=326
    def uri(addr = nil, absolute = true, add_script_name = true)
      return addr if addr.to_s =~ /\A[a-z][a-z0-9+.\-]*:/i

      uri = [host = String.new]
      if absolute
        host << "http#{'s' if request.secure?}://"
        host << if request.forwarded? || (request.port != (request.secure? ? 443 : 80))
                  request.host_with_port
                else
                  request.host
                end
      end
      uri << request.script_name.to_s if add_script_name
      uri << (addr || request.path_info).to_s
      File.join uri
    end
```

## 前提知識

- **絶対 URL と相対パス**: `https://example.com/a` は、どこからでも同じ場所を指す絶対 URL です。`/a` は、同じサイトの中の位置だけを表す相対パスです。
- **スキーム**: URL の先頭にある `http` や `https` などの種類の部分です。
- **`request.secure?`**: 今の通信が HTTPS かを調べます。
- **`request.forwarded?`**: リバースプロキシなど、前段の仲介を経由して届いたリクエストかを調べます。
- **`script_name`**: アプリが公開されている途中のパスです。サブディレクトリに置いたときに付きます。
- **`File.join`**: パスの各部分を `/` でつなぎます。二重の `/` を避けられます。

## 何をしているか

### 1. すでに URL なら、そのまま返す

```ruby:line-numbers=327
      return addr if addr.to_s =~ /\A[a-z][a-z0-9+.\-]*:/i
```

先頭が「英字で始まるスキーム とコロン」なら、すでに完全な URL です。そのまま返します。

### 2. 絶対 URL の土台（スキームとホスト）を作る

```ruby:line-numbers=329
      uri = [host = String.new]
      if absolute
        host << "http#{'s' if request.secure?}://"
        host << if request.forwarded? || (request.port != (request.secure? ? 443 : 80))
                  request.host_with_port
                else
                  request.host
                end
      end
```

HTTPS なら `https://`、そうでなければ `http://` を付けます。ホストは、プロキシを経由しているときや、標準でないポートを使っているときは、ポートも含めた `host_with_port` にします。標準ポートなら、ホスト名だけで十分です。

### 3. スクリプトの場所と、パスを足す

```ruby:line-numbers=338
      uri << request.script_name.to_s if add_script_name
      uri << (addr || request.path_info).to_s
      File.join uri
```

`script_name` を入れ、続けて `addr` かリクエストのパスを足します。`File.join` で区切りを整えて、完成した URL を返します。

## ここがすごい

### 「必要なときだけ」ポートを付ける

標準ポートを付けると、URL が長くなり、見た目も冗長になります。
このメソッドは、ポートが 80 や 443 の標準なら省き、そうでなければ残します。
結果として、読みやすい URL を、通信の条件に合わせて作れます。

### プロキシの裏側でも正しい場所を作る

アプリはプロキシの内側で動くことが多いので、ホスト名が外から見たものと違うことがあります。
`forwarded?` を見て、外向きの情報を優先することで、利用者に正しいリンクを返せます。

### 既存の URL を壊さない

先頭にスキームがあるものは、そのまま返します。
「相対パスを渡されたら絶対化、絶対 URL ならそのまま」という一本の規則で、どちらの入力にも対応できます。

## まとめ

- URL を組み立てるときは、通信の種類（HTTP か HTTPS）と、外から見たホストを使うと正確になります。
- すでに完全な URL のものは、二重に処理しないよう、先に判定します。
- 区切りの `/` は、`File.join` のような部品に任せると、間違いを防げます。
