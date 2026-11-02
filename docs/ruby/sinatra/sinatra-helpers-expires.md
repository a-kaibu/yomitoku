---
title: "有効期限を、秒数か日時で指定する"
description: "Sinatra の expires は、秒数または日時から Cache-Control の max-age と Expires ヘッダを同時に作る。日時のときは、残りの秒数を計算する。"
language: ruby
project: "Sinatra"
repo: https://github.com/sinatra/sinatra
license: "MIT"
copyright: "Copyright (c) 2007, 2008, 2009 Blake Mizerany"
commit: "cb22afd7902b566b6eaba6c4ea89739494a65d12"
file: lib/sinatra/base.rb
lines: [566, 581]
function: "Sinatra::Helpers#expires"
difficulty: 2
format: 2
tags: ["キャッシュ", "ネットワーク", "API設計"]
---
## ひとことで

`Sinatra::Helpers#expires` は、応答の **有効期限** を設定するメソッドです。
秒数で指定すると、「今から何秒間は使ってよい」を表す `max-age` と `Expires` ヘッダを作ります。
日時で指定すると、そこまでの残りの秒数を計算して、同じように両方を設定します。

## コード

```ruby:line-numbers=566
    def expires(amount, *values)
      values << {} unless values.last.is_a?(Hash)

      if amount.is_a? Integer
        time    = Time.now + amount.to_i
        max_age = amount
      else
        time    = time_for amount
        max_age = time - Time.now
      end

      values.last.merge!(max_age: max_age) { |_key, v1, v2| v1 || v2 }
      cache_control(*values)

      response['Expires'] = time.httpdate
    end
```

## 前提知識

- **キャッシュ**: 一度受け取った応答を、ブラウザや中間の仲介が保存して、次から再利用する仕組みです。
- **`Cache-Control` の `max-age`**: 保存してよい秒数を表します。
- **`Expires` ヘッダ**: 有効期限の日時を、HTTP の日時形式で表します。
- **`httpdate`**: 時刻を HTTP の決まった形式の文字列にします。
- **`merge!` とブロック**: 同じ鍵があったときに、ブロックで値を選びながら、ハッシュを合わせます。

## 何をしているか

### 1. 最後の引数がハッシュでなければ、空のハッシュを足す

```ruby:line-numbers=567
      values << {} unless values.last.is_a?(Hash)
```

`Cache-Control` の追加設定を入れる場所を、最後の引数として確保します。

### 2. 秒数か日時かで、有効期限を計算する

```ruby:line-numbers=569
      if amount.is_a? Integer
        time    = Time.now + amount.to_i
        max_age = amount
      else
        time    = time_for amount
        max_age = time - Time.now
      end
```

整数なら、今の時刻に秒数を足して期限にし、`max_age` はその秒数です。日時なら、`time_for` で時刻に直し、残りの秒数を `max_age` にします。

### 3. `max-age` を入れて、`Cache-Control` を設定する

```ruby:line-numbers=577
      values.last.merge!(max_age: max_age) { |_key, v1, v2| v1 || v2 }
      cache_control(*values)
```

`merge!` で `max_age` を入れます。同じ鍵が既にあれば、既存の値を優先します。そのあと `cache_control` に渡して、`Cache-Control` ヘッダを作ります。

### 4. `Expires` ヘッダを設定する

```ruby:line-numbers=580
      response['Expires'] = time.httpdate
```

期限の時刻を HTTP の日時形式にして、`Expires` ヘッダに入れます。

## ここがすごい

### 2 つのヘッダを、同じ情報から作る

`max-age` と `Expires` は、どちらも同じ期限を表します。
引数を 1 回解釈して、両方のヘッダへ同じ値を流すので、食い違いが起きません。

### 既存の設定を優先する

`merge!` のブロックで、既存の `max_age` があればそれを残します。
後から呼び出した `expires` が、先に決まっていた設定を勝手に上書きしないようにしています。

### 型によって計算を切り替える

秒数と日時では、必要な計算が違います。
`is_a? Integer` で分けて、それぞれの計算をすることで、利用者はどちらの形でも書けます。

## まとめ

- 有効期限は、ヘッダを複数使うときに、同じ情報から作ると食い違いを防げます。
- 既存の設定を残すルールを決めると、後から呼ばれたものが上書きしません。
- 秒数と日時のような入力の違いは、型で分けて計算すると、わかりやすくなります。
