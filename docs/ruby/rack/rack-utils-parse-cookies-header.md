---
title: "Cookie ヘッダを、名前と値の表に分ける"
description: "Rack::Utils.parse_cookies_header は「a=1; b=2」の形の Cookie ヘッダを、ハッシュにする。同じ名前は最初の 1 つだけを使う。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [327, 335]
function: "Rack::Utils.parse_cookies_header"
difficulty: 2
format: 2
tags: ["文字列処理", "パース", "ネットワーク"]
---
## ひとことで

`Rack::Utils.parse_cookies_header` は、ブラウザから届いた `Cookie` ヘッダ（例: `"a=1; b=2"`）を、**名前と値のハッシュ** に分けるメソッドです。
`"a=1; b=2"` は `{"a" => "1", "b" => "2"}` になります。
同じ名前の Cookie が 2 回来たときは、最初の 1 つだけを使います。

## コード

```ruby:line-numbers=327
    def parse_cookies_header(value)
      return {} unless value

      value.split(/; */n).each_with_object({}) do |cookie, cookies|
        next if cookie.empty?
        key, value = cookie.split('=', 2)
        cookies[key] = (unescape(value) rescue value) unless cookies.key?(key)
      end
    end
```

## 前提知識

- **Cookie**: サーバーがブラウザに預けて、次の通信で返してもらう小さなデータです。ヘッダの中では `名前=値` を `; ` で区切って並べます。
- **`split(/; */n)`**: 正規表現で区切ります。`; ` の後ろの空白の数は、0 個以上でよいという意味です。`n` は、バイト列として扱うための指定です。
- **`each_with_object({})`**: 結果を入れる空のハッシュを用意して、要素ごとに書き込みます。
- **`split('=', 2)`**: 最初の `=` でだけ 2 つに分けます。値の中に `=` があっても壊れません。
- **`rescue`（インライン）**: `(式 rescue 代わり)` の形で、エラーが出たら代わりの値を使います。
- **`key?`**: ハッシュにその鍵があるかを調べます。

## 何をしているか

### 1. Cookie を 1 つずつ区切る

```ruby:line-numbers=330
      value.split(/; */n).each_with_object({}) do |cookie, cookies|
        next if cookie.empty?
```

`; ` で分けた各 Cookie を順に見ます。空の部分は読み飛ばします。

### 2. 名前と値に分け、値を読み戻す

```ruby:line-numbers=332
        key, value = cookie.split('=', 2)
        cookies[key] = (unescape(value) rescue value) unless cookies.key?(key)
```

最初の `=` で、名前（`key`）と値（`value`）に分けます。値は `unescape` で URL の形式を元に戻します。読み戻せない値は、そのままの文字列にします。

### 3. 同じ名前は、最初の 1 つを残す

```ruby:line-numbers=333
        cookies[key] = (unescape(value) rescue value) unless cookies.key?(key)
```

`unless cookies.key?(key)` で、すでに登録された名前は上書きしません。ブラウザが複数送ってきた場合、先に来た値を優先する仕組みです。

## ここがすごい

### 最初の `=` だけで分ける

`split('=', 2)` は、値の中に `=` が含まれていても、正しく名前と値を分けます。
Base64 の値は末尾に `=` を持つことがあるので、この指定は実用上とても大切です。

### 壊れた値で処理を止めない

値が URL の形式として不正でも、`rescue` で元の文字列を使います。
1 つの Cookie の不具合で、リクエスト全体が失敗しないようにしています。

### 最初の値を優先する

Cookie は、同じ名前でも異なるパスなどから届くことがあります。
どれを使うかを、「先頭を優先」と決めることで、結果を予測しやすくしています。

## まとめ

- 区切り文字で分けるときは、分ける回数を指定すると、値の中の記号を守れます。
- 読み戻しに失敗しても、入力全体を止めない設計にすると、堅牢になります。
- 同じ名前が複数あるときの扱いは、先頭優先などのルールを決めておくと安心です。
