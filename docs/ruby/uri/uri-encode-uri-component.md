---
title: "URL の部品として文字列を変換する"
description: "URI.encode_uri_component は、URL の部品として文字列をパーセントエンコードする。空白は %20 にし、フォーム用の + とは区別する。"
language: ruby
project: "Ruby uri (標準ライブラリ)"
repo: https://github.com/ruby/uri
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "32a7719ba907f77c0286ff318421d215a2b8ac99"
file: lib/uri/common.rb
lines: [436, 438]
function: "URI.encode_uri_component"
difficulty: 1
format: 2
tags: ["ネットワーク", "文字列処理", "イディオム"]
---
## ひとことで

`URI.encode_uri_component` は、文字列を URL の部品としてパーセントエンコードするメソッドです。
`URI.encode_www_form_component` と似ていますが、空白を `+` ではなく `%20` にします。

## コード

```ruby:line-numbers=436
  def self.encode_uri_component(str, enc=nil)
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCURICOMP_, str, enc)
  end
```

## 前提知識

- **パーセントエンコード**: URL に使えない文字を、`%` と 16 進数の 2 桁で表す方法です。
- **フォームの形式と URL の部品の違い**: フォームでは空白を `+` で表しますが、URL のパスやクエリ部分では `%20` を使うのが一般的です。
- **変換表**: 1 バイトごとに、エンコード後の文字列を引くための対応表です。
- **`enc=nil`**: 文字コードの指定を省略できる引数です。

## 何をしているか

### 1. 変換が必要な文字を正規表現で指定する

```ruby:line-numbers=437
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCURICOMP_, str, enc)
```

`/[^*\-.0-9A-Z_a-z]/` に当たらない文字はそのまま残し、それ以外をエンコードします。

### 2. URL 用の変換表を使う

```ruby:line-numbers=437
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCURICOMP_, str, enc)
```

`TBLENCURICOMP_` は、空白を `%20` に変換する表です。フォーム用の表とは、この一点だけが違います。

## ここがすごい

このメソッドは、本体の処理を `_encode_uri_component` に任せ、違いを変換表だけで表しています。フォーム用と URL 用で、コードが重複しません。

コメントにあるとおり、このメソッドは `encode_www_form_component` と組になっています。どちらを使うかで、空白の扱いが変わることを、名前と表の二つで明確にしています。

## まとめ

`encode_uri_component` は、正規表現で対象を決め、URL 用の変換表で空白を `%20` にします。同じ処理を表だけで切り替えることで、フォーム用と URL 用を両立させています。
