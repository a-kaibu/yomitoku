---
title: "連続する整数の合計を、ループなしで求める"
description: "Range#sum は、整数の範囲の合計を等差数列の公式で一度に計算する。ブロックがあるときや整数でないときは、通常の sum に任せる。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/enumerable.rb
lines: [280, 291]
function: "Range#sum"
difficulty: 2
format: 2
tags: ["数値計算", "アルゴリズム", "最適化"]
---
## ひとことで

`Range#sum` は、整数の範囲（例: `1..100`）の合計を、**等差数列の公式で一度に計算する** メソッドです。
1 から 100 までを 1 つずつ足すと 100 回の加算になりますが、公式を使えば 1 回の計算で済みます。
ブロックが渡されたときや、整数でない範囲のときは、通常の `sum` に任せます。

## コード

```ruby:line-numbers=280
  def sum(initial_value = 0)
    if block_given? || !(first.is_a?(Integer) && last.is_a?(Integer))
      super
    else
      actual_last = exclude_end? ? (last - 1) : last
      if actual_last >= first
        initial_value + (actual_last - first + 1) * (actual_last + first) / 2
      else
        initial_value
      end
    end
  end
```

## 前提知識

- **等差数列**: 隣り合う数の差が一定な数の並びです。`1, 2, 3, …, n` がその例です。
- **等差数列の和の公式**: 最初の値を `a`、最後の値を `b` とすると、個数は `b - a + 1`、和は `(個数) × (a + b) ÷ 2` になります。
- **`exclude_end?`**: 範囲の終わりを含まないかを調べます。`1...10` のように `...` で書いたときは真です。
- **`super`**: 同じ名前の、親のメソッドを呼び出します。ここでは通常の `sum` が呼ばれます。

## 何をしているか

### 1. 公式を使える場合かを調べる

```ruby:line-numbers=281
    if block_given? || !(first.is_a?(Integer) && last.is_a?(Integer))
      super
```

ブロックがなく、範囲の両端がどちらも整数のときだけ、公式を使います。それ以外は `super` で通常の `sum` を呼びます。

### 2. 終わりの値を決める

```ruby:line-numbers=284
      actual_last = exclude_end? ? (last - 1) : last
```

`...` のように終わりを含まない範囲なら、最後の値を 1 つ減らします。

### 3. 公式で計算する

```ruby:line-numbers=285
      if actual_last >= first
        initial_value + (actual_last - first + 1) * (actual_last + first) / 2
      else
        initial_value
      end
```

最後の値が最初の値以上なら、`(最後 − 最初 + 1) × (最後 + 最初) ÷ 2` で合計を計算します。範囲が空なら、初期値をそのまま返します。

## ここがすごい

### 計算量を、範囲の大きさによらず一定にする

範囲が 100 万まででも、公式なら計算は一瞬です。ループを使うと、範囲の大きさに比例して時間がかかります。

### 特別な場合だけ速く、ほかは元の動きに任せる

ブロックや、整数でない範囲は、公式が当てはまりません。
そこで `super` に任せることで、速さを上げながら、正しさは落とさない設計になっています。

### 整数の割り算の順番に注意している

`(個数) × (a + b) / 2` の割り算は、必ず割り切れる形になっています。合計を先に割ると、小数になってしまう場面がありえます。
この順番は、等差数列の性質に沿って決められています。

## まとめ

- 連続する整数の合計は、等差数列の公式で一度に求められます。
- 速い方法が使えない場合は、元の方法に任せると、正しさを保てます。
- 公式を使うときは、割り算がどこで行われるかに注意すると、誤りを防げます。
