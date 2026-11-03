---
title: "2 つの集合に共通する要素があるかを、短い方から調べる"
description: "Set#intersect? は、共通する要素が 1 つでもあれば true を返す。要素数の少ない側を回して調べるので、大きな集合の全体を読まずに済むことが多い。"
language: ruby
project: "Ruby set (標準ライブラリ)"
repo: https://github.com/ruby/set
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002-2024 Akinori MUSHA <knu@iDaemons.org>"
commit: "0801252fbc76d6fc3eab694e7790a4ca72271552"
file: lib/set.rb
lines: [476, 489]
function: "Set#intersect?"
difficulty: 2
format: 2
tags: ["データ構造", "アルゴリズム", "API設計"]
---
## ひとことで

`Set#intersect?` は、2 つの集合に、同じ要素が 1 つでもあるかを調べて、真偽を返します。
共通部分を実際に作る `&` と違い、新しい集合は作りません。
「重なっているか」だけを知りたいときに、無駄なく判定できます。

## コード

```ruby:line-numbers=476
  def intersect?(set)
    case set
    when Set
      if size < set.size
        any?(set)
      else
        set.any?(self)
      end
    when Enumerable
      set.any?(self)
    else
      raise ArgumentError, "value must be enumerable"
    end
  end
```

## 前提知識

- **集合（Set）**: 同じ要素を 1 つだけ持つ、順序を気にしないコレクションです。要素の有無は、ハッシュを使って素早く調べられます。
- **`any?`**: 要素のどれか 1 つでも条件を満たせば真を返すメソッドです。途中で見つかれば、そこで止まります。
- **`===`**: `case` 文の `when` で使われる比較です。`Set#===` は、`include?` と同じ働きをします。
- **`Enumerable`**: 要素を 1 つずつ取り出せるクラスに共通のモジュールです。配列や範囲も含まれます。
- **`any?(pattern)`**: 引数を付けて `any?` を呼ぶと、各要素に対して `pattern === 要素` が真かを調べます。

## 何をしているか

### 1. 相手が集合なら、要素数の少ない方を回す

```ruby:line-numbers=478
    when Set
      if size < set.size
        any?(set)
      else
        set.any?(self)
      end
```

`size < set.size` なら、自分の要素を 1 つずつ取り出し、それが `set` に含まれるかを調べます。
そうでなければ、相手の要素を 1 つずつ取り出し、自分に含まれるかを調べます。
どちらの場合も、要素数の少ない側の要素を回すことになります。

### 2. 相手が普通の列挙なら、その要素を回す

```ruby:line-numbers=484
    when Enumerable
      set.any?(self)
```

配列や範囲のように、集合ではないが列挙できるものは、要素を 1 つずつ回します。
それぞれの要素が、自分の集合に含まれるかを `===` で調べます。

### 3. 列挙できない値は、例外にする

```ruby:line-numbers=486
    else
      raise ArgumentError, "value must be enumerable"
```

数や文字列など、比べる要素の一覧が無い値を渡されたら、例外で知らせます。

## ここがすごい

### 共通部分を作らずに、答えだけを返す

`set & other` は、共通の要素を全部入れた新しい集合を作ります。
`intersect?` は、1 つ見つかった時点で `true` を返し、作業を終えます。
余計な集合を作らないので、メモリも時間も節約できます。

### 短い方を回す、という判断

2 つの集合のうち、要素数が少ない方を回すと、調べる回数が減ります。
大きな集合を先頭から回すより、小さな集合を回すほうが、確実に速いです。
ここでは、`size` を比べるだけで、その判断をしています。

### 同じ `any?` の仕組みで、2 つの場合を書いている

集合どうしでも、配列との比較でも、中心になるのは `any?` と `===` です。
場合分けは、相手の型に応じて、どちらの要素を回すかを決めるだけです。

## まとめ

- `intersect?` は、共通の要素が 1 つでもあれば `true` を返します。
- 新しい集合を作らないので、`&` より軽く判定できます。
- 集合どうしなら、要素数の少ない方を回して、調べる回数を減らします。
- 列挙できない値は、`ArgumentError` で知らせます。
