---
title: "「..」や「.」を畳んで、外へ出られないパスにする clean_path_info"
description: "URL のパスから「.」を消し、「..」を 1 つ前に戻す。ルートより上へは出られないので、ファイルの配信で親ディレクトリを覗かれるのを防ぐ。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [691, 704]
function: "Rack::Utils.clean_path_info"
difficulty: 2
format: 2
tags: [セキュリティ, 文字列処理, ファイル]
---

## ひとことで

`clean_path_info` は、URL のパス（例: `/a/./b/../c`）を **余計な `.` と `..` を取り除いた、正しい形のパス** に直すメソッドです。
`"/a/./b/../c//d"` は `"/a/c/d"` になります。
静的ファイルを配信するとき、`/../../etc/passwd` のような入力で、公開フォルダの外のファイルを読まれないようにするために使われます。

## コード

```ruby:line-numbers=691
    def clean_path_info(path_info)
      parts = path_info.split PATH_SEPS

      clean = []

      parts.each do |part|
        next if part.empty? || part == '.'
        part == '..' ? clean.pop : clean << part
      end

      clean_path = clean.join(::File::SEPARATOR)
      clean_path.prepend("/") if parts.empty? || parts.first.empty?
      clean_path
    end
```

## 前提知識

- **`split`**: 文字列を区切りで分けて配列にします。`"/a/b".split("/")` は `["", "a", "b"]` です（先頭に空の要素が入る点に注意）。
- **`PATH_SEPS`**: 同じファイルで定義されている正規表現で、区切り文字（Unix では `/`）にマッチします。
- **`.` と `..`**: `.` は「今いるフォルダ」、`..` は「ひとつ上のフォルダ」を表すパスの書き方です。
- **`clean.pop`**: 配列の最後の要素を取り除きます。空のときは何もせず `nil` を返します。
- **`join`**: 配列の要素を区切り文字でつなぎます。`::File::SEPARATOR` は OS の区切り文字（`/`）です。
- **`prepend`**: 文字列の先頭に別の文字列を足します。
- **三項演算子 `条件 ? A : B`**: 条件が真なら A、偽なら B を返します。

## 何をしているか

### 1. 区切りで分けて、空と `.` を捨てる

```ruby:line-numbers=692
      parts = path_info.split PATH_SEPS

      clean = []

      parts.each do |part|
        next if part.empty? || part == '.'
        part == '..' ? clean.pop : clean << part
      end
```

`"/a/./b/../c//d"` を分けると、`""`、`"a"`、`"."`、`"b"`、`".."`、`"c"`、`""`、`"d"` になります。

- 空の要素と `.` は `next` で飛ばします。
- `..` は、直前に積んだ要素を `pop` で取り除きます。
- それ以外は `clean` に積みます。

この例では、`a` と `b` を積んだあと `..` で `b` を消し、`c` と `d` を積んで `["a", "c", "d"]` になります。

### 2. つないで、先頭の `/` を付ける

```ruby:line-numbers=701
      clean_path = clean.join(::File::SEPARATOR)
      clean_path.prepend("/") if parts.empty? || parts.first.empty?
      clean_path
```

`join` で `"a/c/d"` にします。元のパスが `/` で始まっていたので、`parts.first` は空文字です。その場合に先頭へ `/` を付けます。

## ここがすごい

### ルートより上には行けない

`clean.pop` は、積んだものがなければ何もしません。そのため `"/../../secret"` は `"/secret"` になり、どれだけ `..` を重ねてもルートより上には出られません。これがこの関数の一番大事な性質です。

### 2 つの仕事を 1 つのループで

空の要素の除去、`.` の除去、`..` の処理を、ひとつの `each` の中で `next` と `pop` で分けています。配列を 1 回走査するだけなので、パスが長くても速く動きます。

### 判定は「積むか、戻すか」だけ

ファイルシステムに問い合わせず、文字列の上だけで処理しています。そのため存在しないパスでも、同じ結果が安定して得られます。

## まとめ

- パスの `..` は、「直前に積んだものを取り除く」と考えると、スタックで扱えます。
- ルートより上へ出られないようにすると、ファイル配信での事故を防げます。
- 区切りで分けた配列の先頭が空になることを意識すると、絶対パスかどうかを判定できます。
