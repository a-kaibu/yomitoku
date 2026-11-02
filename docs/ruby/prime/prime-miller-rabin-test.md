---
title: "「確率的に素数らしい」を確かめる Miller-Rabin 法"
description: "大きな整数が素数かを、底（base）と累乗の繰り返しで素早く判定する。ループの break の戻り値を使って、失敗の判定を 1 つの式にまとめている。"
language: ruby
project: "Ruby prime (標準ライブラリ)"
repo: https://github.com/ruby/prime
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1998-2008 Keiju ISHITSUKA(SHL Japan Inc.); Copyright (c) 2008 Yuki Sonoda (Yugui) <yugui@yugui.jp>"
commit: "7b445df81264849c998873d4b24b32ea551048a3"
file: lib/prime.rb
lines: [96, 117]
function: "Integer#miller_rabin_test"
difficulty: 3
format: 2
tags: ["数値計算", "アルゴリズム"]
---
## ひとことで

`miller_rabin_test` は、整数が **素数かどうかを Miller-Rabin 法で判定する** 内部メソッドです。
すべての数を割り算で試す方法より速く、大きな整数でも使えます。
与えた底（`bases`）の数だけ「素数なら必ず通る計算」を行い、1 つでも通らなければ合成数（素数ではない数）と確定させます。

## コード

```ruby:line-numbers=96
  private def miller_rabin_test(bases)
    return false if even?

    r = 0
    d = self >> 1
    while d.even?
      d >>= 1
      r += 1
    end

    self_minus_1 = self-1
    bases.each do |a|
      x = a.pow(d, self)
      next if x == 1 || x == self_minus_1 || a == self

      return false if r.times do
        x = x.pow(2, self)
        break if x == self_minus_1
      end
    end
    true
  end
```

## 前提知識

- **素数**: 1 と自分自身以外で割り切れない 2 以上の整数です。
- **合成数**: 素数ではない 2 以上の整数です。
- **`>>`（右シフト）**: 2 進数で桁をずらす演算子です。`n >> 1` は `n` を 2 で割った商（切り捨て）と同じです。
- **`pow(d, self)`**: `a ** d` を `self` で割った余りを、大きな数でも速く計算します。
- **`times`**: `r.times` は 0 から `r - 1` まで繰り返すメソッドです。
- **`break` の値**: `break` で抜けるとき、`break` が `nil` を返すと、`times` の呼び出しも `nil` になります。

## 何をしているか

### 1. 偶数と分かれば、すぐに偽

```ruby:line-numbers=97
    return false if even?
```

2 を除けば、偶数は素数ではありません。ここで判定を終わらせます。

### 2. `n - 1` を 2 で割り切れるだけ割る

```ruby:line-numbers=99
    r = 0
    d = self >> 1
    while d.even?
      d >>= 1
      r += 1
    end
```

`d` は `n >> 1`、つまり `(n - 1) / 2` から始めて、偶数である間は 2 で割ります。割った回数が `r` です。
Miller-Rabin 法では `n - 1` を「2 の累乗 × 奇数 `d`」の形に分けますが、このコードは `r` を 1 少なく数えた形で、その後の繰り返し回数に使っています。

例えば `n = 13` なら、`n - 1 = 12 = 4 × 3` です。`d` は `6` から始まり、3 になるまでに `r = 1` になります。

### 3. 底ごとに、`a^d mod n` を調べる

```ruby:line-numbers=106
    self_minus_1 = self-1
    bases.each do |a|
      x = a.pow(d, self)
      next if x == 1 || x == self_minus_1 || a == self
```

底 `a` ごとに `x = a^d mod n` を計算します。`x` が `1` か `n - 1` なら、この底では合格です（`next`）。
`a == self` の場合も、底が判定対象そのものなので飛ばします。

### 4. 途中で `n - 1` になれば合格、なければ失敗

```ruby:line-numbers=111
      return false if r.times do
        x = x.pow(2, self)
        break if x == self_minus_1
      end
```

`x` を 2 乗するたびに確かめ、`n - 1` になったら `break` します。最後まで `n - 1` にならなければ、その底では「合成数だ」と判定されます。

最後に、すべての底で失敗がなければ `true` を返します。

## ここがすごい

### 「break の値が nil」を条件に使う

`return false if r.times do ... end` は、一見すると読みにくい書き方です。
ループが `break` で抜けたときは `nil` が返るので、`if` は偽になり、`return` されません。
ループが最後まで回ったときは `times` が `r`（0 でも真）を返すので、`return false` が実行されます。
「途中で合格したら何もしない、一度も合格しなかったら失敗」を、1 つの式で表しています。

### 底の数で正確さを選ぶ

Miller-Rabin 法は、底をいくつ使うかで確かさが決まります。このコードでは、`miller_rabin_bases` が数の大きさに応じた底の集まりを返すので、小さな数で無駄に多くの計算をせず、大きな数でも十分な精度を保てます。

### 失敗は 1 つで決まる

ある底で失敗すれば、その数は素数ではないと確定します。残りの底を調べる必要はないので、`return false` で即座に返しています。

## まとめ

- Miller-Rabin 法は、`n - 1` の分解と、底による累乗の検査で素数らしさを確かめます。
- 「合格」を `next`、「失敗」を `return false` で分けると、判定の流れが読みやすくなります。
- `break` の戻り値を使うと、途中で成功したかどうかを 1 つの条件に含められます。
