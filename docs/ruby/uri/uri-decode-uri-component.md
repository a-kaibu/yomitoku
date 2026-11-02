---
title: "%20 の形だけを、空白に戻す"
description: "URI.decode_uri_component は、%XX の形の部分だけを元の文字に戻す。+ は空白に直さないので、フォームのデータとパスの部分を区別して扱える。"
language: ruby
project: "Ruby uri (標準ライブラリ)"
repo: https://github.com/ruby/uri
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "32a7719ba907f77c0286ff318421d215a2b8ac99"
file: lib/uri/common.rb
lines: [441, 443]
function: "URI.decode_uri_component"
difficulty: 1
format: 2
tags: ["ネットワーク", "文字列処理", "Unicode"]
---
## ひとことで

`URI.decode_uri_component` は、URI の中の **`%XX` の形の部分だけを元の文字に戻す** メソッドです。
`URI.decode_uri_component("a%20b+c")` は `"a b+c"` になります。
`+` は空白に変えず、そのまま残します。

## コード

```ruby:line-numbers=441
  def self.decode_uri_component(str, enc=Encoding::UTF_8)
    _decode_uri_component(/%\h\h/, str, enc)
  end
```

## 前提知識

- **パーセントエンコーディング**: `%20` のように、`%` と 16 進数 2 桁で、記号や空白を表す形式です。
- **`+` の扱い**: フォームのデータでは、`+` は空白を表します。しかし、URI のパスや値の部分では、`+` はそのままの文字です。
- **正規表現 `/%\h\h/`**: `%` と、16 進数の 2 桁に一致するパターンです。`\h` は 16 進数の 1 文字を表します。
- **`enc`（エンコーディング）**: 復元した文字を、どの文字コードとして扱うかを決めます。既定は UTF-8 です。

## 何をしているか

### 1. `%XX` の部分だけを、対象にする

```ruby:line-numbers=442
    _decode_uri_component(/%\h\h/, str, enc)
```

正規表現 `/%\h\h/` に一致するもの、つまり `%20` のような形だけを対象にします。`+` や、その他の文字は対象になりません。

### 2. 共通の処理で、文字に戻す

```ruby:line-numbers=442
    _decode_uri_component(/%\h\h/, str, enc)
```

`_decode_uri_component` が、一致した部分を 16 進数として読み取り、対応する文字に変えます。文字コードの指定 `enc` も、そこで使われます。

## ここがすごい

### `+` を残すという、明確な区別

同じ「デコード」でも、`decode_www_form_component` は `+` を空白に変えます。
この関数は、URI の部品として `+` を残すので、どちらを使うかで結果が変わります。
用途に応じて関数を分けたことで、誤った変換を避けられます。

### 対象を、正規表現 1 つで決める

`%XX` だけを探すことで、余計な文字を変えずに済みます。
対象が明確なので、どこが変わるかを読み手が予測できます。

### 文字コードを指定できる

復元したバイト列が、どの文字コードの文字かは、指定しないと分かりません。
`enc` で決められるので、日本語などのマルチバイト文字も、正しく戻せます。

## まとめ

- 似た変換でも、記号の扱い（`+` など）が違う関数は、名前を分けると誤用を防げます。
- 対象を正規表現で絞ると、変換の範囲が明確になります。
- 文字の復元では、文字コードを指定できるようにすると、多言語にも対応できます。
