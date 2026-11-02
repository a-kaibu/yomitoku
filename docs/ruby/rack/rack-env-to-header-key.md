---
title: "「HTTP_ACCEPT_LANGUAGE」を「accept-language」に戻す"
description: "Rack の環境ハッシュのキーを、HTTP ヘッダの名前に直す。HTTP_ の接頭辞を外し、大文字の _ を小文字の - に変える。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/request.rb
lines: [144, 156]
function: "Rack::Request::Headers#env_to_header_key"
difficulty: 2
format: 2
tags: [文字列処理, ネットワーク, パース]
---

## ひとことで

`env_to_header_key` は、Rack の環境ハッシュ（`env`）のキーを、**HTTP ヘッダの名前** に戻すメソッドです。
`"HTTP_ACCEPT_LANGUAGE"` は `"accept-language"` に、`"CONTENT_TYPE"` は `"content-type"` になります。
Rack ではヘッダが `HTTP_` で始まる大文字の名前で保存されているので、その形式から利用者が使う名前へ戻す役目があります。

## コード

```ruby:line-numbers=144
      def env_to_header_key(k)
        case k
        when /\AHTTP_/
          k = k[5..-1]
          k.downcase!
          k.tr!('_', '-')
          k
        when "CONTENT_LENGTH", "CONTENT_TYPE"
          k = k.downcase
          k.tr!('_', '-')
          k
        end
      end
```

## 前提知識

- **Rack の env**: Web サーバーからアプリに渡される、リクエストの情報を入れたハッシュです。`HTTP_` で始まるキーはヘッダの値を表し、たとえば `Accept-Language` は `HTTP_ACCEPT_LANGUAGE` になります。
- **`case ... when /正規表現/`**: `when` の右側に正規表現を書くと、値がそれにマッチするかで分岐します。`/\AHTTP_/` は「`HTTP_` で始まる」です。
- **`k[5..-1]`**: 5 文字目から最後までを取り出します。`"HTTP_"` は 5 文字なので、その接頭辞を外せます。
- **`downcase!` と `tr!`**: `downcase!` は文字列を小文字に、`tr!('_', '-')` は `_` を `-` に、その場で書き換えます。
- **`case` の値**: どの `when` にも合わなければ、`case` 全体は `nil` を返します。

## 何をしているか

### 1. HTTP_ で始まるキーを処理する

```ruby:line-numbers=146
        when /\AHTTP_/
          k = k[5..-1]
          k.downcase!
          k.tr!('_', '-')
          k
```

`HTTP_` を外して、残りを小文字にし、`_` を `-` に置き換えます。`HTTP_ACCEPT_LANGUAGE` は `accept-language` になります。`k[5..-1]` は新しい文字列を作るので、呼び出し元の `k` は書き換えられません。

### 2. CONTENT_LENGTH と CONTENT_TYPE は接頭辞がない

```ruby:line-numbers=151
        when "CONTENT_LENGTH", "CONTENT_TYPE"
          k = k.downcase
          k.tr!('_', '-')
          k
```

この 2 つは `HTTP_` が付かないキーです。小文字にして `_` を `-` にすると、`content-length` や `content-type` になります。

### 3. どちらでもないキーは nil

上のどの `when` にも合わなければ、`case` の値は `nil` になります。ヘッダとして扱えないキーを、結果から除ける形です。

## ここがすごい

### 元のキーを壊さない

`k = k[5..-1]` や `k.downcase` は、新しい文字列を作ってから変更しています。そのため、渡された `env` のキーはそのまま残り、他の場所に影響しません。

### 2 つの場合を分けて書く

`HTTP_` 付きのものと、特別な 2 つのキーでは、接頭辞の扱いが違います。`when` の分岐で分けると、どちらの規則か一目で分かります。

### 逆変換と並べて読める

同じクラスの `header_to_env_key` が逆の変換をします。対にして読むと、名前の対応が理解しやすくなります。

## まとめ

- 環境変数のような名前から、利用者向けの名前へ戻すときは、接頭辞の扱いを分けて書くと分かりやすくなります。
- `k[5..-1]` のように新しい文字列を作ってから変えると、元の値を守れます。
- `case` で合わなければ `nil` になる性質を、「扱わないキー」の印として使えます。
