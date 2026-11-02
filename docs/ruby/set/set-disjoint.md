---
title: "共通の要素がないかを、交差の判定から導く"
description: "Set#disjoint? は、2 つの集合や列挙できるものに共通の要素が無いかを調べる。intersect? の結果を反対にするだけの、短い定義。"
language: ruby
project: "Ruby set (標準ライブラリ)"
repo: https://github.com/ruby/set
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002-2024 Akinori MUSHA <knu@iDaemons.org>"
commit: "0801252fbc76d6fc3eab694e7790a4ca72271552"
file: lib/set.rb
lines: [498, 500]
function: "Set#disjoint?"
difficulty: 1
format: 2
tags: ["データ構造", "イディオム", "API設計"]
---
## ひとことで

`Set#disjoint?` は、この集合と引数の間に **共通の要素が 1 つも無いか** を調べるメソッドです。
`Set[1, 2].disjoint?(Set[3, 4])` は `true` になります。
共通の要素があるかを調べる `intersect?` の、反対の答えを返します。

## コード

```ruby:line-numbers=498
  def disjoint?(set)
    !intersect?(set)
  end
```

## 前提知識

- **交差（intersection）**: 2 つの集合で、両方に含まれる要素の集まりです。
- **素な集合（disjoint）**: 共通の要素が 1 つも無い集合どうしのことです。
- **`!`（否定）**: 真なら偽、偽なら真を返します。
- **メソッドの再利用**: 既にあるメソッドを呼んで、その結果を反対にするだけの定義です。

## 何をしているか

### 1. 共通の要素があるかを、既存のメソッドで調べる

```ruby:line-numbers=499
    !intersect?(set)
```

`intersect?(set)` は、共通の要素が 1 つでもあれば `true` を返します。引数の型の扱いも、そちらに任せます。

### 2. その答えを反対にする

```ruby:line-numbers=499
    !intersect?(set)
```

`!` で反対にすると、共通の要素が無いときに `true` になります。これが「素な集合」の意味です。

## ここがすごい

### 2 つの判定を、1 か所にまとめる

共通の要素の判定は、`intersect?` だけにあります。
`disjoint?` は、その反対を返すだけなので、判定の規則が 2 か所に分かれません。

### 名前で意図を表す

「共通がある」と「共通がない」は、同じ判定の裏表です。
それぞれに名前を付けることで、呼び出し側は、読みたい方の意味をそのまま書けます。

### 引数の種類を、呼び出し先に任せる

集合でもない列挙可能なものも、`intersect?` が扱えます。
このメソッドは、その違いを知らなくてもよく、同じ規則で動きます。

## まとめ

- 反対の意味を持つ判定は、片方を基準にして否定すると、規則の重複を防げます。
- 判定の名前を、読み手が使いやすい形で用意すると、コードの意図が伝わります。
- 引数の扱いは、既存の部品に任せると、同じ動きを保てます。
