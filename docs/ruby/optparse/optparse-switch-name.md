---
title: "オプションの名前から、ハイフンを取り除く"
description: "OptionParser::Switch#switch_name は、--verbose のような長い名前を先に選び、先頭のハイフンと --[no-] の印を取り除く。"
language: ruby
project: "Ruby optparse (標準ライブラリ)"
repo: https://github.com/ruby/optparse
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "39a3901c9fe802189d7c7fde27675a9944a8f32b"
file: lib/optparse.rb
lines: [665, 667]
function: "OptionParser::Switch#switch_name"
difficulty: 1
format: 2
tags: ["CLI", "文字列処理", "イディオム"]
---
## ひとことで

`OptionParser::Switch#switch_name` は、オプションの **名前（例: `verbose`）だけを取り出す** メソッドです。
`--[no-]verbose` という定義なら、`verbose` になります。
長い名前があればそれを使い、なければ短い名前を使います。

## コード

```ruby:line-numbers=665
    def switch_name
      (long.first || short.first).sub(/\A-+(?:\[no-\])?/, '')
    end
```

## 前提知識

- **長い名前と短い名前**: `--verbose` は長い名前、`-v` は短い名前です。
- **`--[no-]verbose`**: 「`--verbose` も `--no-verbose` も使える」という定義の書き方です。
- **`||`（または）**: 左の値が `nil` なら右を使います。`long.first` が無いときは、`short.first` を使うという意味です。
- **`sub(正規表現, "")`**: 正規表現に一致した最初の部分を、空の文字列に置き換えます。
- **`\A`**: 文字列の先頭を表す記号です。

## 何をしているか

### 1. 長い名前を優先して選ぶ

```ruby:line-numbers=666
      (long.first || short.first).sub(/\A-+(?:\[no-\])?/, '')
```

`long.first` が存在すればそれを、なければ `short.first` を使います。どちらも無い場合は、この式の結果は `nil` になります。

### 2. 先頭のハイフンと、`[no-]` の印を取り除く

```ruby:line-numbers=666
      (long.first || short.first).sub(/\A-+(?:\[no-\])?/, '')
```

`\A-+(?:\[no-\])?` は、先頭の `-` や `--`、そして `[no-]` という印を表します。これを空にして、名前だけを残します。

## ここがすごい

### 名前の長さの違いを吸収する

オプションが長い名前と短い名前の両方を持つとき、どちらを表示や識別に使うかを 1 か所で決めています。
ヘルプの表示や、オプション同士の比較で、同じ名前を使えます。

### 特殊な書き方を、正規表現 1 つで消す

`[no-]` のような印は、利用者には意味がありますが、名前そのものには含めたくありません。
正規表現で先頭だけを狙って消すことで、本体の名前を汚さずに済みます。

### 内部で使う名前を、1 つに決める

ハイフンの数や印の有無が違っても、同じ `verbose` として扱えます。
比較や、設定の保存に使う鍵を、統一できるという利点があります。

## まとめ

- 名前を取り出すときは、優先順位（長い名前、短い名前）を決めておくと迷いません。
- 正規表現で先頭の印だけを消すと、名前の中身を壊さずに整えられます。
- 表示用の形と、内部で使う名前を分けると、後の処理が簡単になります。
