---
title: "「accept-language」を「HTTP_ACCEPT_LANGUAGE」に変える"
description: "HTTP ヘッダの名前を、Rack の環境ハッシュのキーに直す。大文字にして - を _ に変え、特別なヘッダ以外には HTTP_ を付ける。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/request.rb
lines: [158, 165]
function: "Rack::Request::Headers#header_to_env_key"
difficulty: 1
format: 2
tags: [文字列処理, ネットワーク, イディオム]
---

## ひとことで

`header_to_env_key` は、HTTP ヘッダの名前を **Rack の環境ハッシュ（env）で使うキー** に変換するメソッドです。
`"accept-language"` は `"HTTP_ACCEPT_LANGUAGE"` に、`"Content-Type"` は `"CONTENT_TYPE"` になります。
前の記事の `env_to_header_key` の逆向きの変換です。

## コード

```ruby:line-numbers=158
      def header_to_env_key(k)
        k = k.upcase
        k.tr!('-', '_')
        unless k == "CONTENT_LENGTH" || k == "CONTENT_TYPE"
          k = "HTTP_#{k}"
        end
        k
      end
```

## 前提知識

- **`upcase`**: 文字列を大文字にした新しい文字列を返します。
- **`tr!('-', '_')`**: `-` を `_` に、その場で置き換えます。
- **`unless 条件 ... end`**: 条件が偽のときだけ中身を実行します。`unless k == "A" || k == "B"` は「どちらでもないなら」です。
- **文字列の式展開 `"HTTP_#{k}"`**: 変数の値を埋め込んだ文字列を作ります。
- **`||`（または）**: どちらかが真なら真になります。

## 何をしているか

### 1. 大文字にして、区切りを変える

```ruby:line-numbers=159
        k = k.upcase
        k.tr!('-', '_')
```

`"accept-language"` は `"ACCEPT-LANGUAGE"` になり、次に `"ACCEPT_LANGUAGE"` になります。`upcase` が新しい文字列を作るので、元の `k` は変わりません。

### 2. 特別な 2 つは、そのまま

```ruby:line-numbers=161
        unless k == "CONTENT_LENGTH" || k == "CONTENT_TYPE"
          k = "HTTP_#{k}"
        end
```

`CONTENT_LENGTH` と `CONTENT_TYPE` は、CGI の仕様で `HTTP_` を付けない決まりになっています。それ以外のヘッダには `HTTP_` を付けます。

### 3. 変換結果を返す

最後の `k` が結果です。

## ここがすごい

### 例外を 2 つだけ書く

ヘッダの名前はたくさんありますが、接頭辞を付けないものは 2 つだけです。その 2 つを `unless` で書いておけば、残りのヘッダは全部同じ規則で変換できます。

### 逆変換との対応

`env_to_header_key` と対になっています。ヘッダの名前を env のキーに変えて、また戻すと元の名前になる、という性質を保つように作られています。

## まとめ

- 変換の規則が「ほとんど同じ、例外が少し」の場合は、例外だけを `unless` で書くと短くなります。
- 文字列を変換するときは、`upcase` のように新しい文字列を作る版を使うと、元の値を守れます。
- 同じ規則の逆向きの関数を並べて書くと、対応が確かめやすくなります。
