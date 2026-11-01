---
title: "nil でも落ちない呼び出し try の仕組み"
description: "「メソッドがあれば呼ぶ、なければ nil」を実現する Rails の try。ブロックの引数の数で動きを変える小技も入っている。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/object/try.rb
lines: [7, 31]
function: "ActiveSupport::Tryable#try"
difficulty: 2
tags: [メタプログラミング, 防御的プログラミング, クロージャ]
---

## ひとことで

`try` は「そのメソッドが呼べるなら呼び、呼べないなら `nil` を返す」メソッドです。
`@person.try(:name)` と書くと、`@person` が名前を持っていれば名前を、`nil` なら `nil` を返します。
`try!` はメソッドがなければ素直にエラーにする、少し厳しい版です。

## コード

```ruby:line-numbers=7
  module Tryable # :nodoc:
    def try(*args, **kwargs, &block)
      if args.empty? && kwargs.empty? && block_given?
        if block.arity == 0
          instance_eval(&block)
        else
          yield self
        end
      elsif respond_to?(args.first)
        public_send(*args, **kwargs, &block)
      end
    end

    def try!(*args, **kwargs, &block)
      if args.empty? && kwargs.empty? && block_given?
        if block.arity == 0
          instance_eval(&block)
        else
          yield self
        end
      else
        public_send(*args, **kwargs, &block)
      end
    end
  end
```

このモジュールは同じファイルの 35 行目で `Object` に取り込まれ、すべてのオブジェクトで使えるようになります。`nil` 用には別に「何もせず `nil` を返す」`try` が用意されています。

## 前提知識

- **モジュールと `include`**: `module` はメソッドの詰め合わせです。クラスに `include` すると、そのクラスのオブジェクトでモジュールのメソッドが使えます。
- **可変長引数 `*args` と `**kwargs`**: `*args` は位置引数をまとめて配列で、`**kwargs` はキーワード引数（`name: "x"` の形）をまとめてハッシュで受け取ります。
- **ブロックと `&block`**: Ruby ではメソッド呼び出しに `{ ... }` や `do ... end` で処理のかたまり（ブロック）を渡せます。`&block` と書くと、それを変数として受け取れます。`block_given?` はブロックが渡されたかを返します。
- **`yield self`**: 渡されたブロックを、`self`（自分自身）を引数にして実行します。
- **`block.arity`**: ブロックが受け取る引数の数です。`{ ... }` なら 0、`{ |x| ... }` なら 1 です。
- **`instance_eval(&block)`**: ブロックの中の `self` を、このオブジェクトに切り替えて実行します。ブロック内でメソッド名だけを書くと、このオブジェクトのメソッドになります。
- **`public_send(名前, 引数...)`**: 名前（シンボル）で指定した public メソッドを呼び出します。

## 何をしているか

### 1. ブロックだけ渡されたとき（9〜14 行目）

引数がなくブロックだけがある場合、`@person.try { |p| p.name.upcase }` のような使い方です。
このときブロックの引数の数を見て、

- 引数なし（`arity == 0`）なら `instance_eval` で実行します。`@person.try { name.upcase }` と書けば、`name` は `@person.name` になります。
- 引数あり なら `yield self` で、自分を引数にして実行します。

### 2. メソッド名が渡されたとき（15〜17 行目）

`respond_to?(args.first)` で、最初の引数（メソッド名）を持っているかを確認し、持っていれば `public_send` で呼び出します。持っていなければ `if` が成り立たず、メソッド全体の値は `nil` になります。
`"abc".try(:upcase)` は `"ABC"`、`"abc".try(:no_such_method)` は `nil` です。

### 3. try! は確認を省く（20〜30 行目）

`try!` は `respond_to?` を使わず、いきなり `public_send` します。メソッドがなければ `NoMethodError` が起きます。「`nil` のときだけは許すが、タイプミスは見逃したくない」ときに使います。

## ここがすごい

### `if` だけで nil を返す

15 行目の `elsif` には `else` がありません。Ruby の `if` は式なので、どの条件にも当てはまらなければ値が `nil` になります。わざわざ `return nil` を書かなくても「呼べなければ nil」が自然に実現されています。

### ブロックの形で 2 通りの書き方を許す

`arity` を調べることで、`try { name }` と `try { |o| o.name }` の両方に対応しています。呼ぶ側は好みや状況（ブロック内で外側のメソッドも使いたいなら引数ありの形）に合わせて選べます。メソッドがブロックの「形」を調べて振る舞いを変えるのは、Ruby らしいテクニックです。

### private メソッドは呼ばない

`send` ではなく `public_send` を使っているので、外から呼ぶべきでない private メソッドは `try` 経由でも呼べません。便利さと安全さのバランスを取っています。

### nil 側との組み合わせで完成する

`Object#try` だけでは、`nil.try(:name)` は `nil` が `name` を持たないので `nil` になりますが、Rails は `NilClass` にも `try` を定義して、確認すらせずに `nil` を返すようにしています。共通部分をモジュールに、特殊な部分をクラスごとに分ける設計です。

## まとめ

- Ruby の `if` は値を返す式で、どこにも当てはまらなければ `nil` になります。
- `block.arity` を見ると、ブロックの書き方に応じて振る舞いを変えられます。
- `public_send` は「外から呼べるメソッドだけ」を名前で呼ぶ安全な方法です。
- 便利な `try` と厳しい `try!` のように、ゆるさの違う 2 つの API を用意すると使い分けができます。
