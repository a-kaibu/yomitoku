---
title: "Cookie の解析結果を覚えておき、ヘッダが変わったときだけ解析し直す"
description: "リクエストの Cookie を、使うたびに解析し直さないよう env に保存する。元の Cookie 文字列と比べて、変わったときだけ解析する。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/request.rb
lines: [378, 391]
function: "Rack::Request::Helpers#cookies"
difficulty: 3
format: 2
tags: [キャッシュ, ネットワーク, 最適化]
---

## ひとことで

`cookies` は、リクエストに含まれる **Cookie（ブラウザがサーバーに送る小さなデータ）** をハッシュにして返すメソッドです。
同じリクエストの中で何度呼ばれても、解析は最初の 1 回だけで済むように **結果を env に覚えておきます**。
さらに Cookie の文字列が変わっていれば、もう一度解析し直します。

## コード

```ruby:line-numbers=378
      def cookies
        hash = fetch_header(RACK_REQUEST_COOKIE_HASH) do |key|
          set_header(key, {})
        end

        string = get_header(HTTP_COOKIE)

        unless string == get_header(RACK_REQUEST_COOKIE_STRING)
          hash.replace Utils.parse_cookies_header(string)
          set_header(RACK_REQUEST_COOKIE_STRING, string)
        end

        hash
      end
```

## 前提知識

- **Cookie**: サーバーが `Set-Cookie` で渡し、ブラウザが次のリクエストで `Cookie` ヘッダとして返す、名前と値の組です。`a=1; b=2` のように並びます。
- **env への保存**: Rack では、同じリクエストの中で値を共有するために、env というハッシュに独自のキーで保存できます。
- **`fetch_header(キー) { ... }`**: env にそのキーがなければ、ブロックを実行して値を作り、保存します。
- **`hash.replace(新しいハッシュ)`**: ハッシュの中身を、新しいものに置き換えます。同じオブジェクトのまま中身だけ変えるので、保存した参照が有効なままになります。
- **`unless`**: 条件が偽のときだけ中身を実行します。

## 何をしているか

### 1. 保存場所を用意する

```ruby:line-numbers=379
        hash = fetch_header(RACK_REQUEST_COOKIE_HASH) do |key|
          set_header(key, {})
        end
```

env にまだ Cookie のハッシュがなければ、空のハッシュを作って保存します。2 回目以降は同じハッシュが返ります。

### 2. 今の Cookie 文字列を取り出す

```ruby:line-numbers=383
        string = get_header(HTTP_COOKIE)
```

### 3. 前回と違うときだけ解析し直す

```ruby:line-numbers=385
        unless string == get_header(RACK_REQUEST_COOKIE_STRING)
          hash.replace Utils.parse_cookies_header(string)
          set_header(RACK_REQUEST_COOKIE_STRING, string)
        end
```

前回解析したときの文字列も env に保存しておき、今の文字列と比べます。同じなら解析を飛ばします。違えば解析し直して、ハッシュの中身を置き換え、新しい文字列を覚えます。

### 4. ハッシュを返す

```ruby:line-numbers=390
        hash
```

## ここがすごい

### 「比べる」だけで無効化する

キャッシュを消す処理を書く代わりに、「覚えた文字列と今の文字列が同じか」を比べています。ヘッダが変わったときだけ解析し直すので、単純で間違えにくい作りです。

### 同じオブジェクトを使い続ける

`hash.replace` は、新しいハッシュを作って差し替えるのではなく、中身を入れ替えます。すでに受け取って持っている人にも、新しい内容が見えるようにするためです。

### 解析はミドルウェアではなく必要な時だけ

リクエストを処理する間、Cookie を使わない経路では解析が起きません。使われたときだけ、1 回解析するという遅延評価になっています。

## まとめ

- 計算結果を覚えるときは、元になった入力を一緒に保存しておくと、変わったかどうかを比べて確かめられます。
- 中身を入れ替えるには `replace` を使うと、参照を保ったまま更新できます。
- 必要になるまで処理しない（遅延評価）と、使われない経路の無駄を省けます。
