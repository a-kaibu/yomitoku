---
title: "読み取りでメモリを確保しない method_missing ── OrderedOptions"
description: "config.foo = 1 や config.foo! を実現する OrderedOptions。引数を *args ではなく省略可能な 1 つにして、よくある読み取りを軽くしている。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/ordered_options.rb
lines: [57, 72]
function: "ActiveSupport::OrderedOptions#method_missing"
difficulty: 2
format: 2
tags: [メタプログラミング, 最適化, ハッシュ]
---

## ひとことで

`OrderedOptions` は、**ハッシュをメソッドのように読み書きできる** 入れ物です。Rails の `config` でおなじみの書き方を支えています。
`options = ActiveSupport::OrderedOptions.new` として、`options.timeout = 5` と書けば保存され、`options.timeout` で `5` が読めます。
`options.timeout!` と `!` を付けると、値が空のときにエラーにしてくれます。

## コード

::: code-group

```ruby:line-numbers=57 [日本語訳]
    # スプラットではなく、省略可能な引数を 1 つだけ受け取ります。読み取りが
    # もっとも多い呼び出しなので、メモリを確保してはいけないためです。
    def method_missing(method, arg = nil)
      if method.end_with?("=")
        self[method.name.chomp("=")] = arg
      elsif method.end_with?("!")
        name_string = method.name.chomp("!")
        self[name_string].presence || raise(KeyError.new(":#{name_string} is blank"))
      else
        self[method]
      end
    end

    def respond_to_missing?(name, include_private)
      true
    end
```

```ruby:line-numbers=57 [原文]
    # A single optional argument rather than a splat: reads are by far the most
    # common call and must not allocate.
    def method_missing(method, arg = nil)
      if method.end_with?("=")
        self[method.name.chomp("=")] = arg
      elsif method.end_with?("!")
        name_string = method.name.chomp("!")
        self[name_string].presence || raise(KeyError.new(":#{name_string} is blank"))
      else
        self[method]
      end
    end

    def respond_to_missing?(name, include_private)
      true
    end
```

:::

## 前提知識

- **このクラスはハッシュ**: `OrderedOptions` は `Hash` を継承しています。`self[キー]` はハッシュの値の読み書きです。ファイルの前の部分で、`[]` や `[]=` はキーをシンボルに変換してから使うように定義されています。
- **`method_missing(method, arg = nil)`**: 存在しないメソッドを呼ばれたときに呼ばれます。`method` はメソッド名のシンボル、`arg` は渡された引数（なければ `nil`）です。
- **`options.timeout = 5` の正体**: Ruby では、これは `options.timeout=(5)` という **`timeout=` という名前のメソッド呼び出し** です。
- **`method.name`**: シンボルを文字列にします（凍結された文字列を返します）。`chomp("=")` は末尾の `=` を取り除きます。
- **`presence`**: Rails のメソッドで、値が空（`nil`、空文字、空配列など）なら `nil`、そうでなければ値そのものを返します。
- **`raise(...)` を式の中で使う**: `a || raise(...)` は「a が偽ならエラーを出す」という書き方です。
- **`respond_to_missing?`**: `respond_to?` で聞かれたときに、`method_missing` で応答できるかを答えます。

## 何をしているか

### 1. 書き込み

```ruby:line-numbers=60
      if method.end_with?("=")
        self[method.name.chomp("=")] = arg
```
`options.timeout = 5` は `method_missing(:timeout=, 5)` になります。名前が `=` で終わるので、`"timeout"` をキーにして `5` を保存します。

### 2. 「!」付きの読み取り

```ruby:line-numbers=62
      elsif method.end_with?("!")
        name_string = method.name.chomp("!")
        self[name_string].presence || raise(KeyError.new(":#{name_string} is blank"))
```
`options.timeout!` なら、`"timeout"` の値を取り出し、空でなければ返します。空なら `KeyError` で「`:timeout is blank`」と知らせます。必須の設定が抜けているときに、早く気づけます。

### 3. ふつうの読み取り

```ruby:line-numbers=65
      else
        self[method]
```
`options.timeout` なら、そのまま `self[:timeout]` を返します。保存されていなければ `nil` です。

### 4. 何にでも応答できると答える

```ruby:line-numbers=70
    def respond_to_missing?(name, include_private)
      true
    end
```
どんな名前でも読み書きできるので、`respond_to?` には常に `true` を返します。

## ここがすごい

### 読み取りのためにメモリを確保しない

コード中のコメントが、このメソッドの一番の工夫です。
`method_missing(method, *args)` と書くのが一般的ですが、`*args` は呼ばれるたびに **引数を入れる配列を新しく作ります**。設定の読み取り（`config.timeout`）は、書き込みよりはるかに頻繁に行われます。そのたびに空の配列が作られては無駄です。
引数を「省略可能な 1 つ」にしておけば、引数なしの読み取りでは配列が作られません。セッターに必要な引数はちょうど 1 つなので、これで足ります。

### 名前の末尾で 3 つの動作を切り替える

`=` なら書き込み、`!` なら必須の読み取り、それ以外はふつうの読み取り。Ruby のメソッド名の習慣（`=` はセッター、`!` は注意が必要な版）をそのまま意味として使っているので、説明がなくても使い方が想像できます。

### ハッシュとしても使える

`Hash` を継承しているので、`options[:timeout]` や `options.each` のように、ふつうのハッシュとしても扱えます。メソッド風の書き方は、あくまで読みやすさのための入り口です。

## まとめ

- `*args` は呼ぶたびに配列を作るので、頻繁に呼ばれるメソッドでは引数の受け取り方を工夫すると効果があります。
- `x.foo = 1` は `foo=` というメソッドの呼び出しなので、`method_missing` で捕まえられます。
- メソッド名の末尾（`=`、`!`、`?`）の習慣を意味として使うと、直感的な API になります。
