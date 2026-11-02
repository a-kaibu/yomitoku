---
title: "ETag を付けて、条件つきリクエストに応える"
description: "Sinatra の etag は、応答に ETag ヘッダを付け、If-None-Match や If-Match の条件を見て、304 や 412 で応答を打ち切る。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [621, 648]
function: "Sinatra::Helpers#etag"
difficulty: 3
format: 2
tags: ["キャッシュ", "ネットワーク", "API設計"]
---
## ひとことで

`Sinatra::Helpers#etag` は、応答に **ETag（内容の識別子）ヘッダを付け**、クライアントから届いた条件（`If-None-Match` や `If-Match`）に応じて、`304 Not Modified` や `412 Precondition Failed` で応答を打ち切るメソッドです。
内容が変わっていなければ本文を送らずに済み、更新を競合させないための確認にも使えます。

## コード

::: code-group

```ruby:line-numbers=621 [日本語訳]
    def etag(value, options = {})
      # この部分を変える前に、RFC 2616 の 14.24 節と 14.26 節を必ず確認すること。
      options      = { kind: options } unless Hash === options
      kind         = options[:kind] || :strong
      new_resource = options.fetch(:new_resource) { request.post? }

      unless ETAG_KINDS.include?(kind)
        raise ArgumentError, ':strong or :weak expected'
      end

      value = format('"%s"', value)
      value = "W/#{value}" if kind == :weak
      response['ETag'] = value

      return unless success? || status == 304

      if etag_matches?(env['HTTP_IF_NONE_MATCH'], new_resource)
        halt(request.safe? ? 304 : 412)
      end

      if env['HTTP_IF_MATCH']
        return if etag_matches?(env['HTTP_IF_MATCH'], new_resource)

        halt 412
      end

      nil
    end
```

```ruby:line-numbers=621 [原文]
    def etag(value, options = {})
      # Before touching this code, please double check RFC 2616 14.24 and 14.26.
      options      = { kind: options } unless Hash === options
      kind         = options[:kind] || :strong
      new_resource = options.fetch(:new_resource) { request.post? }

      unless ETAG_KINDS.include?(kind)
        raise ArgumentError, ':strong or :weak expected'
      end

      value = format('"%s"', value)
      value = "W/#{value}" if kind == :weak
      response['ETag'] = value

      return unless success? || status == 304

      if etag_matches?(env['HTTP_IF_NONE_MATCH'], new_resource)
        halt(request.safe? ? 304 : 412)
      end

      if env['HTTP_IF_MATCH']
        return if etag_matches?(env['HTTP_IF_MATCH'], new_resource)

        halt 412
      end

      nil
    end
```

:::

## 前提知識

- **ETag**: 応答の内容の識別子です。`"abc"` のように引用符で囲み、`W/` が付けば「弱い」比較を表します。
- **`If-None-Match`**: クライアントが持っている ETag を送り、「同じなら本文はいりません」と伝えるヘッダです。
- **`If-Match`**: 「この ETag の資源に対してだけ更新してよい」と伝えるヘッダです。
- **`304 Not Modified`**: 内容が変わっていないことを表す応答です。本文は送りません。
- **`412 Precondition Failed`**: 条件が満たされないことを表す応答です。
- **`format('"%s"', value)`**: 値を引用符で囲んだ文字列にします。

## 何をしているか

### 1. 種類と、新しい資源かどうかを決める

```ruby:line-numbers=623
      options      = { kind: options } unless Hash === options
      kind         = options[:kind] || :strong
      new_resource = options.fetch(:new_resource) { request.post? }

      unless ETAG_KINDS.include?(kind)
        raise ArgumentError, ':strong or :weak expected'
      end
```

オプションの指定を整えて、`:strong` か `:weak` のどちらかを選びます。それ以外は例外にします。`new_resource` は、既定では POST かどうかで決まります。

### 2. ETag をヘッダに入れる

```ruby:line-numbers=631
      value = format('"%s"', value)
      value = "W/#{value}" if kind == :weak
      response['ETag'] = value
```

値を引用符で囲み、弱い指定なら `W/` を付けて、`ETag` ヘッダに入れます。

### 3. 成功か 304 のときだけ、条件を確かめる

```ruby:line-numbers=635
      return unless success? || status == 304

      if etag_matches?(env['HTTP_IF_NONE_MATCH'], new_resource)
        halt(request.safe? ? 304 : 412)
      end
```

応答が成功か 304 なら、`If-None-Match` の一覧と照らします。一致すれば、安全なリクエストなら `304`、そうでなければ `412` で打ち切ります。

### 4. `If-Match` の条件を確かめる

```ruby:line-numbers=641
      if env['HTTP_IF_MATCH']
        return if etag_matches?(env['HTTP_IF_MATCH'], new_resource)

        halt 412
      end
```

`If-Match` があれば、一致しないときは `412` で打ち切ります。一致すれば、そのまま処理を続けます。

## ここがすごい

### 条件の順番で、無駄な本文を送らない

一致の確認を先に行うと、本文の計算を省けます。
応答の内容を作る前に ETag を決めるので、同じ内容なら、ほとんど通信量がかかりません。

### 安全なリクエストと、そうでないものを分ける

一致したとき、GET や HEAD なら `304`、それ以外なら `412` にします。
同じ条件でも、リクエストの性質によって、正しい応答を選んでいます。

### 比較の仕様を、注釈で守る

コメントには、RFC 2616 の 14.24 と 14.26 節を確かめてから変えるように書かれています。
HTTP の細かい規則を守るために、仕様を参照する約束が、コードの直前に書かれています。

## まとめ

- ETag は、内容の識別子として付けると、クライアントが無駄な再取得を避けられます。
- 条件の確認は、応答を作る前に行うと、通信と計算の両方を節約できます。
- HTTP の仕様に従う処理は、根拠になる仕様の箇所を注釈に残すと、後の変更で誤りを防げます。
