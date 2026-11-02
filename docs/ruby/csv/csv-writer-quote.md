---
title: "CSV に引用符が要るかどうかを決める判定"
description: "CSV::Writer#quote は、フィールドを引用符で囲むかを判定する。nil は空欄、空文字と特殊文字を含む値だけを囲む。"
language: ruby
project: "Ruby csv (標準ライブラリ)"
repo: https://github.com/ruby/csv
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (C) 2005-2016 James Edward Gray II. All rights reserved."
commit: "afbee5e3548d38914706ae0de8a6cf421ba43187"
file: lib/csv/writer.rb
lines: [189, 207]
function: "CSV::Writer#quote"
difficulty: 2
format: 2
tags: ["文字列処理", "ファイル", "防御的プログラミング"]
---
## ひとことで

`CSV::Writer#quote` は、1 つのフィールドを **引用符で囲むかどうか** を決めて、書き出す形にするメソッドです。
カンマや改行を含む値、空の値などは引用符で囲み、そのほかはそのまま書きます。
`nil` は、引用符のない空欄として書きます。

## コード

::: code-group

```ruby:line-numbers=189 [日本語訳]
    def quote(field, i)
      if @force_quotes
        quote_field(field)
      elsif @force_quotes_fields and @force_quotes_fields[i]
        quote_field(field)
      else
        if field.nil?  # nil は、引用符のない空欄として書く
          ""
        else
          field = String(field)  # 文字列にそろえる
          # 空の値は、引用符で囲んだ空欄として書く
          if (@quote_empty and field.empty?) or (field.valid_encoding? and @quotable_pattern.match?(field))
            quote_field(field)
          else
            field  # 引用符なしのフィールド
          end
        end
      end
    end
```

```ruby:line-numbers=189 [原文]
    def quote(field, i)
      if @force_quotes
        quote_field(field)
      elsif @force_quotes_fields and @force_quotes_fields[i]
        quote_field(field)
      else
        if field.nil?  # represent +nil+ fields as empty unquoted fields
          ""
        else
          field = String(field)  # Stringify fields
          # represent empty fields as empty quoted fields
          if (@quote_empty and field.empty?) or (field.valid_encoding? and @quotable_pattern.match?(field))
            quote_field(field)
          else
            field  # unquoted field
          end
        end
      end
    end
```

:::

## 前提知識

- **フィールド**: CSV の 1 つの欄（セル）の値です。
- **`if ... elsif ... else`**: 条件ごとに処理を分ける構文です。ここでは上から順に調べ、最初に当てはまった枝を実行します。
- **`@force_quotes`**: 全部のフィールドを必ず囲む、という設定のインスタンス変数です。
- **正規表現の `match?`**: 文字列が、パターン（決まった形）に当てはまるかを真偽値で返します。
- **`valid_encoding?`**: 文字列の文字コードが正しいかを調べます。壊れた文字列はパターンで調べられないので、先に確かめます。
- **`nil?`**: 値が `nil`（何もない）かを調べるメソッドです。

## 何をしているか

### 1. 強制の設定があれば、必ず囲む

```ruby:line-numbers=190
      if @force_quotes
        quote_field(field)
      elsif @force_quotes_fields and @force_quotes_fields[i]
        quote_field(field)
```

`force_quotes` が真なら全部、`force_quotes_fields` で列番号 `i` が指定されていれば、その列だけを `quote_field` で囲みます。

### 2. `nil` は、囲まない空欄

::: code-group

```ruby:line-numbers=195 [日本語訳]
        if field.nil?  # nil は、引用符のない空欄として書く
          ""
```

```ruby:line-numbers=195 [原文]
        if field.nil?  # represent +nil+ fields as empty unquoted fields
          ""
```

:::

`nil` は「値がない」ことなので、引用符なしの空欄として `""` を返します。これは `quote_field` の結果（引用符つきの空欄 `""`）と区別されています。

### 3. 空の値、または特殊な文字を含む値は囲む

::: code-group

```ruby:line-numbers=198 [日本語訳]
          field = String(field)  # 文字列にそろえる
          # 空の値は、引用符で囲んだ空欄として書く
          if (@quote_empty and field.empty?) or (field.valid_encoding? and @quotable_pattern.match?(field))
```

```ruby:line-numbers=198 [原文]
          field = String(field)  # Stringify fields
          # represent empty fields as empty quoted fields
          if (@quote_empty and field.empty?) or (field.valid_encoding? and @quotable_pattern.match?(field))
```

:::

値を文字列にしてから、次の 2 つのどちらかなら `quote_field` で囲みます。

- `quote_empty` が真で、値が空文字列のとき
- 文字コードが正しく、`@quotable_pattern` に当てはまるとき（カンマ・引用符・改行などを含む）

### 4. それ以外はそのまま

::: code-group

```ruby:line-numbers=201 [日本語訳]
            quote_field(field)
          else
            field  # 引用符なしのフィールド
```

```ruby:line-numbers=201 [原文]
            quote_field(field)
          else
            field  # unquoted field
```

:::

どちらでもなければ、値をそのまま返します。「引用符なし」の値はそのまま書けるからです。

## ここがすごい

### 囲む理由が、必要な場合だけに限られている

すべての値を囲んでも、CSV としては正しく読めます。
しかし、ふつうの値まで囲むとファイルが大きくなり、人が読みにくくなります。
このメソッドは、囲まないと壊れる値だけを囲むので、出力が必要最小限になります。

### 空欄の 2 つの書き方を分けている

`nil` は引用符なしの `""`、空文字列は引用符つきの `""` で書きます。
見た目は似ていますが、読み込むと、`nil`（値なし）と空文字列（空の値）を区別できる形になっています。

### 文字コードの確認を先に行う

壊れた文字列に正規表現を当てると、例外が出ることがあります。
`valid_encoding?` を先に確かめてから、パターンで調べる順番になっています。

## まとめ

- CSV の書き出しは、「囲む」「囲まない」の判断を 1 か所に集めると読みやすくなります。
- `nil` と空文字列は、CSV の上で別の意味を持たせて書き分けられます。
- 不正な文字列を扱うときは、パターンを当てる前に文字コードを確かめます。
