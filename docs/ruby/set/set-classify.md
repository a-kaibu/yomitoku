---
title: "ブロックの結果で集合を仕分ける classify"
description: "Set#classify は、ブロックが返す値ごとに要素を小さな集合へ仕分けて、ハッシュにして返す。グループ分けを 1 回の走査で行う。"
language: ruby
project: "Ruby set (標準ライブラリ)"
repo: https://github.com/ruby/set
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002-2024 Akinori MUSHA <knu@iDaemons.org>"
commit: "0801252fbc76d6fc3eab694e7790a4ca72271552"
file: lib/set.rb
lines: [749, 759]
function: "Set#classify"
difficulty: 2
format: 2
tags: ["データ構造", "イテレータ", "ハッシュ"]
---
## ひとことで

`Set#classify` は、集合の要素を **ブロックの結果ごとに仕分けて**、そのグループをハッシュにして返すメソッドです。
`Set[1, 2, 3, 4].classify(&:odd?)` は、奇数と偶数のグループに分けた `{true => {1, 3}, false => {2, 4}}` のようなハッシュになります。

## コード

::: code-group

```ruby:line-numbers=749 [日本語訳]
  def classify # 各要素 o を受け取り、仕分け先の名前（キー）を返すブロック
    block_given? or return enum_for(__method__) { size }

    h = {}

    each { |i|
      (h[yield(i)] ||= self.class.new).add(i)
    }

    h
  end
```

```ruby:line-numbers=749 [原文]
  def classify # :yields: o
    block_given? or return enum_for(__method__) { size }

    h = {}

    each { |i|
      (h[yield(i)] ||= self.class.new).add(i)
    }

    h
  end
```

:::

## 前提知識

- **ブロック（`{ ... }` や `do ... end`）**: メソッドに渡す処理の塊です。`yield` でブロックを呼び出し、結果を受け取ります。
- **ハッシュ**: キーと値の対応表です。`h[キー]` で値を取り出し、`h[キー] = 値` で書き込みます。
- **`||=`（なければ代入）**: 左辺が `nil` や偽のときだけ、右辺を代入する演算子です。
- **`block_given?`**: メソッドにブロックが渡されたかを調べます。
- **`enum_for`**: ブロックなしで呼ばれたとき、要素を順に取り出す列挙子（Enumerator）を返すための道具です。
- **`&:odd?`**: `{ |x| x.odd? }` の省略形です。要素に同じメソッドを順に呼びます。

## 何をしているか

### 1. ブロックがなければ、列挙子を返す

```ruby:line-numbers=750
    block_given? or return enum_for(__method__) { size }
```

ブロックがない呼び出しでは、すぐに `enum_for` で列挙子を返します。`classify` は仕分けの条件（ブロック）が必要なので、ブロックなしで呼ばれたときは「あとでブロックを渡せる形」にしておきます。

### 2. 結果ごとの空の集合を、必要になったら作る

```ruby:line-numbers=752
    h = {}

    each { |i|
      (h[yield(i)] ||= self.class.new).add(i)
    }
```

空のハッシュ `h` を用意し、要素ごとにブロックの結果を鍵にします。
`h[yield(i)] ||= self.class.new` は、その鍵の集合がまだなければ、新しい集合を作って入れます。
そのあとに `.add(i)` で、要素 `i` をその集合へ入れます。

### 3. 仕分けたハッシュを返す

```ruby:line-numbers=758
    h
```

ハッシュ `h` には、鍵（ブロックの結果）と、その鍵に属する集合が入っています。

## ここがすごい

### 空の集合を先に作らない

すべての鍵に空の集合を先に用意しておくと、使われない鍵も残ります。
`||=` で必要になったときにだけ作るので、ブロックが返した鍵の分だけ集合が生まれます。

### 1 回の走査で済む

要素ごとに、どのグループに入るかを 1 回だけ調べて、すぐ入れています。
同じ集合を何度もなめるより、読む回数が少なくなります。

### 集合のクラスをそのまま使う

`self.class.new` で作るので、`Set` のサブクラスで呼ぶと、そのサブクラスの集合が仕分けの結果になります。
クラス名を書かずに済むので、拡張しても壊れにくい書き方です。

## まとめ

- ブロックの結果を鍵にすると、要素を条件でグループ分けできます。
- `||=` を使うと、必要になったときだけ入れ物を作れます。
- ブロックなしで呼ばれたときは `enum_for` で列挙子を返すと、標準のイテレータと同じ使い心地になります。
