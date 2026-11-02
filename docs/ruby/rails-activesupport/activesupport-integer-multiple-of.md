---
title: "0 で割らずに、倍数かどうかを調べる"
description: "Integer#multiple_of? は、ある整数がほかの整数の倍数かを調べる。除数が 0 のときは、自分も 0 かどうかで判定して、ゼロ除算を避ける。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "5810776eecc5b2e50b58e81ee0c26c02c718fdf0"
file: activesupport/lib/active_support/core_ext/integer/multiple.rb
lines: [11, 13]
function: "Integer#multiple_of?"
difficulty: 1
format: 2
tags: ["数値計算", "イディオム", "防御的プログラミング"]
---
## ひとことで

`Integer#multiple_of?` は、整数が **別の整数の倍数かどうか** を調べて、`true` か `false` を返すメソッドです。
`10.multiple_of?(5)` は `true`、`10.multiple_of?(4)` は `false` です。
除数が 0 の場合でもエラーにせず、「0 は 0 の倍数だけ」という数学の決まりで答えます。

## コード

```ruby:line-numbers=11
  def multiple_of?(number)
    number == 0 ? self == 0 : self % number == 0
  end
```

## 前提知識

- **倍数**: ある数を整数倍した数です。`10` は `5` の倍数（5 × 2）で、`4` の倍数ではありません（4 × 2.5）。
- **剰余（余り）**: `%` 演算子で、割ったときの余りを求めます。`10 % 4` は `2` です。
- **ゼロ除算**: 0 で割る計算は定義されず、Ruby では例外になります。
- **三項演算子 `条件 ? A : B`**: 条件が真なら `A`、偽なら `B` を返します。

## 何をしているか

### 1. 除数が 0 なら、自分も 0 かを見る

```ruby:line-numbers=12
    number == 0 ? self == 0 : self % number == 0
```

除数が `0` のとき、`self % 0` を計算すると例外になります。そこで、`self == 0` かどうかで答えを決めます。0 は 0 の倍数とみなすという、数学の約束に合わせています。

### 2. それ以外は、余りが 0 かを見る

```ruby:line-numbers=12
    number == 0 ? self == 0 : self % number == 0
```

除数が 0 でなければ、`self % number` の余りが 0 なら割り切れる、つまり倍数です。`== 0` の比較の結果が、そのまま `true` か `false` になります。

## ここがすごい

### 例外を避けて、答えを決める

除数が 0 のときを特別扱いしているので、呼び出し側が事前に確かめなくても安全に呼べます。
「判定だけしたい」場面で、エラー処理を書かずに済みます。

### 三項演算子で、1 行に収める

条件が 1 つだけなので、`if` 文を書かず、1 行の式で答えを返しています。
読み手は「0 のときは 0 かどうか、それ以外は余りを見る」と、すぐ読み取れます。

### 比較の結果を直接返す

`x % n == 0` の結果は、真偽値そのものです。`if ... then true else false end` のような書き方は不要です。

## まとめ

- 倍数の判定は、剰余が 0 かどうかで行えます。
- 0 で割る場合は、数学の約束に沿って答えを決めると、例外を避けられます。
- 判定の結果が真偽値なら、その式をそのまま返すと簡潔になります。
