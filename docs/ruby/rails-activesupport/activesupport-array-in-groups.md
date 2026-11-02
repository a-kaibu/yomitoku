---
title: "余りを前のグループから 1 個ずつ配る in_groups"
description: "配列を「n 個のグループ」に均等に分ける。商と余りから各グループの長さを決め、余りを先頭のグループから順に配っていく。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/array/grouping.rb
lines: [75, 105]
function: "Array#in_groups"
difficulty: 2
format: 2
tags: [アルゴリズム, 数値計算]
---

## ひとことで

`in_groups(n)` は、配列を **n 個のグループに、なるべく同じ長さで** 分けるメソッドです。
`(1..10).to_a.in_groups(3)` は `[[1, 2, 3, 4], [5, 6, 7, nil], [8, 9, 10, nil]]` になります。
「何個ずつ」を指定する `in_groups_of` に対して、こちらは「いくつに分けるか」を指定します。

## コード

::: code-group

```ruby:line-numbers=75 [日本語訳]
  def in_groups(number, fill_with = nil, &block)
    if number.to_i <= 0
      raise ArgumentError,
        "Number of groups must be a positive integer, was #{number.inspect}"
    end

    number = number.to_i
    # size.div number は、小さい方のグループの大きさ。
    # size % number は、1 つ多く入れる必要がある要素の数。
    # 各グループは division 個か division + 1 個を持つ。
    division = size.div number
    modulo = size % number

    # dup を避けて新しい配列を作る。
    groups = []
    start = 0

    number.times do |index|
      length = division + (modulo > 0 && modulo > index ? 1 : 0)
      groups << last_group = slice(start, length)
      last_group << fill_with if fill_with != false &&
        modulo > 0 && length == division
      start += length
    end

    if block_given?
      groups.each(&block)
    else
      groups
    end
  end
```

```ruby:line-numbers=75 [原文]
  def in_groups(number, fill_with = nil, &block)
    if number.to_i <= 0
      raise ArgumentError,
        "Number of groups must be a positive integer, was #{number.inspect}"
    end

    number = number.to_i
    # size.div number gives minor group size;
    # size % number gives how many objects need extra accommodation;
    # each group hold either division or division + 1 items.
    division = size.div number
    modulo = size % number

    # create a new array avoiding dup
    groups = []
    start = 0

    number.times do |index|
      length = division + (modulo > 0 && modulo > index ? 1 : 0)
      groups << last_group = slice(start, length)
      last_group << fill_with if fill_with != false &&
        modulo > 0 && length == division
      start += length
    end

    if block_given?
      groups.each(&block)
    else
      groups
    end
  end
```

:::

## 前提知識

- **`size.div number`**: 整数の割り算（小数点以下を切り捨て）です。`10.div 3` は `3` です。
- **`%`**: 割り算の余りです。`10 % 3` は `1` です。
- **`n.times do |index| ... end`**: ブロックを n 回繰り返します。`index` には 0, 1, 2, … が入ります。
- **三項演算子 `条件 ? A : B`**: 条件が真なら A、偽なら B になります。
- **`slice(start, length)`**: 配列の `start` 番目から `length` 個を取り出した新しい配列を返します。
- **`groups << last_group = slice(...)`**: 右側から評価されます。まず `last_group` に切り出した配列を入れ、その配列を `groups` の末尾に追加します。
- **後置 if と複数行の条件**: `文 if 条件` は条件が真のときだけ文を実行します。行末の `&&` で条件を次の行に続けています。

## 何をしているか

### 1. 長さの基本と余りを求める

```ruby:line-numbers=85
    division = size.div number
    modulo = size % number
```
10 個を 3 グループに分ける例で追います。`division = 3`（全員に配れる数）、`modulo = 1`（余り）です。
つまり、各グループは 3 個か 4 個になり、4 個になるのは余りの数（1 つ）だけです。

### 2. 各グループの長さを決めて切り出す

```ruby:line-numbers=92
    number.times do |index|
      length = division + (modulo > 0 && modulo > index ? 1 : 0)
      groups << last_group = slice(start, length)
```
次の行で、`index` が `modulo` より小さいグループだけ 1 個多くします。

- index 0: `1 > 0` なので 3 + 1 = 4 個 → `[1, 2, 3, 4]`
- index 1: `1 > 1` は偽なので 3 個 → `[5, 6, 7]`
- index 2: 3 個 → `[8, 9, 10]`

`start` を長さぶん進めながら `slice` で切り出していきます。

### 3. 短いグループを埋める

```ruby:line-numbers=95
      last_group << fill_with if fill_with != false &&
        modulo > 0 && length == division
```
余りがあるとき、長さが `division` のグループ（短い方）には `fill_with`（初期値 `nil`）を 1 個足します。これで全グループの長さが 4 にそろいます。`false` を渡すと埋めません。

### 4. 返す

```ruby:line-numbers=100
    if block_given?
      groups.each(&block)
    else
      groups
    end
```
ブロックがあればグループごとに実行し、なければ配列を返します。

## ここがすごい

### 「余りを前から配る」で長さの差を最大 1 に

10 個を 3 つに分けるとき、素直に「3 個ずつ切って最後に残りを入れる」と `[3, 3, 4]` や `[3, 3, 3, 1]` のようにばらつきます。
このメソッドは商と余りを先に計算し、余りを先頭から 1 個ずつ配るので、グループの長さの差が **必ず 1 以下** になります。トランプを配るときと同じ考え方です。

### 一度の走査で済む

`start` を進めながら `slice` するだけなので、配列を何度も作り直したり、要素を 1 個ずつ動かしたりしません。コード中のコメントにもあるように、無駄なコピーを避ける書き方になっています。

### 代入を式として使う

`groups << last_group = slice(...)` は、追加と変数への保存を 1 行でしています。直後の行で「今追加したグループ」に `fill_with` を足すために、変数に覚えておく必要があるからです。Ruby では代入も値を返す式なので、このような書き方ができます。

## まとめ

- 均等に分けるには「商」と「余り」を先に求め、余りを前から 1 個ずつ配るとよいです。
- そうするとグループの大きさの差は最大 1 になります。
- Ruby では代入も式なので、追加と保存を同時に書けます（読みやすさとの兼ね合いで使います）。
- 「何個ずつ」と「いくつに」は似ていて違う問題なので、別のメソッドに分けると使う人が迷いません。
