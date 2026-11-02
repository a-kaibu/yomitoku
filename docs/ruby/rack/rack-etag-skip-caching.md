---
title: "既にキャッシュの情報がある応答には、ETag を付けない"
description: "Rack::ETag#skip_caching? は、応答に ETag か Last-Modified がすでにあるかを確かめる。あれば、ミドルウェアが二重に付けないよう判断する。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/etag.rb
lines: [56, 58]
function: "Rack::ETag#skip_caching?"
difficulty: 1
format: 2
tags: ["キャッシュ", "ネットワーク", "イディオム"]
---
## ひとことで

`Rack::ETag#skip_caching?` は、応答に **すでにキャッシュの情報が付いているか** を調べて、ETag の付与を見送るべきかを判断するメソッドです。
応答のヘッダに `ETag` か `last-modified` があれば、`true` を返します。
アプリが自分で付けた情報を、ミドルウェアが上書きしないようにするための判断です。

## コード

```ruby:line-numbers=56
      def skip_caching?(headers)
        headers.key?(ETAG_STRING) || headers.key?('last-modified')
      end
```

## 前提知識

- **Last-Modified ヘッダ**: 資源が最後に変わった時刻を表すヘッダです。ETag と同じく、キャッシュの確認に使われます。
- **ヘッダの鍵**: Rack では、ヘッダの名前を小文字で扱うのが一般的です。`key?` でその名前があるかを調べられます。
- **`headers.key?`**: ハッシュにその鍵があるかを調べます。
- **定数 `ETAG_STRING`**: `"etag"` などの文字列を、名前として持つ定数です。

## 何をしているか

### 1. ETag があるか、Last-Modified があるかを調べる

```ruby:line-numbers=57
        headers.key?(ETAG_STRING) || headers.key?('last-modified')
```

ヘッダに `ETag` か `last-modified` のどちらかの鍵があれば、そのまま `true` を返します。

## ここがすごい

### 二重の付与を避ける

キャッシュの情報は、アプリが正確に決めている場合があります。
ミドルウェアが別の値で上書きすると、かえって正しいキャッシュが働きません。このメソッドは、その事態を防ぎます。

### 2 つの条件を、`||` で並べる

どちらかの情報があれば、キャッシュの仕組みは既にあるとみなします。
2 つの条件を 1 行で書いているので、判断の基準が明確です。

### 名前で、判断の内容を示す

`skip_caching?` は、「キャッシュの処理を飛ばす」という意味です。
呼び出し側は、この名前だけで、ETag を付けない理由が分かります。

## まとめ

- すでに情報がある場合は、ミドルウェアが上書きしないように判断します。
- 複数の候補のどれかがあれば十分な場合は、`||` で並べると簡潔になります。
- 判断の内容を名前で表すと、呼び出し側が理由をすぐ理解できます。
