---
title: "POSIXLY_CORRECT が設定されたら、オプションの並べ替えを止める"
description: "GetoptLong#ordering= は、PERMUTE を指定されても環境変数 POSIXLY_CORRECT があれば REQUIRE_ORDER に切り替える。UNIX の慣習を、環境変数 1 つで尊重する。"
language: ruby
project: "Ruby getoptlong (標準ライブラリ)"
repo: https://github.com/ruby/getoptlong
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (C) 1998, 1999, 2000  Motoyuki Kasahara."
commit: "adbcb94d847ee774b0aed3ae109435d1314d04f7"
file: lib/getoptlong.rb
lines: [505, 509]
function: "GetoptLong#ordering="
difficulty: 2
format: 2
tags: ["CLI", "移植性", "API設計"]
---
## ひとことで

`GetoptLong` は、コマンドラインの引数（`-v` や `--file` のような指定）を解析するライブラリです。
引数の並べ替えの方法を、`ordering=` で決められます。
環境変数 `POSIXLY_CORRECT` が設定されていると、並べ替えをやめ、UNIX の伝統的な動きに合わせます。

## コード

```ruby:line-numbers=505
    if ordering == PERMUTE && ENV.include?('POSIXLY_CORRECT')
      @ordering = REQUIRE_ORDER
    else
      @ordering = ordering
    end
```

## 前提知識

- **コマンドライン引数**: プログラムを起動するときに、後ろに並べて渡す文字列です。`ruby tool.rb -v input.txt` の `-v` や `input.txt` などです。
- **並べ替え（PERMUTE）**: オプションと、オプションではない引数（ファイル名など）が、混ざって並んでいても解析する方法です。
- **REQUIRE_ORDER**: 最初にオプションでない引数が出てきたら、それ以降はオプションとして扱わない方法です。
- **`POSIXLY_CORRECT`**: 「POSIX（UNIX の標準）に厳密に従え」という意味の環境変数です。GNU のツールなどが、この変数を見て動きを変えます。
- **`ENV.include?`**: 環境変数が設定されているかを調べるメソッドです。

## 何をしているか

### 1. 並べ替えを指定されたかを確かめる

```ruby:line-numbers=505
    if ordering == PERMUTE && ENV.include?('POSIXLY_CORRECT')
```

指定された `ordering` が `PERMUTE` で、かつ `POSIXLY_CORRECT` が設定されているかを調べます。
両方が真のときだけ、特別な扱いをします。

### 2. 特別な扱いとして、REQUIRE_ORDER にする

```ruby:line-numbers=506
      @ordering = REQUIRE_ORDER
```

条件を満たすと、並べ替えを行わず、`REQUIRE_ORDER` を使います。
最初にオプションでない引数が現れると、解析が止まります。以降の引数は、そのまま残ります。

### 3. それ以外は、指定どおりにする

```ruby:line-numbers=508
      @ordering = ordering
```

環境変数が無いなら、指定された `ordering` をそのまま使います。ふだんの利用では、並べ替えが有効です。

## ここがすごい

### 環境変数という、外からの合図

このライブラリの利用者は、コードを書き換えずに、環境変数を設定するだけで動きを変えられます。
シェルやスクリプトの世界では、`POSIXLY_CORRECT` は「伝統的な動きに従え」という共通の合図です。その合図を、Ruby のライブラリでも尊重しています。

### 指定と環境の、どちらが優先されるか

`ordering=` で明示的に `PERMUTE` を指定しても、環境変数があれば `REQUIRE_ORDER` になります。
この実装では、環境からの合図が、コードの指定より優先されます。その理由は、利用者の環境の期待を壊さないためです。

### 例外のように見えない、穏やかな切り替え

切り替えの結果はエラーになりません。ただ、並べ替えの方法が変わるだけです。
エラーにせず、動きを静かに合わせる、という設計です。

## まとめ

- `ordering=` は、引数の並べ替えの方法を決めます。
- `PERMUTE` が指定されても、`POSIXLY_CORRECT` があれば `REQUIRE_ORDER` に切り替えます。
- 環境変数という外からの合図に従い、UNIX の伝統的な動きを尊重しています。
- 切り替えはエラーにならず、並べ替えの方法だけが静かに変わります。
