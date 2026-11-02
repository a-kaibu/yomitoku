---
title: "ヘッダ名か番号で CSV の値を取り出す"
description: "CSV::Row#field は、ヘッダ名か添字で値を探す。内部の pair の配列を assoc で引き、範囲指定のときは値をまとめて返す。"
language: ruby
project: "Ruby csv (標準ライブラリ)"
repo: https://github.com/ruby/csv
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (C) 2005-2016 James Edward Gray II. All rights reserved."
commit: "afbee5e3548d38914706ae0de8a6cf421ba43187"
file: lib/csv/row.rb
lines: [203, 214]
function: "CSV::Row#field"
difficulty: 2
format: 2
tags: ["データ構造", "ファイル", "API設計"]
---
## ひとことで

`CSV::Row#field` は、行の中から **ヘッダ名または列番号** で値を取り出すメソッドです。
`row["name"]` や `row[0]` と書けるのは、このメソッドが `alias_method :[], :field` で別名を付けているからです。
見つからないときは `nil` を返します。

## コード

::: code-group

```ruby:line-numbers=203 [日本語訳]
    def field(header_or_index, minimum_index = 0)
      # 対応する組（ヘッダと値）を探す
      finder = (header_or_index.is_a?(Integer) || header_or_index.is_a?(Range)) ? :[] : :assoc
      pair   = @row[minimum_index..-1].public_send(finder, header_or_index)

      # 組があれば、その値を返す
      if pair.nil?
        nil
      else
        header_or_index.is_a?(Range) ? pair.map(&:last) : pair.last
      end
    end
```

```ruby:line-numbers=203 [原文]
    def field(header_or_index, minimum_index = 0)
      # locate the pair
      finder = (header_or_index.is_a?(Integer) || header_or_index.is_a?(Range)) ? :[] : :assoc
      pair   = @row[minimum_index..-1].public_send(finder, header_or_index)

      # return the field if we have a pair
      if pair.nil?
        nil
      else
        header_or_index.is_a?(Range) ? pair.map(&:last) : pair.last
      end
    end
```

:::

## 前提知識

- **CSV::Row**: CSV の 1 行を表すオブジェクトです。`headers: true` で読むと、ヘッダ（列の名前）と値が組になって保存されます。
- **組（pair）**: `[ヘッダ, 値]` という 2 要素の配列です。行は、この組を並べた配列として保存されています。
- **`is_a?(Integer)`**: 値が整数かを調べます。整数や範囲なら、添字で取り出せます。
- **`public_send`**: 指定した名前のメソッドを呼びます。ここでは `:[]` か `:assoc` のどちらかを、変数で選んで呼んでいます。
- **`assoc`**: 配列の中から、先頭の要素が一致する組を探します。
- **`alias_method`**: 同じメソッドに別の名前を付けます。

## 何をしているか

### 1. 検索の仕方を決める

::: code-group

```ruby:line-numbers=204 [日本語訳]
      # 対応する組（ヘッダと値）を探す
      finder = (header_or_index.is_a?(Integer) || header_or_index.is_a?(Range)) ? :[] : :assoc
```

```ruby:line-numbers=204 [原文]
      # locate the pair
      finder = (header_or_index.is_a?(Integer) || header_or_index.is_a?(Range)) ? :[] : :assoc
```

:::

引数が整数か範囲なら、添字で探すために `[]` を使います。それ以外（ヘッダ名）なら、`assoc` で組を探します。

### 2. 指定された位置から探す

```ruby:line-numbers=206
      pair   = @row[minimum_index..-1].public_send(finder, header_or_index)
```

`minimum_index` で、検索を始める位置を後ろにずらせます。同じ名前のヘッダが複数あるときに、どれを取り出すかを選べます。

### 3. 組が見つかれば、値を返す

```ruby:line-numbers=209
      if pair.nil?
        nil
      else
        header_or_index.is_a?(Range) ? pair.map(&:last) : pair.last
      end
```

組が見つからなければ `nil` を返します。見つかれば、ふつうは組の後ろの値（`pair.last`）を返します。
引数が範囲のときだけ、見つかった組の値をすべて配列にまとめて返します。

## ここがすごい

### 「添字」と「ヘッダ名」を 1 つのメソッドで扱う

利用者は、列の番号でも名前でも値を取り出せます。
内部では、引数の種類に応じて探し方（`[]` か `assoc`）を切り替えるだけで、同じ形の値を返しています。
読み手には、`row["name"]` と `row[0]` が同じ仲間の操作に見えます。

### 検索の始まりをずらせる

同じヘッダが何度も現れる CSV でも、`minimum_index` を使えば 2 番目以降の列を探せます。
検索の範囲を配列の切り出し（`@row[minimum_index..-1]`）で表しているので、コードは短いままです。

### 範囲指定をまとめて返す

`row[0..2]` のように範囲を渡すと、複数の値が配列で返ります。
1 つずつ取り出すより、必要な列をまとめて取り出す書き方を自然に書けます。

## まとめ

- CSV の行は、ヘッダと値の組の配列として持つと、名前でも番号でも取り出せます。
- 引数の型で探し方を切り替えると、利用者の書き方を広く受け入れられます。
- 見つからないときは `nil` を返すと、呼び出し側で存在の確認をしやすくなります。
