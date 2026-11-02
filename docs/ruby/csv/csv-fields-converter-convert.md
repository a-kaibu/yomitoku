---
title: "CSV の値を変換器の列へ順に通す"
description: "CSV::FieldsConverter#convert は、読み込んだ値を変換器の列へ順に渡す。途中で文字列でなくなれば、そこで変換をやめて速くする。"
language: ruby
project: "Ruby csv (標準ライブラリ)"
repo: https://github.com/ruby/csv
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (C) 2005-2016 James Edward Gray II. All rights reserved."
commit: "afbee5e3548d38914706ae0de8a6cf421ba43187"
file: lib/csv/fields_converter.rb
lines: [54, 80]
function: "CSV::FieldsConverter#convert"
difficulty: 3
format: 2
tags: ["パース", "イテレータ", "最適化"]
---
## ひとことで

`CSV::FieldsConverter#convert` は、CSV から読んだ **1 行分の値に、変換器（converter）を順に通す** メソッドです。
`converters: :integer` のように指定すると、数字の文字列が整数に変わるのは、この仕組みのおかげです。
変換器が 1 つもなければ、値をそのまま返します。

## コード

::: code-group

```ruby:line-numbers=54 [日本語訳]
    def convert(fields, headers, lineno, quoted_fields=NO_QUOTED_FIELDS)
      return fields unless need_convert?

      fields.collect.with_index do |field, index|
        if field.nil?
          field = @nil_value
        elsif field.is_a?(String) and field.empty?
          field = @empty_value unless @empty_value_is_empty_string
        end
        @converters.each do |converter|
          break if field.nil? and @accept_nil
          if converter.arity == 1  # 値だけを受け取る変換器
            field = converter[field]
          else                     # 行番号などの情報（FieldInfo）も受け取る変換器
            if headers
              header = headers[index]
            else
              header = nil
            end
            quoted = quoted_fields[index]
            field = converter[field, FieldInfo.new(index, lineno, header, quoted)]
          end
          break unless field.is_a?(String)  # 速さのため、文字列でなくなったら残りを飛ばす
        end
        field  # 変換後、または元のままの値
      end
    end
```

```ruby:line-numbers=54 [原文]
    def convert(fields, headers, lineno, quoted_fields=NO_QUOTED_FIELDS)
      return fields unless need_convert?

      fields.collect.with_index do |field, index|
        if field.nil?
          field = @nil_value
        elsif field.is_a?(String) and field.empty?
          field = @empty_value unless @empty_value_is_empty_string
        end
        @converters.each do |converter|
          break if field.nil? and @accept_nil
          if converter.arity == 1  # straight field converter
            field = converter[field]
          else                     # FieldInfo converter
            if headers
              header = headers[index]
            else
              header = nil
            end
            quoted = quoted_fields[index]
            field = converter[field, FieldInfo.new(index, lineno, header, quoted)]
          end
          break unless field.is_a?(String)  # short-circuit pipeline for speed
        end
        field  # final state of each field, converted or original
      end
    end
```

:::

## 前提知識

- **変換器（converter）**: 値を受け取り、別の値に変えて返す処理です。ブロックや、名前で指定される組み込みの変換器があります。
- **パイプライン**: 処理を前から順に渡していく流れです。前の結果が次の入力になります。
- **`collect.with_index`**: 配列の各要素に処理をして新しい配列を作ります。`index` は要素の番号です。
- **`arity`**: ブロックや変換器が受け取る引数の数です。`arity == 1` なら値だけを受け取る変換器です。
- **`break`**: 繰り返しを途中で抜けます。
- **`FieldInfo`**: 値の番号、行番号、ヘッダ、引用符の有無などをまとめた情報です。

## 何をしているか

### 1. 変換器がなければ、そのまま返す

```ruby:line-numbers=55
      return fields unless need_convert?
```

変換器が 1 つもなければ、何もせず元の `fields` を返します。読み込みを速くするための早道です。

### 2. 空欄の値を、設定された値に置き換える

```ruby:line-numbers=57
      fields.collect.with_index do |field, index|
        if field.nil?
          field = @nil_value
        elsif field.is_a?(String) and field.empty?
          field = @empty_value unless @empty_value_is_empty_string
        end
```

各フィールドについて、`nil` なら `nil_value`、空文字列なら `empty_value` に置き換えます。ただし、`empty_value` が空文字列そのものなら、そのまま空文字列です。

### 3. 変換器を順に通す

::: code-group

```ruby:line-numbers=63 [日本語訳]
        @converters.each do |converter|
          break if field.nil? and @accept_nil
          if converter.arity == 1  # 値だけを受け取る変換器
            field = converter[field]
          else                     # 行番号などの情報（FieldInfo）も受け取る変換器
            if headers
              header = headers[index]
            else
              header = nil
            end
            quoted = quoted_fields[index]
            field = converter[field, FieldInfo.new(index, lineno, header, quoted)]
          end
          break unless field.is_a?(String)  # 速さのため、文字列でなくなったら残りを飛ばす
        end
```

```ruby:line-numbers=63 [原文]
        @converters.each do |converter|
          break if field.nil? and @accept_nil
          if converter.arity == 1  # straight field converter
            field = converter[field]
          else                     # FieldInfo converter
            if headers
              header = headers[index]
            else
              header = nil
            end
            quoted = quoted_fields[index]
            field = converter[field, FieldInfo.new(index, lineno, header, quoted)]
          end
          break unless field.is_a?(String)  # short-circuit pipeline for speed
        end
```

:::

- `arity == 1` の変換器には、値だけを渡します。
- それ以外の変換器には、値と一緒に `FieldInfo` を渡します。ヘッダ名や行番号が必要な変換器のためです。

変換器の結果が文字列でなくなったら（数値に変わったなど）、`break` して残りを飛ばします。

### 4. 最後の値を返す

::: code-group

```ruby:line-numbers=78 [日本語訳]
        field  # 変換後、または元のままの値
      end
```

```ruby:line-numbers=78 [原文]
        field  # final state of each field, converted or original
      end
```

:::

各フィールドの最終的な値を、新しい配列として返します。

## ここがすごい

### 文字列でなくなったら、残りを飛ばす

変換器は、たいてい「文字列を受け取り、別の型に変える」ものです。
一度整数になったあとに、文字列を前提にした変換器を通す必要はありません。
`break unless field.is_a?(String)` で、無駄な呼び出しを減らしています。

### 変換器の種類を、引数の数で見分ける

ブロックの `arity` を見るだけで、値だけを受け取るものと、情報も受け取るものを区別できます。
利用者は、簡単な変換器は短く、情報が要る変換器は `FieldInfo` を使って書けます。

### 変換する場所を 1 か所に集める

空欄の扱いも、変換器の実行も、このメソッドの中で順番に決まります。
読み手は、値がどんな順序で変わっていくかを、上から読むだけで追えます。

## まとめ

- 値の変換は、変換器を順番に通す「パイプライン」として書くと、組み合わせやすくなります。
- 途中で処理が不要になったら `break` で抜けると、無駄な処理を減らせます。
- 変換器の引数の数で仕様を分けると、簡単な使い方と詳しい使い方を両立できます。
