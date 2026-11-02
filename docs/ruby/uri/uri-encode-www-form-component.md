---
title: "フォームの値として文字列を安全に変換する"
description: "URI.encode_www_form_component は、フォーム送信用に文字列をパーセントエンコードする。空白は + にして、URL のパス用の変換表とは別の表を使う。"
language: ruby
project: "Ruby uri (標準ライブラリ)"
repo: https://github.com/ruby/uri
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "32a7719ba907f77c0286ff318421d215a2b8ac99"
file: lib/uri/common.rb
lines: [397, 399]
function: "URI.encode_www_form_component"
difficulty: 2
format: 2
tags: ["ネットワーク", "文字列処理", "イディオム"]
---
## ひとことで

`URI.encode_www_form_component` は、文字列を HTML フォームの送信形式に変換するメソッドです。
英数字と `*-._` 以外の文字をパーセントエンコードし、空白は `+` にします。

## コード

```ruby:line-numbers=397
  def self.encode_www_form_component(str, enc=nil)
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCWWWCOMP_, str, enc)
  end
```

## 前提知識

- **パーセントエンコード**: URL に使えない文字を、`%` と 16 進数の 2 桁で表す方法です。たとえば `&` は `%26` になります。
- **フォームの送信形式（`application/x-www-form-urlencoded`）**: HTML のフォームを送るときに使う形式です。空白を `+` で表します。
- **正規表現の否定（`[^...]`）**: 並べた文字以外に一致する指定です。ここでは、変換が必要な文字を見つけるために使います。
- **`enc`**: 結果の文字列の文字コードを指定する引数です。省略すると既定の値になります。
- **`self.` を付けた定義**: モジュール自身のメソッドを定義します。`URI.encode_www_form_component` の形で呼べます。

## 何をしているか

### 1. 変換が必要な文字を指定する

```ruby:line-numbers=398
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCWWWCOMP_, str, enc)
```

`/[^*\-.0-9A-Z_a-z]/` は、「`*`、`-`、`.`、数字、英大文字、`_`、英小文字のどれでもない文字」を表します。
この条件に当たる文字だけが、パーセントエンコードの対象になります。

### 2. 変換表を使ってエンコードする

```ruby:line-numbers=398
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCWWWCOMP_, str, enc)
```

`_encode_uri_component` に、上の正規表現と、変換表 `TBLENCWWWCOMP_` を渡します。
この表は、すべての 1 バイトに対応する `%XX` の値を持ち、空白だけは `+` に差し替えてあります。

### 3. 結果を返す

```ruby:line-numbers=398
    _encode_uri_component(/[^*\-.0-9A-Z_a-z]/, TBLENCWWWCOMP_, str, enc)
  end
```

エンコードされた文字列を返します。`enc` を渡すと、その文字コードの扱いで変換されます。

## ここがすごい

このメソッドの面白さは、同じ処理を表だけ変えて使い分けている点です。

同じ `URI` モジュールの `encode_uri_component` は、表 `TBLENCURICOMP_` を使い、空白を `%20` にします。こちらは URL のパス部分などに使われます。フォームの値とパスでは、空白の扱いが違うため、表を二つ用意しています。

注目すべきは、表を `TBLENCURICOMP_ = TBLENCWWWCOMP_.dup.freeze` と作ってから、`TBLENCWWWCOMP_[' '] = '+'` で書き換えている点です。元の表を一つ作り、一部だけを複製して変えるので、変換の本体は一つで済みます。

また、正規表現の否定によって、変換してはいけない文字を明示しています。`*` と `-`、`.`、`_` はそのまま残すことで、フォームの値として安全に読み戻せるようにしています。

## まとめ

`encode_www_form_component` は、正規表現で対象文字を絞り、フォーム向けの変換表でエンコードします。URL のパス向けとは表だけを変えて、同じ仕組みを共有しています。
