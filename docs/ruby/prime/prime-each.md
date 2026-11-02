---
title: "上限まで、素数を順に取り出す"
description: "Prime#each は、上限を設定したジェネレーターに素数を順に作らせて、ブロックへ渡す。必要になった分だけ素数を作るので、大きな範囲でも無駄が少ない。"
language: ruby
project: "Ruby prime (標準ライブラリ)"
repo: https://github.com/ruby/prime
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1998-2008 Keiju ISHITSUKA(SHL Japan Inc.); Copyright (c) 2008 Yuki Sonoda (Yugui) <yugui@yugui.jp>"
commit: "7b445df81264849c998873d4b24b32ea551048a3"
file: lib/prime.rb
lines: [212, 215]
function: "Prime#each"
difficulty: 2
format: 2
tags: ["数値計算", "イテレータ", "アルゴリズム"]
---
## ひとことで

`Prime#each` は、上限を指定して、その範囲に含まれる **素数を小さい順に 1 つずつブロックへ渡す** メソッドです。
`Prime.each(20) { |p| p }` は、2、3、5、7、11、13、17、19 を順に渡します。
素数の一覧を先に全部作るのではなく、必要な分だけ作りながら渡します。

## コード

```ruby:line-numbers=212
  def each(ubound = nil, generator = EratosthenesGenerator.new, &block)
    generator.upper_bound = ubound
    generator.each(&block)
  end
```

## 前提知識

- **ブロック（`&block`）**: メソッドに渡す処理の塊です。`each` は、受け取った値を、このブロックに 1 つずつ渡します。
- **ジェネレーター（generator）**: 素数の候補を順に作るオブジェクトです。ここでは、既定の `EratosthenesGenerator` が使われます。
- **上限（`ubound`）**: どこまでの素数を作るかを決める値です。`nil` なら上限なしで、いつまでも素数を作り続けます。
- **`upper_bound=`**: ジェネレーターに上限を設定するメソッドです。
- **`&block` の受け渡し**: `generator.each(&block)` は、受け取ったブロックをそのまま、ジェネレーターの `each` に渡します。

## 何をしているか

### 1. 上限を、ジェネレーターに伝える

```ruby:line-numbers=213
    generator.upper_bound = ubound
```

`generator.upper_bound = ubound` で、ジェネレーターに「ここまでの素数だけ作ればよい」と伝えます。`nil` のときは、上限なしになります。

### 2. ジェネレーターの `each` に、ブロックを渡す

```ruby:line-numbers=214
    generator.each(&block)
```

素数の作り方は、ジェネレーターの側に任せます。このメソッドは、ブロックをそのまま渡すだけです。

## ここがすごい

### 作る仕事と、数える仕事を分ける

`Prime#each` は、「どこまで」と「どの方法で作るか」を、引数として受け取るだけです。
素数を作る本体は、ジェネレーターにあります。そのため、アルゴリズムを変えても、呼び出し側の書き方は同じままです。

### 必要な分だけ作る

例えば 100 万までの素数を、途中で止めたいときでも、ブロックが `break` すれば、そこで作業も終わります。
先にすべての素数を作るより、無駄な計算が減ります。

### 上限を `nil` で表す

上限を指定しないと、素数はいくらでも続きます。
引数の既定値を `nil` にすることで、「上限なし」と「上限あり」を、同じメソッドで表しています。

## まとめ

- 素数のような無限に続く列は、ブロックに 1 つずつ渡すと、必要な分だけ作れます。
- 作る仕事と使う仕事を分けると、アルゴリズムを取り替えやすくなります。
- 上限を `nil` で表すと、限られた範囲と無限の範囲を、同じ書き方で扱えます。
