---
title: "読み込まれたら実行、もう読み込み済みなら今すぐ実行 ── on_load"
description: "Rails の起動を速くする遅延読み込みの仕組み。フックの登録と発火のどちらが先でも、必ず 1 回ずつ実行される。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/lazy_load_hooks.rb
lines: [68, 90]
function: "ActiveSupport::LazyLoadHooks#on_load"
difficulty: 2
format: 2
tags: [設計パターン, 遅延評価, クロージャ]
---

## ひとことで

`on_load` は、**ある部品が読み込まれたときに実行する処理** を予約するメソッドです。
`ActiveSupport.on_load(:active_record) { include MyExtension }` と書いておくと、`ActiveRecord::Base` が読み込まれた瞬間に、その中でブロックが実行されます。
gem やアプリの設定が、Active Record を **早く読み込みすぎない** ようにするための仕組みです。

## コード

::: code-group

```ruby:line-numbers=68 [日本語訳]
    def on_load(name, options = {}, &block)
      @loaded[name].each do |base|
        execute_hook(name, base, options, block)
      end

      @load_hooks[name] << [block, options]
    end

    # `name` に on_load で登録されたブロックをすべて、
    # `base` を評価の文脈として実行します。
    #
    # ```
    # ActiveSupport.run_load_hooks(:active_record, ActiveRecord::Base)
    # ```
    #
    # In the case of the above example, it will execute all hooks registered
    # for `:active_record` within the class `ActiveRecord::Base`.
    def run_load_hooks(name, base = Object)
      @loaded[name] << base
      @load_hooks[name].each do |hook, options|
        execute_hook(name, base, options, hook)
      end
    end
```

```ruby:line-numbers=68 [原文]
    def on_load(name, options = {}, &block)
      @loaded[name].each do |base|
        execute_hook(name, base, options, block)
      end

      @load_hooks[name] << [block, options]
    end

    # Executes all blocks registered to `name` via on_load, using `base` as the
    # evaluation context.
    #
    # ```
    # ActiveSupport.run_load_hooks(:active_record, ActiveRecord::Base)
    # ```
    #
    # In the case of the above example, it will execute all hooks registered
    # for `:active_record` within the class `ActiveRecord::Base`.
    def run_load_hooks(name, base = Object)
      @loaded[name] << base
      @load_hooks[name].each do |hook, options|
        execute_hook(name, base, options, hook)
      end
    end
```

:::

## 前提知識

- **`@loaded` と `@load_hooks`**: ファイルの前の部分で、どちらも `Hash.new { |h, k| h[k] = [] }`（キーごとに空の配列が自動でできるハッシュ）として用意されています。`@loaded[name]` は「その名前で読み込み済みのもの」の一覧、`@load_hooks[name]` は「予約された処理」の一覧です。
- **ブロックを変数で受け取る `&block`**: 渡されたブロックを Proc オブジェクトとして受け取り、あとで実行できるように保存します。
- **`[block, options]`**: ブロックとオプションを組にして配列に保存しています。`each do |hook, options|` で取り出すと 2 つに分かれます。
- **`execute_hook`**: 同じファイルの非公開メソッドで、ブロックを `base`（読み込まれたクラス）の中で実行します。`run_once: true` なら同じブロックを 2 回実行しません。

## 何をしているか

### 1. 予約する

```ruby:line-numbers=68
    def on_load(name, options = {}, &block)
      @loaded[name].each do |base|
        execute_hook(name, base, options, block)
      end

      @load_hooks[name] << [block, options]
    end
```
`on_load(:active_record) { ... }` が呼ばれると、

1. すでに `:active_record` が読み込み済みなら、そのすべての `base` に対して **今すぐ** ブロックを実行します。
2. どちらの場合も、ブロックを予約リストに追加します。

### 2. 発火する

```ruby:line-numbers=85
    def run_load_hooks(name, base = Object)
      @loaded[name] << base
      @load_hooks[name].each do |hook, options|
        execute_hook(name, base, options, hook)
      end
    end
```
`ActiveRecord::Base` のファイルの最後では `ActiveSupport.run_load_hooks(:active_record, ActiveRecord::Base)` が呼ばれます。

1. 「`ActiveRecord::Base` は読み込み済み」と記録します。
2. それまでに予約されていたすべてのブロックを、`ActiveRecord::Base` の中で実行します。

### 3. 順番がどちらでも動く

- 予約 → 発火: 発火のときに、予約されたブロックが実行されます。
- 発火 → 予約: 予約のときに、読み込み済みの記録を見て、その場で実行されます。

## ここがすごい

### 「いつ読み込まれるか」を気にしなくてよい

gem が `ActiveRecord::Base.include(MyExtension)` と直接書くと、その瞬間に Active Record 全体が読み込まれます。設定ファイルの読み込み中にこれが起きると、まだ設定が終わっていない状態で Active Record が初期化され、設定が反映されないなどの問題が起こります。
`on_load` を使えば、**Active Record が自然に読み込まれるタイミングまで待ってから** 処理を実行できます。必要になるまで読み込まないので、起動も速くなります。

### 登録と発火の順序を問わない

イベントの仕組みでは、「発火した後に登録したハンドラは呼ばれない」ことがよくあります。このコードは、発火済みの記録（`@loaded`）を残しておき、遅れて登録されたブロックもすぐに実行します。**どちらが先でも、必ず実行される** ことが保証されています。

### 複数回の発火にも対応

`@loaded[name]` は配列なので、同じ名前で複数の `base` が発火することもできます。たとえば、複数のデータベース接続用のクラスがあっても、それぞれに対してブロックが実行されます。

## まとめ

- 重い部品に対する設定は、「読み込まれたら実行する」と予約しておくと、読み込みの順番の問題を避けられます。
- 発火済みの記録を残しておけば、後から登録された処理もすぐに実行できます。
- ブロックを保存しておき、あとで別の場所（クラスの中）で実行するのは、Ruby のブロックの強力な使い方です。
