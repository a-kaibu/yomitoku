---
title: "「text/html; charset=utf-8」の後ろの条件を、キーと値のハッシュにする"
description: "Content-Type ヘッダの「;」や「,」で区切られた条件部分を、名前（小文字）と値のハッシュにする。最初の型の部分は取り除く。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/media_type.rb
lines: [34, 43]
function: "Rack::MediaType.params"
difficulty: 2
format: 2
tags: [パース, 文字列処理, イディオム]
---

## ひとことで

`params` は、`Content-Type` のような **「型;名前=値」の形の文字列** から、後ろの条件部分だけを取り出してハッシュにするメソッドです。
`"text/html; charset=UTF-8"` からは `{"charset" => "UTF-8"}` が得られます。
型の部分（`text/html`）は、このメソッドでは扱いません。

## コード

```ruby:line-numbers=34
      def params(content_type)
        return {} if content_type.nil? || content_type.empty?

        content_type.split(SPLIT_PATTERN)[1..-1].each_with_object({}) do |s, hsh|
          s.strip!
          k, v = s.split('=', 2)
          k.downcase!
          hsh[k] = strip_doublequotes(v)
        end
      end
```

## 前提知識

- **`Content-Type`**: レスポンスやリクエストで、中身の種類を表すヘッダです。`text/html; charset=utf-8` のように、型の後ろに `;` で条件を付けることがあります。
- **`split(パターン)`**: 区切りで分けて配列にします。`[1..-1]` で、最初の要素（型の部分）を飛ばして残りを取り出せます。
- **`each_with_object({})`**: 空のハッシュを用意して、各要素の結果をそこに集めます。
- **`strip!` と `downcase!`**: 前後の空白を取る、小文字にする、という変更を、その場で行います。
- **`strip_doublequotes(v)`**: 同じクラスにある補助のメソッドです。値を囲む `"` を取り除きます。
- **`content_type.nil? || content_type.empty?`**: 値がないか、空かを調べます。

## 何をしているか

### 1. 何もなければ空のハッシュ

```ruby:line-numbers=35
        return {} if content_type.nil? || content_type.empty?
```

ヘッダがない、または空なら、条件のない `{}` を返します。

### 2. 型の部分を飛ばして、条件を区切る

```ruby:line-numbers=37
        content_type.split(SPLIT_PATTERN)[1..-1].each_with_object({}) do |s, hsh|
```

`SPLIT_PATTERN` は `;` または `,` です。`"text/html; charset=UTF-8"` を区切ると、`["text/html", " charset=UTF-8"]` になります。`[1..-1]` で、先頭の型の部分を外します。

### 3. 1 つずつ、名前と値に分けて入れる

```ruby:line-numbers=38
          s.strip!
          k, v = s.split('=', 2)
          k.downcase!
          hsh[k] = strip_doublequotes(v)
```

` charset=UTF-8` の前後の空白を取り、`=` で 2 つに分けます。名前は小文字にし（`Charset` と `charset` を同じにするため）、値は前後の `"` を外して入れます。

## ここがすごい

### 型と条件を、ひとつの分け方で扱う

`split` に `[1..-1]` を付けるだけで、型の部分を捨てる処理が 1 つの式に収まっています。型の情報は、別の場所（`MediaType.type`）で取り出す分担です。

### 名前の大小を揃える

HTTP のヘッダの名前は大文字小文字の違いを区別しない決まりです。`downcase!` で揃えておけば、後で `hsh["charset"]` と書くだけで確実に取り出せます。

### 空白の揺れに強い

`strip!` を先に行うので、`text/html;charset=UTF-8` と `text/html; charset=UTF-8` のように、空白の有無が違っても同じ結果になります。

## まとめ

- 区切りで分けたとき、先頭の要素だけを別に扱うなら、`[1..-1]` で残りを取り出すと簡潔です。
- 名前は大小を揃えて入れると、後の取り出しで迷わなくなります。
- 入力の空白の揺れは、分ける前後で整えると、同じ結果になります。
