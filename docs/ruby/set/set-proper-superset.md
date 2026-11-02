---
title: "引数を真に含むかを調べる"
description: "Set#proper_superset? は、引数の集合を含み、かつ自分の方が要素が多いかを調べる。同じ要素の集合では false になる。"
language: ruby
project: "Ruby set (標準ライブラリ)"
repo: https://github.com/ruby/set
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002-2024 Akinori MUSHA <knu@iDaemons.org>"
commit: "0801252fbc76d6fc3eab694e7790a4ca72271552"
file: lib/set.rb
lines: [418, 427]
function: "Set#proper_superset?"
difficulty: 3
format: 2
tags: ["データ構造", "ハッシュ", "API設計"]
---
## ひとことで

`Set#proper_superset?` は、引数の集合を含み、かつ自分の方が要素が多いかを調べるメソッドです。
`Set[1, 2, 3] > Set[1, 2]` は `true` ですが、`Set[1, 2] > Set[1, 2]` は `false` です。

## コード

```ruby:line-numbers=418
  def proper_superset?(set)
    case
    when set.instance_of?(self.class) && @hash.respond_to?(:>)
      @hash > set.instance_variable_get(:@hash)
    when set.is_a?(Set)
      size > set.size && set.all?(self)
    else
      raise ArgumentError, "value must be a set"
    end
  end
```

## 前提知識

- **真の上位集合**: 含むだけでなく、自分の方が大きい集合です。同じ集合どうしは含まれても、真の上位集合ではありません。
- **`superset?`**: 引数を含むかだけを調べる、対になるメソッドです。
- **`case` 式（条件なし）**: 上の `when` から順に評価され、最初に真の枝が実行されます。
- **`alias`**: 同じメソッドに別の名前を与えます。ここでは `>` が同じ動きになります。

## 何をしているか

### 1. 同じ型なら、内部ハッシュの比較を使う

```ruby:line-numbers=420
    when set.instance_of?(self.class) && @hash.respond_to?(:>)
      @hash > set.instance_variable_get(:@hash)
```

同じクラスの集合で、内部ハッシュが `>` を持つなら、内部同士を `>` で比べます。これは「含み、かつ真に大きい」を一度に判定します。

### 2. 別の型の集合なら、要素数と要素を調べる

```ruby:line-numbers=422
    when set.is_a?(Set)
      size > set.size && set.all?(self)
```

要素数が自分より少なく、引数のすべての要素が自分に含まれれば真です。要素数の比較で、含めない場合を先に外せます。

### 3. 集合でなければ例外を出す

```ruby:line-numbers=425
      raise ArgumentError, "value must be a set"
```

集合以外が渡された場合は、`ArgumentError` を出します。

## ここがすごい

`superset?` と似ていますが、要素数の比較が `>` になっている点が違います。同じ要素の集合では、`superset?` は `true`、`proper_superset?` は `false` になります。この差を、一か所の比較演算子だけで表しています。

また、`superset?` の実装をそのまま活かし、`alias >` で演算子にも対応させています。`a > b` と書くと、数学の真部分集合の記号に近い読み方ができます。

## まとめ

`proper_superset?` は、`superset?` と同じ構造で比較演算子を `>` に変えたものです。要素数の判定と内部ハッシュの比較で、真の上位集合かどうかを確かめています。
