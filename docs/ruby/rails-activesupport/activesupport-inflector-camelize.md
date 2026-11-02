---
title: "snake_case を CamelCase に、略語辞書を引きながら変換する"
description: "\"active_model/errors\" を \"ActiveModel::Errors\" にする camelize。gsub! のブロックでキャプチャを使い分け、SSL のような略語も正しく大文字にする。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/inflector/methods.rb
lines: [80, 96]
function: "ActiveSupport::Inflector#camelize"
difficulty: 3
format: 2
tags: [文字列処理, 正規表現, 最適化]
---

## ひとことで

`camelize` は、`active_model` のようなスネークケース（単語を `_` でつなぐ書き方）を、`ActiveModel` のようなキャメルケース（単語の先頭を大文字にしてつなぐ書き方）に変換するメソッドです。
`/` は名前空間の区切り `::` に変わり、`camelize("active_model/errors")` は `"ActiveModel::Errors"` になります。
Rails がファイル名からクラス名を求めるときなどに使われています。

## コード

::: code-group

```ruby:line-numbers=80 [日本語訳]
    def camelize(term, uppercase_first_letter = true)
      string = term.to_s
      # String#camelize はシンボル（:upper か :lower）を受け取るので、メソッド間の一貫性のためにここでも :lower に対応しています。
      if !uppercase_first_letter || uppercase_first_letter == :lower
        string = string.sub(inflections.acronyms_camelize_regex) { |match| match.downcase! || match }
      elsif string.match?(/\A[a-z\d]*\z/)
        return inflections.acronyms[string]&.dup || string.capitalize
      else
        string = string.sub(/^[a-z\d]*/) { |match| inflections.acronyms[match] || match.capitalize! || match }
      end
      string.gsub!(/(?:_|(\/))([a-z\d]*)/i) do
        word = $2
        substituted = inflections.acronyms[word] || word.capitalize! || word
        $1 ? "::#{substituted}" : substituted
      end
      string
    end
```

```ruby:line-numbers=80 [原文]
    def camelize(term, uppercase_first_letter = true)
      string = term.to_s
      # String#camelize takes a symbol (:upper or :lower), so here we also support :lower to keep the methods consistent.
      if !uppercase_first_letter || uppercase_first_letter == :lower
        string = string.sub(inflections.acronyms_camelize_regex) { |match| match.downcase! || match }
      elsif string.match?(/\A[a-z\d]*\z/)
        return inflections.acronyms[string]&.dup || string.capitalize
      else
        string = string.sub(/^[a-z\d]*/) { |match| inflections.acronyms[match] || match.capitalize! || match }
      end
      string.gsub!(/(?:_|(\/))([a-z\d]*)/i) do
        word = $2
        substituted = inflections.acronyms[word] || word.capitalize! || word
        $1 ? "::#{substituted}" : substituted
      end
      string
    end
```

:::

## 前提知識

- **略語（acronym）の辞書**: Rails では `inflect.acronym "SSL"` のように略語を登録できます。`inflections.acronyms` は `{"ssl" => "SSL"}` のようなハッシュで、`acronyms_camelize_regex` はそれらにマッチする正規表現です。
- **`sub` と `gsub!` のブロック形式**: マッチした部分ごとにブロックを実行し、その戻り値で置き換えます。`sub` は最初の 1 か所、`gsub!` はすべてを置き換えます。
- **`$1`、`$2`**: 直前のマッチで、1 番目・2 番目の `( )` にマッチした部分です。マッチしなかったグループは `nil` です。
- **`(?:...)`**: 値を記録しないグループです。`(?:_|(\/))` は「`_` または `/`」で、`/` のときだけ `$1` に記録されます。
- **`capitalize!` は変更がないと `nil`**: 先頭を大文字にする破壊的メソッドですが、すでに大文字なら `nil` を返します。そのため `word.capitalize! || word` と書いて、どちらの場合も単語を得ています。
- **`&.`（ぼっち演算子）**: 左が `nil` なら呼び出しをせずに `nil` を返します。

## 何をしているか

### 1. 先頭の単語を処理する

```ruby:line-numbers=83
      if !uppercase_first_letter || uppercase_first_letter == :lower
        string = string.sub(inflections.acronyms_camelize_regex) { |match| match.downcase! || match }
      elsif string.match?(/\A[a-z\d]*\z/)
        return inflections.acronyms[string]&.dup || string.capitalize
      else
        string = string.sub(/^[a-z\d]*/) { |match| inflections.acronyms[match] || match.capitalize! || match }
      end
```
3 つの場合があります。

- 先頭を小文字にしたいとき（`camelize("active_model", false)`）: 先頭の略語を小文字にします。
- 文字列全体が 1 単語（`"post"` など）のとき: 略語ならその表記を、そうでなければ `capitalize` した `"Post"` を返して **すぐ終わります**。
- それ以外: 先頭の単語だけを略語辞書で引くか、`capitalize!` します。

### 2. 残りの単語を処理する

```ruby:line-numbers=90
      string.gsub!(/(?:_|(\/))([a-z\d]*)/i) do
        word = $2
        substituted = inflections.acronyms[word] || word.capitalize! || word
        $1 ? "::#{substituted}" : substituted
      end
```
`_` か `/` に続く単語を探して置き換えます。`"Active_model/errors"` の場合、

1. `_model` にマッチ: `$1` は `nil`、`$2` は `"model"` → `"Model"`
2. `/errors` にマッチ: `$1` は `"/"`、`$2` は `"errors"` → `"::Errors"`

区切りの `_` は消え、`/` は `::` になるので、結果は `"ActiveModel::Errors"` です。

## ここがすごい

### よくある「1 単語」は正規表現を使わずに終える

`elsif string.match?(/\A[a-z\d]*\z/)` の分岐は、`"post"` や `"user"` のような小文字の 1 単語を特別扱いしています。モデル名の多くは 1 単語なので、ここで `gsub!` などの重い処理をせずに返せるのは大きな効果があります。

### 1 つの正規表現で 2 種類の区切りを扱う

`_` と `/` を別々の `gsub!` で処理することもできますが、そうすると文字列を 2 回走査します。`(?:_|(\/))` のように **`/` だけをキャプチャ** しておけば、ブロックの中で `$1` が `nil` かどうかを見るだけで、区切りの種類を判別できます。

### 略語辞書で「Ssl」を防ぐ

`camelize("ssl_error")` を単純に変換すると `"SslError"` になります。辞書に `SSL` を登録しておけば `"SSLError"` になります。変換のたびに辞書を引くので、アプリ独自の略語にも対応できます。

### `!` メソッドの nil を `||` で吸収

`capitalize!` が `nil` を返す落とし穴を、`word.capitalize! || word` で吸収しています。破壊的メソッドで新しい文字列を作らず、なおかつ結果を確実に得る書き方です。

## まとめ

- よくある入力（1 単語）を最初に片付けると、全体の処理が速くなります。
- 一部だけをキャプチャする正規表現を使うと、1 回の置換で複数の種類の区切りを扱えます。
- 変換規則に例外（略語）があるなら、辞書として外から登録できるようにすると拡張しやすくなります。
- Ruby の `!` メソッドは変更がないと `nil` を返すので、`|| 元の値` で補います。
