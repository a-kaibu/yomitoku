---
title: "コマンドラインの値を、変換して許可リストと照らす"
description: "OptionParser::Switch#conv_arg は、オプションに渡された値を変換器で変えたあと、許可された値の一覧に含まれるかを確かめる。含まれなければ例外にする。"
language: ruby
project: "Ruby optparse (標準ライブラリ)"
repo: https://github.com/ruby/optparse
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "39a3901c9fe802189d7c7fde27675a9944a8f32b"
file: lib/optparse.rb
lines: [588, 599]
function: "OptionParser::Switch#conv_arg"
difficulty: 3
format: 2
tags: ["CLI", "パース", "防御的プログラミング"]
---
## ひとことで

`OptionParser::Switch#conv_arg` は、コマンドラインから受け取った値を **変換器で変えたあと、許可された値の一覧に含まれているかを確かめる** メソッドです。
含まれていなければ `InvalidArgument` を出して、利用者に伝えます。
戻り値は、オプションの名前、ブロック、変換後の値の 3 つです。

## コード

::: code-group

```ruby:line-numbers=588 [日本語訳]
    private def conv_arg(arg, val = []) # 内部用（ドキュメントには載せない）
      v, = *val
      if conv
        val = conv.call(*val)
      else
        val = proc {|v| v}.call(*val)
      end
      if @values
        @values.include?(val) or raise InvalidArgument, v
      end
      return arg, block, val
    end
```

```ruby:line-numbers=588 [原文]
    private def conv_arg(arg, val = []) # :nodoc:
      v, = *val
      if conv
        val = conv.call(*val)
      else
        val = proc {|v| v}.call(*val)
      end
      if @values
        @values.include?(val) or raise InvalidArgument, v
      end
      return arg, block, val
    end
```

:::

## 前提知識

- **変換器（conv）**: 文字列を別の型に変える処理です。`Integer` や `Array` のように、クラス自身が変換器として働くこともあります。
- **許可リスト（`@values`）**: 指定できる値の一覧です。ここに無い値は受け付けません。
- **`include?`**: 配列に値が含まれるかを調べます。
- **`raise`**: 例外を発生させます。`raise InvalidArgument, v` は、値 `v` を含めた例外です。
- **`v, = *val`**: 配列の先頭だけを取り出す書き方です。

## 何をしているか

### 1. 最初の値を覚えておく

```ruby:line-numbers=589
      v, = *val
```

`val` の先頭の値を `v` に取り出します。エラーのメッセージで、元の入力を示すために使います。

### 2. 変換器があれば通し、なければそのまま使う

```ruby:line-numbers=590
      if conv
        val = conv.call(*val)
      else
        val = proc {|v| v}.call(*val)
      end
```

変換器（`conv`）が指定されていれば、その変換器に値を渡します。指定がなければ、恒等の変換（そのままの値）を使います。

### 3. 許可リストがあれば、含まれるかを確かめる

```ruby:line-numbers=595
      if @values
        @values.include?(val) or raise InvalidArgument, v
      end
```

`@values` が指定されているときは、変換後の値が一覧に入っているかを調べます。入っていなければ、`or raise` で例外にします。

### 4. オプション名・ブロック・値を返す

```ruby:line-numbers=598
      return arg, block, val
```

呼び出し側が使う 3 つの情報を、配列のように返します。

## ここがすごい

### 変換と検査を、続けて書く

値を変換してから検査するので、利用者は文字列のまま入力を書けます。
例えば `--color red` の `red` を、列挙された色の値の中で確かめる、という流れが 1 つのメソッドで完結します。

### 指定がないときの動きを、同じ形にする

変換器があってもなくても、後の処理は同じ形の値を受け取ります。
`proc {|v| v}` という恒等の変換を使うことで、分岐を減らしています。

### 例外に、元の入力を残す

`InvalidArgument` に `v` を渡しているので、エラーの表示には、利用者が入力した値が含まれます。
どの値が悪かったのかが、すぐに分かります。

## まとめ

- 入力の値は、変換してから許可リストと照らすと、正しい値だけを受け付けられます。
- 変換器がない場合も、同じ形で扱えるように恒等の変換を用意すると、コードが単純になります。
- エラーには元の入力を含めると、利用者が原因を探しやすくなります。
