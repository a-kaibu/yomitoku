---
title: "URL に入れても壊れない Base64 にする"
description: "Base64.urlsafe_encode64 は、通常の Base64 の「+」と「/」を「-」と「_」に置き換え、必要なら末尾の「=」を取り除く。"
language: ruby
project: "Ruby base64 (標準ライブラリ)"
repo: https://github.com/ruby/base64
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "4d3c0be334d15e30250b98c0e5d258a5186b0130"
file: lib/base64.rb
lines: [344, 349]
function: "Base64.urlsafe_encode64"
difficulty: 1
format: 2
tags: ["文字列処理", "ネットワーク", "イディオム"]
---
## ひとことで

`Base64.urlsafe_encode64` は、バイト列を **URL やファイル名に入れても壊れない Base64 の文字列** に変えるメソッドです。
通常の Base64 で使う `+` と `/` を、それぞれ `-` と `_` に置き換えます。
`padding: false` を渡すと、末尾の `=` も取り除きます。

## コード

```ruby:line-numbers=344
  def urlsafe_encode64(bin, padding: true)
    str = strict_encode64(bin)
    str.chomp!("==") or str.chomp!("=") unless padding
    str.tr!("+/", "-_")
    str
  end
```

## 前提知識

- **Base64**: バイト列を、英字・数字・記号 64 種類だけの文字列に変える符号化方式です。画像や暗号の値を、テキストで運ぶときに使います。
- **パディング（`=`）**: Base64 は 3 バイトを 4 文字に変えます。バイト数が 3 の倍数でないとき、末尾に `=` を足して長さをそろえます。
- **URL の中の文字**: `+` や `/` は、URL の中で特別な意味を持つことがあります。そのため、URL 用の別の文字を使うと安全です。
- **`strict_encode64`**: 改行を入れない、通常の Base64 に変換するメソッドです。
- **`chomp!`**: 文字列の末尾が指定した文字列なら、それを取り除きます。取り除けたら値を返し、なければ `nil` を返します。
- **`tr!`**: 文字を 1 対 1 で置き換えます。`tr!("+/", "-_")` は `+` を `-`、`/` を `_` に変えます。

## 何をしているか

### 1. 通常の Base64 にしてから、文字を置き換える

```ruby:line-numbers=345
    str = strict_encode64(bin)
    str.chomp!("==") or str.chomp!("=") unless padding
    str.tr!("+/", "-_")
```

まず `strict_encode64` で、改行の無い通常の Base64 にします。そのあと `tr!` で、`+` と `/` を URL 用の `-` と `_` に置き換えます。

### 2. パディングを外す（指定されたとき）

```ruby:line-numbers=346
    str.chomp!("==") or str.chomp!("=") unless padding
```

`padding: false` のときは、末尾の `==` を取り除き、無ければ `=` を取り除きます。

`str.chomp!("==") or str.chomp!("=") unless padding` という 1 行で、「`padding` が偽のときだけ」両方の判定を行っています。

### 3. 変換後の文字列を返す

```ruby:line-numbers=348
    str
```

変換が済んだ文字列を返します。

## ここがすごい

### 変換を 2 段階に分けて、読みやすさを保つ

「通常の Base64 を作る」「URL 用の文字に置き換える」「パディングを外す」という 3 つの作業を、順に並べています。
新しい符号化方式を 1 から書くより、既存の処理を再利用するほうが誤りが減ります。

### `or` で「どちらかが取り除けたら」を表す

`chomp!("==")` で末尾が `==` なら、それを外して `or` の右側は実行されません。
`==` が無いときだけ、`=` を外そうとします。1 文字だけの `=` と 2 文字の `==` を、1 行で正しく区別しています。

### 元に戻せる形で作る

`padding: false` で作った文字列は、`urlsafe_decode64` が「`=` が無い」場合も読めるように作られています。
符号化と復号を、対になる形で設計しています。

## まとめ

- URL やファイル名で使う Base64 は、`+` と `/` を別の文字に置き換えると安全です。
- パディングの有無は、オプションで切り替えられるようにすると、利用者の都合に合わせやすくなります。
- 既存の符号化を土台にすると、少ないコードで変換を組み立てられます。
