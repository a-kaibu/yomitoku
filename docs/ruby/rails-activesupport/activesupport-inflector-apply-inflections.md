---
title: "規則を上から試して、最初に当たったら止める複数形変換"
description: "pluralize と singularize の心臓部。規則の一覧を順に試し、sub! が成功した瞬間に break する。sub! の戻り値を「当たったか」の判定に使う。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/inflector/methods.rb
lines: [432, 441]
function: "ActiveSupport::Inflector#apply_inflections"
difficulty: 2
format: 2
tags: [正規表現, 文字列処理, イディオム]
---

## ひとことで

`apply_inflections` は、英単語を **複数形や単数形に変換する** ときの中心となる内部メソッドです。
`pluralize("post")` は `"posts"`、`pluralize("person")` は `"people"`、`singularize("posts")` は `"post"` になります。
変換の規則（「`y` で終わるなら `ies` にする」など）の一覧を順に試し、最初に当てはまったもので変換します。

## コード

```ruby:line-numbers=432
      def apply_inflections(word, rules, locale = :en)
        result = word.to_s.dup

        if word.empty? || inflections(locale).uncountables.uncountable?(result)
          result
        else
          rules.each { |(rule, replacement)| break if result.sub!(rule, replacement) }
          result
        end
      end
```

## 前提知識

- **変換規則の一覧 `rules`**: `[[正規表現, 置換文字列], ...]` という配列です。Rails の初期設定では、`/$/` → `"s"`（末尾に s）、`/([^aeiouy]|qu)y$/i` → `'\1ies'`（y を ies に）のような規則が登録されています。**あとから追加された規則ほど先頭に** 置かれ、より特殊な規則が優先されます。
- **`|(rule, replacement)|`**: ブロックの引数を括弧で囲むと、要素の配列 `[rule, replacement]` を 2 つの変数に分けて受け取れます。
- **`sub!(正規表現, 置換)`**: 最初にマッチした部分を置き換えます。置き換えたら自分自身を、**マッチしなければ `nil`** を返します。
- **`break if 条件`**: 条件が真ならループを抜けます。
- **数えられない名詞（uncountable）**: `"sheep"` や `"information"` のように、単数と複数で形が変わらない単語です。`uncountables` に登録されています。

## 何をしているか

### 1. 作業用のコピー

```ruby:line-numbers=433
        result = word.to_s.dup
```
元の単語を壊さないように、コピーを作ります。

### 2. 変換しない単語はそのまま

```ruby:line-numbers=435
        if word.empty? || inflections(locale).uncountables.uncountable?(result)
          result
```
空文字や、数えられない名詞ならそのまま返します。`pluralize("sheep")` は `"sheep"` です。

### 3. 規則を順に試す

```ruby:line-numbers=438
          rules.each { |(rule, replacement)| break if result.sub!(rule, replacement) }
```
`"category"` を複数形にする場合で追います。規則が `[y→ies の規則, ..., 末尾に s の規則]` の順に並んでいるとします。

1. `/([^aeiouy]|qu)y$/i` を試す → `"gory"` の `ry` にマッチし、`"categories"` に置き換え。`sub!` が自分を返す（真）ので `break`。

もし `"post"` なら、特殊な規則にはどれもマッチせず（`sub!` が `nil`）、最後の `/$/` → `"s"` で `"posts"` になります。

## ここがすごい

### sub! の戻り値で「当たったか」がわかる

規則に当てはまるかを `match?` で調べてから `sub!` すると、正規表現を 2 回実行することになります。
`sub!` は「置き換えたら真、マッチしなければ `nil`」を返すので、**置き換えと判定を 1 回で済ませられます**。`break if result.sub!(...)` という 1 行に、このメソッドの仕組みがすべて詰まっています。

### 規則の順番が優先度になる

規則は新しく追加したものほど先頭に来るので、アプリで `inflect.irregular "person", "people"` を追加すれば、一般的な「s を付ける」規則より先に試されます。最初に当たったら止まるので、**特殊な規則が一般的な規則を上書きする** 仕組みが、並び順だけで実現されています。

### データと処理の分離

このメソッド自体は英語の文法を何も知りません。規則はすべてデータ（`rules`）として外から渡されます。そのため、ロケールごとに違う規則を登録すれば、英語以外の言語にも同じメソッドで対応できます（`locale` 引数）。

## まとめ

- Ruby の `sub!` は、マッチしなければ `nil` を返すので、置き換えと判定を同時にできます。
- 「上から試して最初に当たったものを使う」形にすると、並び順が優先度になります。
- 変換規則をデータとして外に出すと、同じ処理でいろいろなルールを扱えます。
