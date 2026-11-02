---
title: "委譲するメソッドを、定義先に 1 つ作る"
description: "Forwardable#def_instance_delegator は、委譲のメソッドを作る文字列を組み立て、クラスかインスタンスの適切な場所で評価する。クラスとインスタンスの違いを吸収する。"
language: ruby
project: "Ruby forwardable (標準ライブラリ)"
repo: https://github.com/ruby/forwardable
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "e4861311de4ada4cd80e375c89a17785cfad1fd3"
file: lib/forwardable.rb
lines: [188, 194]
function: "Forwardable#def_instance_delegator"
difficulty: 2
format: 2
tags: ["メタプログラミング", "API設計", "マクロ"]
---
## ひとことで

`Forwardable#def_instance_delegator` は、**1 つのメソッドを、ほかのオブジェクトに委譲する** メソッドを、クラスに定義するためのメソッドです。
`def_instance_delegator :@items, :size` と書くと、`size` を呼んだときに、インスタンス変数 `@items` の `size` が呼ばれるようになります。
この関数自身は、委譲のメソッドの中身を作って、適切な場所で評価するだけです。

## コード

::: code-group

```ruby:line-numbers=188 [日本語訳]
  def def_instance_delegator(accessor, method, ali = method)
    gen = Forwardable._delegator_method(self, accessor, method, ali)

    # クラスやモジュールでなければ、インスタンスとみなす
    mod = Module === self ? self : singleton_class
    mod.module_eval(&gen)
  end
```

```ruby:line-numbers=188 [原文]
  def def_instance_delegator(accessor, method, ali = method)
    gen = Forwardable._delegator_method(self, accessor, method, ali)

    # If it's not a class or module, it's an instance
    mod = Module === self ? self : singleton_class
    mod.module_eval(&gen)
  end
```

:::

## 前提知識

- **委譲（delegation）**: 自分の仕事を、ほかのオブジェクトに任せることです。
- **`Module === self`**: 自分自身がモジュール（クラスを含む）かどうかを調べます。
- **`singleton_class`**: そのオブジェクトだけの、特別なクラスです。インスタンスに個別にメソッドを付けるときに使います。
- **`module_eval`**: モジュールの中で、ブロックのコードを評価します。
- **`alias`**: 同じメソッドに、別の名前を付けます。ここでは `delegate` などの短い名前を用意しています。

## 何をしているか

### 1. 委譲のメソッドの中身を作る

```ruby:line-numbers=189
    gen = Forwardable._delegator_method(self, accessor, method, ali)
```

`Forwardable._delegator_method` が、委譲のメソッドを定義するための手続き（`gen`）を作ります。このメソッドは、その作り方を知りません。

### 2. 定義先を決める

::: code-group

```ruby:line-numbers=191 [日本語訳]
    # クラスやモジュールでなければ、インスタンスとみなす
    mod = Module === self ? self : singleton_class
```

```ruby:line-numbers=191 [原文]
    # If it's not a class or module, it's an instance
    mod = Module === self ? self : singleton_class
```

:::

自分がモジュールやクラスなら、そのものに定義します。インスタンスなら、そのオブジェクトだけの特異クラスに定義します。

### 3. 手続きを評価して、メソッドを作る

```ruby:line-numbers=193
    mod.module_eval(&gen)
```

`module_eval` で、作った手続きを定義先の中で評価します。これで、委譲のメソッドが定義されます。

## ここがすごい

### 作る仕事と、定義する仕事を分ける

委譲のメソッドの中身を作るのは `_delegator_method` の仕事で、この関数は「どこに定義するか」だけを決めます。
役割が分かれているので、どちらも読みやすく、変更しやすくなります。

### 同じ関数で、クラスとインスタンスの両方に対応する

`Module === self` の判定で、定義先を分けています。
利用者は、クラスの中でも、個別のオブジェクトでも、同じ名前のメソッドで委譲を定義できます。

### 別名で、書きやすさを上げる

`delegate` や `def_delegator` という短い名前は、よく使われるように、別名として用意されています。
同じ実装を、用途に合った名前で呼べます。

## まとめ

- 委譲のメソッドを定義する仕組みは、中身を作る部分と、定義先を決める部分に分けると、読みやすくなります。
- クラスとインスタンスを判定して定義先を選ぶと、同じ仕組みで両方に対応できます。
- よく使う名前は別名で用意すると、利用者の書きやすさが上がります。
