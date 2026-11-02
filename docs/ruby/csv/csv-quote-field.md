---
title: "「\"」を「\"\"」に変えて、1 つのフィールドを包む"
description: "CSV の 1 フィールドを引用符で囲む。中にある引用符は 2 つ重ねて書く。文字コードに合わせて引用符を変換するのも工夫。"
language: ruby
project: "Ruby csv (標準ライブラリ)"
repo: https://github.com/ruby/csv
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (C) 2005-2016 James Edward Gray II. All rights reserved."
commit: "afbee5e3548d38914706ae0de8a6cf421ba43187"
file: lib/csv/writer.rb
lines: [180, 187]
function: "CSV::Writer#quote_field"
difficulty: 2
format: 2
tags: ["文字列処理", "ファイル", "防御的プログラミング"]
---
## ひとことで

`CSV::Writer#quote_field` は、1 つのフィールド（1 つの値）を **引用符 `"` で囲み**、中にある `"` を `""` に書き換えて返すメソッドです。
CSV の書式では、カンマや改行を含む値を引用符で囲むと、区切りと誤解されずに済みます。
`He said "hi"` は `"He said ""hi"""` になります。

## コード

```ruby:line-numbers=180
    def quote_field(field)
      field = String(field)
      encoded_quote_character = @quote_character.encode(field.encoding)
      encoded_quote_character +
        field.gsub(encoded_quote_character,
                   encoded_quote_character * 2) +
        encoded_quote_character
    end
```

## 前提知識

- **CSV**: カンマ（`,`）で値を区切る、表形式のテキストです。値の中にカンマや改行があるときは、引用符 `"` で値全体を囲みます。
- **引用符のエスケープ**: 引用符で囲んだ値の中に `"` を入れるときは、`""`（2 つ重ねる）と書きます。
- **`String(field)`**: 値を文字列に変換します。`nil` は空文字列 `""` になります。
- **`gsub(a, b)`**: 文字列の中の `a` をすべて `b` に置き換えます。
- **エンコーディング**: 文字の符号化方式（UTF-8 など）です。引用符も同じ方式で表す必要があるため、`encode` で合わせています。
- **`*`（文字列の繰り返し）**: `"ab" * 2` は `"abab"` です。

## 何をしているか

### 1. 値を文字列にそろえる

```ruby:line-numbers=181
      field = String(field)
```

どんな値が来ても、まず文字列にします。数値や `nil` も、書き出しのために同じ形で扱えます。

### 2. 引用符を、値と同じ文字コードに合わせる

```ruby:line-numbers=182
      encoded_quote_character = @quote_character.encode(field.encoding)
```

値の文字コードが UTF-8 でも、Shift_JIS でも、そのまま `gsub` が効くように、引用符の文字を値と同じエンコーディングに変えておきます。

### 3. 中の引用符を 2 つにして、両端を囲む

```ruby:line-numbers=183
      encoded_quote_character +
        field.gsub(encoded_quote_character,
                   encoded_quote_character * 2) +
        encoded_quote_character
```

`gsub` で、値の中にある引用符を 2 つに増やします。そのあと、先頭と末尾に 1 つずつ引用符を付けて、全体を返します。

## ここがすごい

### 書き出す側だけが、規則を知っていればよい

CSV の読み込みは、`""` を 1 つの `"` として読み戻します。書き出しでは、この規則を 1 か所（`gsub`）だけで守ります。
値の中身が何であっても、同じ規則で正しく囲めます。

### 文字コードの違いを、先に合わせている

引用符の文字はエンコーディングによって、バイト列が違います。違う方式の文字列同士で `gsub` を行うと、エラーになったり一致しなかったりします。
`encode` で揃えてから置き換えるので、どの文字コードの値でも同じ処理で済みます。

### 1 つのメソッドに閉じている

囲むかどうかの判断は、次の `quote` メソッドが担当します。`quote_field` は「囲む」という 1 つの仕事だけを行うので、単体で読んで理解できます。

## まとめ

- CSV の値を囲むときは、中の引用符を `""` に変えてから、両端を `"` で囲みます。
- 文字列を置き換える前に、文字コードを揃えると、どの言語の値でも壊れにくくなります。
- 判断（いつ囲むか）と作業（どう囲むか）を別のメソッドに分けると、読みやすくなります。
