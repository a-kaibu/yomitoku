---
title: "引数の書き方から、受け取り方を決める"
description: "OptionParser::Switch.guess は、オプションの定義文字列を見て、引数が要らない・必須・省略可能のどれかを判定する。組み合わせが合わないと例外にする。"
language: ruby
project: "Ruby optparse (標準ライブラリ)"
repo: https://github.com/ruby/optparse
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "39a3901c9fe802189d7c7fde27675a9944a8f32b"
file: lib/optparse.rb
lines: [527, 540]
function: "OptionParser::Switch.guess"
difficulty: 3
format: 2
tags: ["CLI", "パース", "防御的プログラミング"]
---
## ひとことで

`OptionParser::Switch.guess` は、オプションの定義に書かれた **引数の書き方**（例: `"FILE"`、`"[LEVEL]"`）を見て、そのオプションが引数を **必要とするか、省略できるか、そもそも要らないか** を判定するメソッドです。
判定の結果は、対応するクラス（`RequiredArgument` など）として返します。
組み合わせが合わないときは、例外を出します。

## コード

```ruby:line-numbers=527
    def self.guess(arg)
      case arg
      when ""
        t = self
      when /\A=?\[/
        t = Switch::OptionalArgument
      when /\A\s+\[/
        t = Switch::PlacedArgument
      else
        t = Switch::RequiredArgument
      end
      self >= t or incompatible_argument_styles(arg, t)
      t
    end
```

## 前提知識

- **コマンドラインオプション**: `ruby app.rb --level 3` のように、プログラムに渡す指定です。`--level` がオプション、`3` がその引数です。
- **`OptionParser`**: Ruby 標準のオプション解析ライブラリです。オプションの名前と、引数の書き方を定義します。
- **`case ... when`**: 文字列の形によって、処理を分けます。`when /\A=?\[/` は、正規表現で先頭の形を調べています。
- **`>=`（クラスの比較）**: クラスどうしで `>=` を使うと、継承関係を調べられます。
- **`or`**: 左が偽のときだけ右を実行します。ここでは、組み合わせが不正なときに例外を出すために使っています。

## 何をしているか

### 1. 引数の書き方で、種類を決める

```ruby:line-numbers=529
      when ""
        t = self
      when /\A=?\[/
        t = Switch::OptionalArgument
      when /\A\s+\[/
        t = Switch::PlacedArgument
      else
        t = Switch::RequiredArgument
```

- 空の文字列なら、引数はありません。このオプション自身の種類を使います。
- `[` で始まる（`=` が付くこともある）なら、引数は省略できます。
- 空白の後に `[` が続くなら、引数の位置が特別な場合です。
- それ以外は、引数が必須です。

### 2. 組み合わせが合うかを確かめる

```ruby:line-numbers=538
      self >= t or incompatible_argument_styles(arg, t)
```

`self >= t` は、このオプションの種類が、判定した種類を受け入れられるかを調べます。受け入れられないときは、`incompatible_argument_styles` で例外にします。

### 3. 判定した種類を返す

```ruby:line-numbers=539
      t
```

決まった種類のクラスを返します。呼び出し側は、このクラスを使って、実際の値を受け取る処理を組み立てます。

## ここがすごい

### 書き方の文字列だけで、仕様を決める

利用者は、`"--level [N]"` のように、ヘルプと同じ書き方でオプションを定義できます。
その文字列を読むだけで、どの種類の引数かが決まるので、別に設定を書く必要がありません。

### 組み合わせのミスを、早く知らせる

引数を必要としないオプションに、省略可能な引数を付けるような矛盾は、実行時ではなく定義の時点で見つけられます。
`or` で例外にすると、どの引数の書き方が問題かが、メッセージで伝わります。

### 種類をクラスで表す

引数の形をフラグや文字列で持つと、判定が散らばります。
クラスで表すと、継承によって「どこまで受け入れられるか」を、比較の演算子 1 つで書けます。

## まとめ

- 文字列の書き方から仕様を読み取ると、定義が簡潔になります。
- 種類の組み合わせは、継承関係で表すと、比較 1 つで確かめられます。
- 矛盾する定義は、早い段階で例外にすると、利用者が原因をすぐ見つけられます。
