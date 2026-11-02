---
title: "XML のタグ名に使えない文字を「_」に置き換える"
description: "任意の文字列を XML のタグ名・属性名として使える形にする。先頭と 2 文字目以降で使える文字が違うという仕様に正確に従っている。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/erb/util.rb
lines: [157, 171]
function: "ERB::Util#xml_name_escape"
difficulty: 2
format: 2
tags: [セキュリティ, 正規表現, Unicode]
---

## ひとことで

`xml_name_escape` は、文字列を **XML のタグ名や属性名として使える形** に直すメソッドです。
使えない文字は `_` に置き換えられます。たとえば `xml_name_escape("1 < 2 & 3")` は `"____2___3"` になります（ドキュメントコメントの例では `"1___2___3"` と書かれていますが、先頭の `1` も名前の最初には使えない文字なので、実際には `_` になります）。
ユーザーが入力した文字列を HTML の属性名として出力するときに、タグを壊されないようにするために使われます。

## コード

```ruby:line-numbers=157
    def xml_name_escape(name)
      name = name.to_s
      return "" if name.blank?
      return name if name.match?(SAFE_XML_TAG_NAME_REGEXP)

      starting_char = name[0]
      starting_char.gsub!(INVALID_TAG_NAME_START_REGEXP, TAG_NAME_REPLACEMENT_CHAR)

      return starting_char if name.size == 1

      following_chars = name[1..-1]
      following_chars.gsub!(INVALID_TAG_NAME_FOLLOWING_REGEXP, TAG_NAME_REPLACEMENT_CHAR)

      starting_char << following_chars
    end
```

同じファイルの少し上で、XML の仕様（コメントにある W3C の文書）に従って、名前の先頭に使える文字 `TAG_NAME_START_CODEPOINTS` と、2 文字目以降に使える文字 `TAG_NAME_FOLLOWING_CODEPOINTS` が定義されています。先頭には英字・`_`・`:` などが使え、2 文字目以降にはさらに数字・`-`・`.` なども使えます。

```ruby:line-numbers=46
    # Following XML requirements: https://www.w3.org/TR/REC-xml/#NT-Name
    TAG_NAME_START_CODEPOINTS = "@:A-Z_a-z\u{C0}-\u{D6}\u{D8}-\u{F6}\u{F8}-\u{2FF}\u{370}-\u{37D}\u{37F}-\u{1FFF}" \
                                "\u{200C}-\u{200D}\u{2070}-\u{218F}\u{2C00}-\u{2FEF}\u{3001}-\u{D7FF}\u{F900}-\u{FDCF}" \
                                "\u{FDF0}-\u{FFFD}\u{10000}-\u{EFFFF}"
    INVALID_TAG_NAME_START_REGEXP = /[^#{TAG_NAME_START_CODEPOINTS}]/
    TAG_NAME_FOLLOWING_CODEPOINTS = "#{TAG_NAME_START_CODEPOINTS}\\-.0-9\u{B7}\u{0300}-\u{036F}\u{203F}-\u{2040}".freeze
    INVALID_TAG_NAME_FOLLOWING_REGEXP = /[^#{TAG_NAME_FOLLOWING_CODEPOINTS}]/
    SAFE_XML_TAG_NAME_REGEXP = /\A[#{TAG_NAME_START_CODEPOINTS}][#{TAG_NAME_FOLLOWING_CODEPOINTS}]*\z/
    TAG_NAME_REPLACEMENT_CHAR = "_"
```

## 前提知識

- **XML の名前のルール**: タグ名（`<item>` の `item`）や属性名は、使える文字が決まっています。数字や `-` は 2 文字目以降なら使えますが、先頭には使えません。空白や `<`、`&` はどこにも使えません。
- **`blank?`**: Rails のメソッドで、空文字や空白だけの文字列なら真になります。
- **`match?`**: 正規表現にマッチするかを真偽値で返します（マッチ結果を作らないので軽い）。
- **`[^...]`**: 正規表現で「この中にない文字」を表します。
- **`name[0]` と `name[1..-1]`**: 最初の 1 文字と、2 文字目から最後までです。
- **`gsub!`**: マッチした部分をすべて置き換えます（自分自身を書き換えます）。
- **`<<`**: 文字列の末尾に連結します。

## 何をしているか

### 1. 早く終われる場合

```ruby:line-numbers=158
      name = name.to_s
      return "" if name.blank?
      return name if name.match?(SAFE_XML_TAG_NAME_REGEXP)
```
空の名前なら空文字を返します。すでに正しい名前（よくあるケース）なら、そのまま返します。

### 2. 先頭の 1 文字を直す

```ruby:line-numbers=162
      starting_char = name[0]
      starting_char.gsub!(INVALID_TAG_NAME_START_REGEXP, TAG_NAME_REPLACEMENT_CHAR)

      return starting_char if name.size == 1
```
先頭の文字が「名前の先頭に使えない文字」なら `_` に置き換えます。1 文字だけの名前なら、これで終わりです。

### 3. 残りを直してつなぐ

```ruby:line-numbers=167
      following_chars = name[1..-1]
      following_chars.gsub!(INVALID_TAG_NAME_FOLLOWING_REGEXP, TAG_NAME_REPLACEMENT_CHAR)

      starting_char << following_chars
```
2 文字目以降は「2 文字目以降に使えない文字」を `_` に置き換え、先頭とつなげて返します。

`"1 < 2 & 3"` で追うと、

- 先頭の `1` は数字なので先頭には使えず `_` になります。
- 残りの `" < 2 & 3"` は、空白・`<`・`&` が使えないので `_` になり、`"___2___3"` になります。

結果は `"____2___3"` です。

## ここがすごい

### 仕様の「先頭」と「それ以外」を分けて扱う

XML の名前の規則では、先頭の文字と 2 文字目以降で使える文字の集合が違います。1 つの正規表現でまとめて置き換えると、先頭の数字を見逃したり、逆に 2 文字目以降の数字まで置き換えてしまったりします。
**先頭だけを取り出して別の規則で直す** ことで、仕様どおりの名前を確実に作っています。

### よくある正しい名前は一瞬で返す

ほとんどの名前は最初から正しいはずです。`name.match?(SAFE_XML_TAG_NAME_REGEXP)` で丸ごとチェックして、正しければ新しい文字列を作らずに返します。

### 置き換えは消すのではなく `_` にする

使えない文字を削除すると、`"a b"` と `"ab"` が同じ名前になってしまいます。`_` に置き換えれば文字数が保たれ、元の名前が推測しやすく、別の名前との衝突も減ります。

### 注入攻撃を防ぐ

属性名にユーザーの入力を使うとき、`"onclick=alert(1) x"` のような文字列がそのまま出力されると、HTML に新しい属性を差し込まれてしまいます。空白や `=` を `_` にすることで、名前の外に出られないようにしています。

## まとめ

- XML や HTML の名前には使える文字の規則があり、先頭と 2 文字目以降で違います。
- 規則が違う部分は、分けて処理すると仕様に正確に従えます。
- よくある「すでに正しい」入力を最初に判定すると、無駄な処理を省けます。
- 使えない文字は削除より置き換えの方が、衝突や混乱を防げます。
