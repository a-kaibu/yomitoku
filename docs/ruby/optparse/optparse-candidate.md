---
title: "シェルの補完に出す、オプション名の候補"
description: "OptionParser#candidate は、途中まで入力された --ver のような文字から、補完できるオプション名の一覧を作る。長い名前と短い名前を分けて扱う。"
language: ruby
project: "Ruby optparse (標準ライブラリ)"
repo: https://github.com/ruby/optparse
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "39a3901c9fe802189d7c7fde27675a9944a8f32b"
file: lib/optparse.rb
lines: [2001, 2029]
function: "OptionParser#candidate"
difficulty: 3
format: 2
tags: ["CLI", "文字列処理", "イテレータ"]
---
## ひとことで

`OptionParser#candidate` は、途中まで打ち込まれた文字列（例: `--ver`）から、**補完の候補になるオプション名の一覧** を返すメソッドです。
シェルの補完機能から呼ばれ、`--verb` と打てば `--verbose` が候補に出ます。
`-` だけなら、長い名前と短い名前の両方を候補にします。

## コード

```ruby:line-numbers=2001
  def candidate(word)
    list = []
    case word
    when '-'
      long = short = true
    when /\A--/
      word, arg = word.split(/=/, 2)
      argpat = Completion.regexp(arg, false) if arg and !arg.empty?
      long = true
    when /\A-/
      short = true
    end
    pat = Completion.regexp(word, long)
    visit(:each_option) do |opt|
      next unless Switch === opt
      opts = (long ? opt.long : []) + (short ? opt.short : [])
      opts = Completion.candidate(word, true, pat, &opts.method(:each)).map(&:first) if pat
      if /\A=/ =~ opt.arg
        opts.map! {|sw| sw + "="}
        if arg and CompletingHash === opt.pattern
          if opts = opt.pattern.candidate(arg, false, argpat)
            opts.map!(&:last)
          end
        end
      end
      list.concat(opts)
    end
    list
  end
```

## 前提知識

- **補完（タブ補完）**: 途中まで入力した文字から、続きの候補を出す機能です。
- **正規表現による一致**: `Completion.regexp` で、入力された文字列の先頭に一致するパターンを作ります。
- **`visit(:each_option)`**: 定義されているすべてのオプションを、順に調べます。
- **`case ... when` と `split(/=/, 2)`**: 入力の先頭の形（`--` や `-`）で処理を分け、`=` の後ろの値を別に取り出します。
- **`concat`**: 配列の後ろに、別の配列の要素をまとめて追加します。

## 何をしているか

### 1. 入力の形で、長い名前か短い名前かを決める

```ruby:line-numbers=2003
    case word
    when '-'
      long = short = true
    when /\A--/
      word, arg = word.split(/=/, 2)
      argpat = Completion.regexp(arg, false) if arg and !arg.empty?
      long = true
    when /\A-/
      short = true
    end
```

入力が `-` だけなら、長い名前も短い名前も対象にします。`--` で始まるなら、`=` の後ろの値を別に分けて、長い名前だけを対象にします。`-` で始まるなら、短い名前だけです。

### 2. 入力に一致するパターンを作る

```ruby:line-numbers=2013
    pat = Completion.regexp(word, long)
```

入力された文字列から、先頭が一致するパターン（`pat`）を作ります。

### 3. すべてのオプションを調べ、一致する名前を集める

```ruby:line-numbers=2014
    visit(:each_option) do |opt|
      next unless Switch === opt
      opts = (long ? opt.long : []) + (short ? opt.short : [])
      opts = Completion.candidate(word, true, pat, &opts.method(:each)).map(&:first) if pat
      if /\A=/ =~ opt.arg
        opts.map! {|sw| sw + "="}
        if arg and CompletingHash === opt.pattern
          if opts = opt.pattern.candidate(arg, false, argpat)
```

各オプションについて、対象の名前（長いもの・短いもの）を集めます。パターンがあれば、そのパターンに一致するものだけに絞ります。

### 4. 引数の値の補完と、結果の返却

```ruby:line-numbers=2022
            opts.map!(&:last)
          end
        end
      end
      list.concat(opts)
    end
    list
```

`=` を取るオプションでは、名前の後ろに `=` を付けます。値の補完も可能なら、その候補も加えます。最後に、まとめた候補の配列を返します。

## ここがすごい

### 入力の形で、探す範囲を狭める

`--` で始まる入力に短い名前を混ぜると、候補が多すぎて役に立ちません。
入力の先頭の記号を見て、対象を長い名前か短い名前に絞っています。

### 「値の補完」まで同じ仕組みで扱う

`--level=` のように、`=` の後ろの値も補完できます。
名前の補完と、値の補完が、同じパターンの仕組みでつながっています。

### 一覧を作ってから返す

候補を 1 つずつ表示せず、配列にまとめて返します。シェルの補完は、この配列をそのまま使えます。

## まとめ

- 補完の候補は、入力の先頭の形で探す範囲を絞ると、精度が上がります。
- 名前と値の補完を、同じ仕組みで扱うと、コードが増えません。
- 候補は一覧として返すと、呼び出し側（シェル）がそのまま使えます。
