---
title: "引数の集合をすべて含んでいるかを調べる"
description: "Set#superset? は、引数の集合のすべての要素を自分が含むかを調べる。同じ型なら内部ハッシュの比較を使い、それ以外は要素数で早く判定する。"
language: ruby
project: "Ruby set (標準ライブラリ)"
repo: https://github.com/ruby/set
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002-2024 Akinori MUSHA <knu@iDaemons.org>"
commit: "0801252fbc76d6fc3eab694e7790a4ca72271552"
file: lib/set.rb
lines: [405, 414]
function: "Set#superset?"
difficulty: 3
format: 2
tags: ["データ構造", "ハッシュ", "API設計"]
---
## ひとことで

`Set#superset?` は、引数の集合を **すべて含んでいるか** を調べるメソッドです。
`Set[1, 2, 3].superset?(Set[1, 2])` は `true` です。`>=` という演算子としても使えます。

## コード

```ruby:line-numbers=405
  def superset?(set)
    case
    when set.instance_of?(self.class) && @hash.respond_to?(:>=)
      @hash >= set.instance_variable_get(:@hash)
    when set.is_a?(Set)
      size >= set.size && set.all?(self)
    else
      raise ArgumentError, "value must be a set"
    end
  end
```

## 前提知識

- **集合（Set）**: 同じ要素を重複して持たない、順序を気にしない入れ物です。
- **ハッシュ（`@hash`）**: `Set` は内部でハッシュを使って要素を保持します。
- **`case` 式（条件なし）**: `case` の後に値を書かず、`when` の中に条件を並べます。上から順に評価され、最初に真になった枝が実行されます。
- **`instance_of?`**: オブジェクトが、そのクラスそのものの（子クラスではない）インスタンスかを調べます。
- **`all?(self)`**: 引数の `===` を使って、すべての要素が条件に合うかを調べます。

## 何をしているか

### 1. 両方が同じ `Set` なら、内部のハッシュで比べる

```ruby:line-numbers=407
    when set.instance_of?(self.class) && @hash.respond_to?(:>=)
      @hash >= set.instance_variable_get(:@hash)
```

最初の `when` は、引数が同じクラスの集合で、内部ハッシュが `>=` に対応しているかを確かめます。
そうであれば、内部のハッシュ同士を `>=` で比べます。要素を一つずつ調べるより速く答えられます。

### 2. 別の `Set` の子クラスなら、要素を一つずつ調べる

```ruby:line-numbers=409
    when set.is_a?(Set)
      size >= set.size && set.all?(self)
```

二つ目の `when` は、引数が `Set` の何らかの子クラスであるときです。
引数の要素数が自分より多ければ、含むことはできません。そうでなければ、引数のすべての要素が自分に含まれるかを `all?(self)` で調べます。

### 3. それ以外は例外を出す

```ruby:line-numbers=411
    else
      raise ArgumentError, "value must be a set"
```

どちらにも当てはまらなければ、`ArgumentError` を出します。集合ではない値を渡すと、誤りとして知らせます。

## ここがすごい

このメソッドは、速さと安全性を両立させるために三つの分岐を持っています。

一つ目の分岐では、内部の `Hash#>=` を使います。Ruby の `Hash` には「キーの集合として包含を調べる」演算があるため、要素を一つずつ回る必要がありません。

二つ目の分岐は、要素数の比較で早く `false` を決めます。大きい集合が小さい集合を含むことは、要素数の条件を満たすときだけ起こり得るからです。

三つ目の `raise` は、`[1, 2]` のような配列を誤って渡したときに、静かに間違った答えを返さないためのものです。

`Set#subset?` と対になっていて、`alias >= superset?` のように演算子としても名前が与えられています。`a >= b` と書けば、「a は b を含むか」と読めるので、数学の集合記号に近い書き方ができます。

## まとめ

`superset?` は、引数の型に応じて内部ハッシュの比較と要素ごとの確認を使い分けます。要素数による早い判定と、型が違うときの明確な例外で、誤った結果を防いでいます。
