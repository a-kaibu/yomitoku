---
title: "エラーの行をフィルタで整形し、サイレンサーで間引く"
description: "バックトレースの 1 行に、パスを短くするフィルタを順に適用し、gem や Ruby 本体の行を消すサイレンサーで判定する。同じ部品で「消す」「消したものだけ見る」を切り替えられる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/backtrace_cleaner.rb
lines: [78, 92]
function: "ActiveSupport::BacktraceCleaner#clean_frame"
difficulty: 2
format: 2
tags: [ログ, クロージャ, 設計パターン]
---

## ひとことで

`BacktraceCleaner` は、エラーが起きたときの **バックトレース（どこからどこへ呼ばれたかの一覧）を読みやすくする** クラスです。`clean_frame` は、その 1 行分を処理します。
たとえば `/home/me/app/app/models/user.rb:10` を `app/models/user.rb:10` に短くし、gem の中の行は表示しない、といったことをします。
Rails のエラー画面やログで、自分のアプリの行だけが目立つのはこの仕組みのおかげです。

## コード

```ruby:line-numbers=78
    def clean_frame(frame, kind = :silent)
      frame = frame.to_s
      @filters.each do |f|
        frame = f.call(frame.to_s)
      end

      case kind
      when :silent
        frame unless @silencers.any? { |s| s.call(frame) }
      when :noise
        frame if @silencers.any? { |s| s.call(frame) }
      else
        frame
      end
    end
```

## 前提知識

- **バックトレース**: エラーが起きたときに表示される、呼び出しの履歴です。1 行が 1 つの呼び出し（フレーム）で、`ファイル名:行番号:in 'メソッド名'` のような形をしています。
- **フィルタとサイレンサー**: このクラスでは、`@filters` は「行の文字列を書き換えるブロック」、`@silencers` は「その行を隠すべきなら真を返すブロック」の配列です。`add_filter { |line| ... }` や `add_silencer { |line| ... }` で追加します。
- **`f.call(frame)`**: 保存しておいたブロック（Proc）を呼び出します。
- **`frame unless 条件`**: 条件が偽なら `frame` を、真なら `nil` を返す式です。
- **`any? { ... }`**: どれか 1 つでもブロックが真を返せば真です。
- **`kind`**: 処理の種類を表すシンボルで、`:silent`（隠す）、`:noise`（隠すものだけ残す）、それ以外（隠さない）の 3 通りです。

## 何をしているか

### 1. フィルタを順に適用する

```ruby:line-numbers=79
      frame = frame.to_s
      @filters.each do |f|
        frame = f.call(frame.to_s)
      end
```
行を文字列にし、登録されたフィルタを順番に適用します。たとえば、

1. アプリのルートのパスを取り除く: `/home/me/app/app/models/user.rb:10` → `app/models/user.rb:10`
2. gem のパスを短くする: `/usr/lib/ruby/gems/3.3.0/gems/rack-3.0/lib/rack.rb:5` → `rack (3.0) lib/rack.rb:5`

前のフィルタの結果が、次のフィルタの入力になります。

### 2. 種類に応じて残すか決める

```ruby:line-numbers=84
      case kind
      when :silent
        frame unless @silencers.any? { |s| s.call(frame) }
      when :noise
        frame if @silencers.any? { |s| s.call(frame) }
      else
        frame
      end
```
- `:silent`（既定）: どれかのサイレンサーが「隠すべき」と言えば `nil`、そうでなければ整形した行を返します。
- `:noise`: 逆に、隠すべき行 **だけ** を返します。
- それ以外: 隠さずに、整形した行をそのまま返します。

呼び出し側は、結果が `nil` の行を捨てることで、バックトレース全体をきれいにします。

## ここがすごい

### 「書き換え」と「選別」を分けている

行を短くする処理（フィルタ）と、行を消すかどうかの判断（サイレンサー）を別の仕組みにしています。フィルタを先にかけるので、サイレンサーは **整形済みの短い行** を見て判断できます。たとえば「`rack (` で始まる行は隠す」のように、単純な条件で書けます。

### 同じサイレンサーで逆の結果も出せる

`:noise` を指定すると、隠すべき行だけが残ります。「アプリのコードの行」と「gem の行」を分けて表示したいとき、判定の条件を 2 回書く必要がありません。Rails のエラー画面で「Application Trace」と「Framework Trace」を切り替えられるのは、この仕組みによるものです。

### ブロックの配列で拡張できる

フィルタもサイレンサーも、ただのブロックの配列です。アプリ独自の「この gem の行も隠したい」という要望には、`add_silencer` で 1 行追加するだけで応えられます。クラス自体を変更する必要はありません。

## まとめ

- 「書き換える処理」と「残すか決める処理」を分けると、それぞれを単純に書けます。
- 処理をブロックの配列として持つと、使う側が自由に追加できる拡張点になります。
- 同じ判定条件で「消す」と「消したものだけ残す」を切り替えられると、条件の重複がなくなります。
