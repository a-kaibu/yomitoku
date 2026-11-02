---
title: "応答を圧縮してよいか、条件を順に確かめる"
description: "Rack::Deflater#should_deflate? は、本文が空・変換禁止・既に符号化済み・対象外の型などの場合を除いて、応答を gzip などで圧縮するかを決める。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/deflater.rb
lines: [151, 171]
function: "Rack::Deflater#should_deflate?"
difficulty: 3
format: 2
tags: ["ネットワーク", "API設計", "防御的プログラミング"]
---
## ひとことで

`Rack::Deflater#should_deflate?` は、応答を **gzip などで圧縮してよいかを判断する** メソッドです。
本文が空、変換を禁止されている、すでに符号化されている、対象の型でない、といった場合を順に除外します。
すべての条件を通ったときだけ `true` を返します。

## コード

::: code-group

```ruby:line-numbers=151 [日本語訳]
    def should_deflate?(env, status, headers, body)
      # 本文が空の応答や、
      # no-transform が指定された応答は圧縮しない。
      if Utils::STATUS_WITH_NO_ENTITY_BODY.key?(status.to_i) ||
          /\bno-transform\b/.match?(headers[CACHE_CONTROL].to_s) ||
          headers['content-encoding']&.!~(/\bidentity\b/)
        return false
      end

      # 圧縮対象の型が指定されていて、この応答の型が含まれなければ圧縮しない
      return false if @compressible_types && !(headers.has_key?(CONTENT_TYPE) && @compressible_types.include?(headers[CONTENT_TYPE][/[^;]*/]))

      # 条件のラムダが指定されていて、偽を返すなら圧縮しない
      return false if @condition && !@condition.call(env, status, headers, body)

      # 空の本文は圧縮しても意味がない。また、
      # Rack::Sendfile との併用もここで扱える。
      return false if headers[CONTENT_LENGTH] == '0'

      true
    end
```

```ruby:line-numbers=151 [原文]
    def should_deflate?(env, status, headers, body)
      # Skip compressing empty entity body responses and responses with
      # no-transform set.
      if Utils::STATUS_WITH_NO_ENTITY_BODY.key?(status.to_i) ||
          /\bno-transform\b/.match?(headers[CACHE_CONTROL].to_s) ||
          headers['content-encoding']&.!~(/\bidentity\b/)
        return false
      end

      # Skip if @compressible_types are given and does not include request's content type
      return false if @compressible_types && !(headers.has_key?(CONTENT_TYPE) && @compressible_types.include?(headers[CONTENT_TYPE][/[^;]*/]))

      # Skip if @condition lambda is given and evaluates to false
      return false if @condition && !@condition.call(env, status, headers, body)

      # No point in compressing empty body, also handles usage with
      # Rack::Sendfile.
      return false if headers[CONTENT_LENGTH] == '0'

      true
    end
```

:::

## 前提知識

- **圧縮（gzip など）**: データを小さくする符号化です。通信量を減らせますが、CPU の仕事は増えます。
- **Cache-Control の `no-transform`**: 中間の仲介者に、本文を変換しないように求める指示です。
- **`Content-Encoding`**: 本文がすでに符号化されているかを示すヘッダです。
- **`@compressible_types`**: 圧縮の対象にする型の一覧です。
- **`@condition`**: 利用者が決める、圧縮するかどうかのラムダ（無名関数）です。
- **`return false if 条件`**: 条件が真のとき、その場で `false` を返します。

## 何をしているか

### 1. 圧縮しない明らかな場合を、先に除く

```ruby:line-numbers=154
      if Utils::STATUS_WITH_NO_ENTITY_BODY.key?(status.to_i) ||
          /\bno-transform\b/.match?(headers[CACHE_CONTROL].to_s) ||
          headers['content-encoding']&.!~(/\bidentity\b/)
        return false
      end
```

ステータスが本文を持たない場合、`no-transform` の指定がある場合、すでに別の符号化がされている場合は、`false` を返します。

### 2. 対象の型かを確かめる

::: code-group

```ruby:line-numbers=160 [日本語訳]
      # 圧縮対象の型が指定されていて、この応答の型が含まれなければ圧縮しない
      return false if @compressible_types && !(headers.has_key?(CONTENT_TYPE) && @compressible_types.include?(headers[CONTENT_TYPE][/[^;]*/]))
```

```ruby:line-numbers=160 [原文]
      # Skip if @compressible_types are given and does not include request's content type
      return false if @compressible_types && !(headers.has_key?(CONTENT_TYPE) && @compressible_types.include?(headers[CONTENT_TYPE][/[^;]*/]))
```

:::

圧縮対象の型が指定されているのに、この応答の型（`;` より前の部分）が含まれないなら、圧縮しません。

### 3. 利用者の条件を確かめる

::: code-group

```ruby:line-numbers=163 [日本語訳]
      # 条件のラムダが指定されていて、偽を返すなら圧縮しない
      return false if @condition && !@condition.call(env, status, headers, body)
```

```ruby:line-numbers=163 [原文]
      # Skip if @condition lambda is given and evaluates to false
      return false if @condition && !@condition.call(env, status, headers, body)
```

:::

`@condition` が指定されていて、その結果が偽なら、圧縮しません。

### 4. 空の本文を除く

::: code-group

```ruby:line-numbers=166 [日本語訳]
      # 空の本文は圧縮しても意味がない。また、
      # Rack::Sendfile との併用もここで扱える。
      return false if headers[CONTENT_LENGTH] == '0'
```

```ruby:line-numbers=166 [原文]
      # No point in compressing empty body, also handles usage with
      # Rack::Sendfile.
      return false if headers[CONTENT_LENGTH] == '0'
```

:::

`Content-Length` が `0` なら、圧縮しても意味がないので、`false` を返します。

### 5. すべて通れば、圧縮する

```ruby:line-numbers=170
      true
```

どの除外にも当てはまらなければ、`true` を返します。

## ここがすごい

### 安い判断から順に、除外する

ステータスやヘッダの確認は、どれも軽い処理です。重い処理（利用者のラムダ）は、最後に回しています。
不要な処理を減らすため、判断の順番を工夫しています。

### 規則を 1 つずつ、1 行で書く

それぞれの除外は、1 つの `return false if` で書かれています。
読み手は、どの条件で圧縮しないのかを、上から一行ずつ確かめられます。

### 利用者に、最終的な決定権を残す

`@condition` で、利用者が独自の判断を追加できます。
ミドルウェアの規則と、アプリごとの事情を、両方満たす形になっています。

## まとめ

- 圧縮の判断は、軽い確認から順に行い、重い判断を後に回すと効率的です。
- 除外の条件は、1 つずつ `return false if` で書くと、読み手が理解しやすくなります。
- 利用者が条件を足せるようにすると、汎用の部品でも個別の事情に対応できます。
