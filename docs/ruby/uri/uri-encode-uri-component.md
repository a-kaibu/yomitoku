---
title: "空白を「%20」にして、URI の部品を符号化する"
description: "URI.encode_uri_component は、URI の部品に使えない文字を %XX の形に変える。空白は + ではなく %20 になり、フォーム用の関数と区別される。"
language: ruby
project: "Ruby uri (標準ライブラリ)"
repo: https://github.com/ruby/uri
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "32a7719ba907f77c0286ff318421d215a2b8ac99"
file: lib/uri/common.rb
lines: [436, 438]
function: "URI.encode_uri_component"
difficulty: 2
format: 2
tags: ["ネットワーク", "文字列処理", "Unicode"]
---
## ひとことで

`URI.encode_uri_component` は、文字列を **URI の部品として安全な形** に変えるメソッドです。
英数字と `*` `-` `.` `_` 以外の文字は、`%XX` の形（16 進数のバイト）に置き換えます。
空白は `+` ではなく `%20` になります。
`URI.encode_uri_component("a b/c")` は `"a%20b%2Fc"` になります。

## コード

```ruby:line-numbers=436
  def self.encode_uri_component(str, enc=nil)
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCURICOMP_, str, enc)
  end
```

## 前提知識

- **パーセントエンコーディング**: 記号や非 ASCII の文字を、`%` と 16 進数 2 桁のバイトで表す方式です。`/` は `%2F`、空白は `%20` です。
- **予約文字と非予約文字**: URI では、`/` や `?` などは構造を表す予約文字です。値の中に入れるときは、エンコードして区別をなくします。
- **正規表現の否定（`[^...]`）**: 並べた文字「以外」に一致します。ここでは、残してよい文字以外を探しています。
- **`enc`（エンコーディング）**: 文字の符号化方式です。`nil` のときは、文字列の元の方式を使います。
- **`_encode_uri_component`**: 共通の処理をまとめた内部メソッドです。対象の正規表現と変換表を受け取ります。

## 何をしているか

### 1. 残してよい文字以外を、対象にする

```ruby:line-numbers=437
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCURICOMP_, str, enc)
```

正規表現 `/[^*\-.0-9A-Z_a-z]/` は、`*`、`-`、`.`、数字、英大文字・小文字、`_` 以外の文字に一致します。これらが、エンコードの対象です。

### 2. 変換表を使って、%XX の形に置き換える

```ruby:line-numbers=437
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCURICOMP_, str, enc)
```

`TBLENCURICOMP_` は、1 バイトごとに、`%XX` の文字列を引くための表です。対象の文字を、その表で置き換えます。

### 3. 文字コードの指定を、共通の処理に渡す

```ruby:line-numbers=437
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCURICOMP_, str, enc)
```

`enc` は、そのまま共通の処理に渡されます。マルチバイト文字（日本語など）は、そのエンコーディングのバイト列として扱われます。

## ここがすごい

### 「残す文字」を 1 つの正規表現で決める

何を残すかを、否定の文字集合 1 つで書いています。
エンコードすべき文字の一覧を、長く書く必要がありません。

### 空白を `%20` にして、別の仕組みと区別する

フォームのデータでは、空白を `+` にする決まりがあります。
このメソッドは、URI のパスや値の部分に使うので、`%20` を使います。
同じ「エンコード」でも、用途ごとに別の関数に分けてあります。

### 表を使って、変換を速くする

文字ごとに 16 進数を計算すると、遅くなります。
変換表を前もって作っておき、1 バイトずつ引くことで、速く変換できます。

## まとめ

- URI の部品は、残す文字を決めて、それ以外を `%XX` にすると安全です。
- 似た関数でも、空白の扱いなど用途が違うものは、名前を分けると混乱を防げます。
- 変換の表を用意すると、繰り返しの処理が速くなります。
