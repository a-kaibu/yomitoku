---
title: "厳密な Base64 を、1 行でバイト列に戻す"
description: "Base64.strict_decode64 は、改行を含まない通常の Base64 を、unpack1 の m0 の指定で厳密にバイト列へ戻す。不正な文字があれば例外になる。"
language: ruby
project: "Ruby base64 (標準ライブラリ)"
repo: https://github.com/ruby/base64
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "4d3c0be334d15e30250b98c0e5d258a5186b0130"
file: lib/base64.rb
lines: [310, 312]
function: "Base64.strict_decode64"
difficulty: 1
format: 2
tags: ["文字列処理", "パース", "防御的プログラミング"]
---
## ひとことで

`Base64.strict_decode64` は、**改行を含まない通常の Base64 の文字列を、元のバイト列に戻す** メソッドです。
`Base64.strict_decode64("aGVsbG8=")` は `"hello"` を返します。
文字の並びや、末尾の `=` の数が正しくないと、`ArgumentError` を出します。

## コード

```ruby:line-numbers=310
  def strict_decode64(str)
    str.unpack1("m0")
  end
```

## 前提知識

- **Base64**: バイト列を、英数字と `+`、`/` などの 64 種類の文字に変える符号化方式です。
- **`unpack` と `pack`**: バイト列と値を相互に変換する Ruby のメソッドです。`"m"` は Base64 を表す指定です。
- **`unpack1`**: `unpack` の結果のうち、最初の 1 つだけを返します。
- **`m0`**: 改行を入れず、厳密に検査する Base64 の指定です。`m` だけなら、改行を無視して読み取ります。

## 何をしているか

### 1. 厳密な Base64 として、バイト列に戻す

```ruby:line-numbers=311
    str.unpack1("m0")
```

`unpack1("m0")` は、文字列を Base64 として読み取り、元のバイト列を返します。`0` が付いているので、改行が入っていたり、パディングが正しくなかったりすると、エラーになります。

## ここがすごい

### 1 行で、符号化の逆を書ける

Base64 の復号は、本来は 4 文字ずつの計算が必要です。
Ruby の `unpack` の指定を変えるだけで、同じ処理を 1 行で書けます。

### 「厳密」の名前が、仕様を表す

`strict` の名前は、「入力を寛容に読まない」という意味です。
改行を許す `decode64` と並べると、どちらの規則で読むかが、名前からすぐに分かります。

### 壊れた入力を、そのまま知らせる

不正な入力を、無理に読み取って誤った値を返すと、後の処理で問題が見えにくくなります。
例外で止めることで、問題の入口がすぐに分かります。

## まとめ

- 符号化の逆変換は、`unpack` の指定を使うと、短く正確に書けます。
- 寛容な版と厳密な版を名前で分けると、利用者が規則を選べます。
- 壊れた入力は、誤った値を返すより、例外で知らせるほうが安全です。
