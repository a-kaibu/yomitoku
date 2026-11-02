---
title: "属性の読み書きを、個別のメソッドとして追加する"
description: "OpenStruct の new_ostruct_member! は、新しい属性ごとに読み書き用のメソッドを特異メソッドとして作る。Ractor が使える環境では、共有できる手続きにする。"
language: ruby
project: "Ruby ostruct (標準ライブラリ)"
repo: https://github.com/ruby/ostruct
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "476379564ad6f752e2e4d1d9cd7ab5bff5d55fb4"
file: lib/ostruct.rb
lines: [234, 252]
function: "OpenStruct#new_ostruct_member!"
difficulty: 3
format: 2
tags: ["メタプログラミング", "データ構造", "並行処理"]
---
## ひとことで

`OpenStruct#new_ostruct_member!` は、**新しい属性が追加されるとき、その名前の読み取りと書き込みのメソッドを、そのオブジェクトだけに作る** 内部メソッドです。
`person.name = "Ann"` のように、属性名がそのままメソッドとして使えるのは、この仕組みのおかげです。
Ractor という並行処理の仕組みが使える環境では、共有しても安全な手続きを作ります。

## コード

::: code-group

```ruby:line-numbers=234 [日本語訳]
  def new_ostruct_member!(name) # 内部用（ドキュメントには載せない）
    unless @table.key?(name) || is_method_protected!(name)
      if defined?(::Ractor.shareable_proc)
        getter_proc = Ractor.shareable_proc { @table[name] }
        setter_proc = Ractor.shareable_proc {|x| @table[name] = x}
      elsif defined?(::Ractor)
        getter_proc = nil.instance_eval{ Proc.new { @table[name] } }
        setter_proc = nil.instance_eval{ Proc.new {|x| @table[name] = x} }
        ::Ractor.make_shareable(getter_proc)
        ::Ractor.make_shareable(setter_proc)
      else
        getter_proc = Proc.new { @table[name] }
        setter_proc = Proc.new {|x| @table[name] = x}
      end
      define_singleton_method!(name, &getter_proc)
      define_singleton_method!("#{name}=", &setter_proc)
    end
  end
  private :new_ostruct_member!
```

```ruby:line-numbers=234 [原文]
  def new_ostruct_member!(name) # :nodoc:
    unless @table.key?(name) || is_method_protected!(name)
      if defined?(::Ractor.shareable_proc)
        getter_proc = Ractor.shareable_proc { @table[name] }
        setter_proc = Ractor.shareable_proc {|x| @table[name] = x}
      elsif defined?(::Ractor)
        getter_proc = nil.instance_eval{ Proc.new { @table[name] } }
        setter_proc = nil.instance_eval{ Proc.new {|x| @table[name] = x} }
        ::Ractor.make_shareable(getter_proc)
        ::Ractor.make_shareable(setter_proc)
      else
        getter_proc = Proc.new { @table[name] }
        setter_proc = Proc.new {|x| @table[name] = x}
      end
      define_singleton_method!(name, &getter_proc)
      define_singleton_method!("#{name}=", &setter_proc)
    end
  end
  private :new_ostruct_member!
```

:::

## 前提知識

- **特異メソッド（singleton method）**: 1 つのオブジェクトだけに付くメソッドです。同じクラスの別のオブジェクトには影響しません。
- **`define_singleton_method!`**: 特異メソッドを、名前と手続きから定義します。`!` が付いているのは、内部で使う版という意味です。
- **`Proc`（手続き）**: 後で呼べるコードの塊です。`getter_proc` は値を返す手続き、`setter_proc` は値を入れる手続きです。
- **Ractor**: Ruby の並行処理の仕組みです。ほかのスレッドと安全に値を共有するために、手続きを共有可能な状態にする必要があります。
- **`is_method_protected!`**: その名前が、`OpenStruct` の既存のメソッドと衝突しないかを調べる内部メソッドです。

## 何をしているか

### 1. まだ無い属性で、かつ保護されていない名前だけを扱う

```ruby:line-numbers=235
    unless @table.key?(name) || is_method_protected!(name)
```

内部の表（`@table`）に鍵が無く、既存のメソッドと衝突しない名前のときだけ、新しいメソッドを作ります。

### 2. 環境に合った、読み書きの手続きを作る

```ruby:line-numbers=236
      if defined?(::Ractor.shareable_proc)
        getter_proc = Ractor.shareable_proc { @table[name] }
        setter_proc = Ractor.shareable_proc {|x| @table[name] = x}
      elsif defined?(::Ractor)
        getter_proc = nil.instance_eval{ Proc.new { @table[name] } }
        setter_proc = nil.instance_eval{ Proc.new {|x| @table[name] = x} }
        ::Ractor.make_shareable(getter_proc)
        ::Ractor.make_shareable(setter_proc)
      else
        getter_proc = Proc.new { @table[name] }
        setter_proc = Proc.new {|x| @table[name] = x}
      end
```

Ractor が使える環境では、共有できる形の手続きを作ります。使えないが Ractor はあるときは、`make_shareable` で共有可能にします。どちらも無ければ、ふつうの手続きを作ります。

手続きは、どちらも内部の表 `@table` の、その名前の値を読んだり書いたりします。

### 3. 読み取りと書き込みのメソッドを定義する

```ruby:line-numbers=248
      define_singleton_method!(name, &getter_proc)
      define_singleton_method!("#{name}=", &setter_proc)
```

名前そのもののメソッドで読み取り、`名前=` のメソッドで書き込むように、特異メソッドを定義します。

## ここがすごい

### 表の値に、メソッドの顔を付ける

内部では、すべての値を 1 つの表に入れています。
メソッドを動的に作ることで、利用者は `person.name` と、普通のオブジェクトと同じように書けます。

### 並行処理に備えた手続きの作り方

Ractor の環境では、手続きを共有可能にしないと、別の Ractor から使えません。
環境ごとに手続きの作り方を変えて、どの環境でも正しく動くようにしています。

### 既存のメソッドを壊さない

名前が既存のメソッドと衝突するときは、メソッドを作りません。
そのため、`OpenStruct` の基本の動きを、属性で上書きしてしまうことを防いでいます。

## まとめ

- 動的な属性は、オブジェクトだけのメソッドとして作ると、表の値を自然な書き方で扱えます。
- 並行処理の仕組みに合わせて、手続きの作り方を環境ごとに変えると、どの環境でも安全に動きます。
- 既存の名前と衝突する場合は作らないと、基本の動きを守れます。
