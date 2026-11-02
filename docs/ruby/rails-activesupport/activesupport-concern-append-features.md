---
title: "モジュールの依存関係を「後回し」で解決する Concern"
description: "ActiveSupport::Concern の中核。Concern が Concern に include されたときは依存リストに積むだけにし、本物のクラスに届いた時点でまとめて取り込む。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/concern.rb
lines: [136, 151]
function: "ActiveSupport::Concern#append_features"
difficulty: 3
format: 2
tags: [メタプログラミング, 設計パターン]
---

## ひとことで

`ActiveSupport::Concern` は、Rails でモジュールを書きやすくする仕組みです。その中心が `append_features` です。
モジュール `B` がモジュール `A` に依存していても、使う側のクラスは `include B` と書くだけで、**先に `A` も取り込まれます**。
さらに、`ClassMethods` という名前のモジュールの中身をクラスメソッドとして足したり、`included do ... end` のブロックを実行したりもします。

## コード

::: code-group

```ruby:line-numbers=136 [日本語訳]
    def self.extended(base) # 内部用（:nodoc:）
      base.instance_variable_set(:@_dependencies, [])
    end

    def append_features(base) # 内部用（:nodoc:）
      if base.instance_variable_defined?(:@_dependencies)
        base.instance_variable_get(:@_dependencies) << self
        false
      else
        return false if base < self
        @_dependencies.each { |dep| base.include(dep) }
        super
        base.extend const_get(:ClassMethods) if const_defined?(:ClassMethods)
        base.class_eval(&@_included_block) if instance_variable_defined?(:@_included_block)
      end
    end
```

```ruby:line-numbers=136 [原文]
    def self.extended(base) # :nodoc:
      base.instance_variable_set(:@_dependencies, [])
    end

    def append_features(base) # :nodoc:
      if base.instance_variable_defined?(:@_dependencies)
        base.instance_variable_get(:@_dependencies) << self
        false
      else
        return false if base < self
        @_dependencies.each { |dep| base.include(dep) }
        super
        base.extend const_get(:ClassMethods) if const_defined?(:ClassMethods)
        base.class_eval(&@_included_block) if instance_variable_defined?(:@_included_block)
      end
    end
```

:::

## 前提知識

- **`include` の裏側**: クラスに `include M` と書くと、Ruby は内部で `M.append_features(クラス)` を呼び、モジュールのメソッドをクラスから使えるようにします。このメソッドを上書きすると、include のときの動作を変えられます。
- **`extend` と `self.extended`**: `module B; extend ActiveSupport::Concern; end` と書くと、`B` に `Concern` のメソッドが追加され、そのとき `Concern.extended(B)` が呼ばれます。
- **`instance_variable_set` / `get` / `defined?`**: オブジェクトのインスタンス変数を、名前で直接設定・取得・確認するメソッドです。モジュールもオブジェクトなので、インスタンス変数を持てます。
- **`base < self`**: クラスやモジュールどうしの `<` は「左が右を継承・include しているか」です。
- **`super`**: 本来の `append_features`（実際にメソッドを取り込む処理）を呼びます。
- **`const_get(:ClassMethods)`**: 名前で定数（ここではモジュール内の `ClassMethods`）を取り出します。
- **`class_eval(&ブロック)`**: ブロックの中身を、そのクラスの定義の中に書いたかのように実行します。

## 何をしているか

### 1. Concern になったモジュールに依存リストを持たせる

```ruby:line-numbers=136
    def self.extended(base) # :nodoc:
      base.instance_variable_set(:@_dependencies, [])
    end
```
`extend ActiveSupport::Concern` したモジュールには、空の配列 `@_dependencies` が用意されます。

### 2. 相手も Concern なら、リストに積むだけ

```ruby:line-numbers=141
      if base.instance_variable_defined?(:@_dependencies)
        base.instance_variable_get(:@_dependencies) << self
        false
```
`module B; extend Concern; include A; end` のとき、`A.append_features(B)` が呼ばれます。`B` は `@_dependencies` を持っている（＝ Concern である）ので、`A` を `B` の依存リストに追加して `false` を返します。**この時点では実際には取り込みません。**

### 3. 相手が本物のクラスなら、まとめて取り込む

```ruby:line-numbers=145
        return false if base < self
        @_dependencies.each { |dep| base.include(dep) }
        super
        base.extend const_get(:ClassMethods) if const_defined?(:ClassMethods)
        base.class_eval(&@_included_block) if instance_variable_defined?(:@_included_block)
```
`class C; include B; end` のとき、`B.append_features(C)` が呼ばれます。`C` はふつうのクラスなので、

1. すでに `B` を取り込んでいれば何もしない
2. 依存リストの `A` を先に `C` へ include する
3. `super` で `B` 自身を取り込む
4. `B::ClassMethods` があれば `C` に extend し、クラスメソッドにする
5. `included do ... end` のブロックを `C` の中で実行する

## ここがすごい

### 「どこで実行されるか」の問題を解決する

`A` の `included` ブロックに `has_many :comments` のような、クラスで呼ぶべき処理があるとします。もし `B` に `include A` した時点でブロックが実行されると、`B`（モジュール）の中で `has_many` を呼ぶことになり、失敗します。
Concern は、モジュールの中での include を **記録するだけにして後回し** にし、最終的にクラスに届いたときに、そのクラスの上で実行します。これで、依存する側のモジュールを書く人は、依存先の事情を気にせず `include A` と書けます。

### Ruby のフックを上書きするだけで実現

特別な宣言の構文を作るのではなく、Ruby が include のたびに呼ぶ `append_features` を上書きしています。使う人にとっては、ふつうの `include` のままです。

### 二重取り込みを防ぐ

`base < self` で、すでに取り込み済みなら何もしません。複数の Concern が同じ Concern に依存していても、`included` ブロックが 2 回実行されることはありません。

### ClassMethods の約束

`module ClassMethods` という名前の入れ子のモジュールを作っておけば、自動的にクラスメソッドになります。昔の Ruby では `def self.included(base); base.extend(ClassMethods); end` を毎回書いていた定型文を、名前の約束だけで不要にしています。

## まとめ

- Ruby の `include` は内部で `append_features` を呼ぶので、上書きすれば取り込みの動作を変えられます。
- 依存関係の処理を「記録して後回し」にすると、最終的な対象の上で正しく実行できます。
- 名前の約束（`ClassMethods`）で定型文をなくすのは、Rails によく見られる設計です。
