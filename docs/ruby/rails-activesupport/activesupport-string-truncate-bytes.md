---
title: "絵文字を壊さずにバイト数で切り詰める truncate_bytes"
description: "データベースの列の上限などに合わせ、文字列をバイト数で切る。書記素クラスタ単位で詰めるので、絵文字や合成文字が途中で割れない。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/string/filters.rb
lines: [134, 159]
function: "String#truncate_bytes"
difficulty: 2
format: 2
tags: [文字列処理, Unicode]
---

## ひとことで

`truncate_bytes(n)` は、文字列を **n バイト以内** に切り詰めるメソッドです。
「n 文字」ではなく「n バイト」なのは、データベースの列や通信プロトコルの上限がバイト数で決まっていることが多いからです。
`"🔪" * 20`（80 バイト）を `truncate_bytes(20)` すると `"🔪🔪🔪🔪…"` になり、絵文字が途中で割れることはありません。

## コード

```ruby:line-numbers=134
  def truncate_bytes(truncate_to, omission: "…")
    omission ||= ""

    case
    when bytesize <= truncate_to
      dup
    when omission.bytesize > truncate_to
      raise ArgumentError, "Omission #{omission.inspect} is #{omission.bytesize}, larger than the truncation length of #{truncate_to} bytes"
    when omission.bytesize == truncate_to
      omission.dup
    else
      self.class.new.force_encoding(encoding).tap do |cut|
        cut_at = truncate_to - omission.bytesize

        each_grapheme_cluster do |grapheme|
          if cut.bytesize + grapheme.bytesize <= cut_at
            cut << grapheme
          else
            break
          end
        end

        cut << omission
      end
    end
  end
```

## 前提知識

- **文字とバイト**: UTF-8 では、英数字は 1 文字 1 バイトですが、日本語は 3 バイト、絵文字は 4 バイトなど、文字によってバイト数が違います。`size` は文字数、`bytesize` はバイト数を返します。
- **書記素クラスタ（grapheme cluster）**: 人間が「1 文字」と感じる単位です。たとえば「が」は「か」と濁点の 2 つの文字（コードポイント）で表されることがあり、👍🏽 のような肌の色付き絵文字も複数のコードポイントの組み合わせです。`each_grapheme_cluster` はこの単位で 1 つずつ取り出します。
- **キーワード引数**: `omission: "…"` は、呼び出し時に `truncate_bytes(20, omission: "...")` のように名前付きで渡す引数です。
- **`case` / `when`（条件だけの形）**: `case` の後に何も書かないと、`when` の条件が上から順に評価され、最初に真になったものが実行されます。
- **`tap`**: オブジェクトをブロックに渡して処理し、ブロックの結果ではなく **そのオブジェクト自身** を返します。
- **`force_encoding`**: 文字列のエンコーディング（文字の符号化方式）の印を付け替えます。

## 何をしているか

### 1. 特別なケースを先に片付ける

```ruby:line-numbers=135
    omission ||= ""

    case
    when bytesize <= truncate_to
      dup
    when omission.bytesize > truncate_to
      raise ArgumentError, "Omission #{omission.inspect} is #{omission.bytesize}, larger than the truncation length of #{truncate_to} bytes"
    when omission.bytesize == truncate_to
      omission.dup
```
- `omission` に `nil` が渡されたら空文字として扱います。
- もともと n バイト以下なら、コピーを返します。
- 省略記号だけで n バイトを超えるなら、条件を満たせないのでエラーにします。
- 省略記号がちょうど n バイトなら、省略記号だけを返します。

### 2. 空の文字列に 1 文字ずつ詰める

```ruby:line-numbers=145
      self.class.new.force_encoding(encoding).tap do |cut|
        cut_at = truncate_to - omission.bytesize

        each_grapheme_cluster do |grapheme|
          if cut.bytesize + grapheme.bytesize <= cut_at
            cut << grapheme
          else
            break
          end
        end
```
元と同じクラス・同じエンコーディングの空文字列 `cut` を作ります。本文に使えるのは `n - 省略記号のバイト数` です。
`"🔪" * 20` を 20 バイトに切る場合、`"…"` は 3 バイトなので本文は 17 バイトまでです。🔪 は 4 バイトなので、4 個（16 バイト）入れたところで、5 個目を入れると 20 バイトになりはみ出します。そこで `break` します。

### 3. 省略記号を付ける

```ruby:line-numbers=156
        cut << omission
```
`"🔪🔪🔪🔪…"`（19 バイト）ができあがり、`tap` によってこの `cut` が返されます。

## ここがすごい

### バイトで切ると文字が壊れる問題を避ける

素直に `byteslice(0, n)` で切ると、絵文字の 4 バイトの途中で切れてしまい、不正なバイト列（文字化け）ができます。
1 文字（コードポイント）単位で切れば不正なバイト列にはなりませんが、それでも「👍🏽」が「👍」と肌の色の記号に分かれたり、「が」が「か」と濁点に分かれたりします。
**書記素クラスタ単位** で詰めていくことで、見た目の「1 文字」が絶対に割れないようにしています。

### 「入るなら入れる」の貪欲法

先頭から順に「次の 1 文字を入れてもはみ出さないか」だけを確認しています。バイト数を数え直したり、二分探索したりせず、1 回の走査で答えが出ます。

### 不可能な指定は早めにエラー

「20 バイト以内」と指定されたのに省略記号が 21 バイトなら、どうやっても満たせません。黙って長い文字列を返すのではなく、エラーで知らせています。上限を守ることが目的のメソッドなので、上限を破る結果を返さないのは大事です。

## まとめ

- 「文字数」と「バイト数」は違います。保存先の上限がどちらなのかを意識しましょう。
- バイト単位やコードポイント単位で切ると、文字や絵文字が壊れることがあります。
- 書記素クラスタは人間が感じる「1 文字」の単位で、安全に切るならこの単位が確実です。
- 満たせない条件はエラーにすると、静かな不具合を防げます。
