---
title: "素因数分解の組から、もとの整数に戻す"
description: "Prime#int_from_prime_division は、[素数, 指数] の組の配列から、素数の累乗の積を計算して元の整数を復元する。inject で 1 から順にかける。"
language: ruby
project: "Ruby prime (標準ライブラリ)"
repo: https://github.com/ruby/prime
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 1998-2008 Keiju ISHITSUKA(SHL Japan Inc.); Copyright (c) 2008 Yuki Sonoda (Yugui) <yugui@yugui.jp>"
commit: "7b445df81264849c998873d4b24b32ea551048a3"
file: lib/prime.rb
lines: [268, 272]
function: "Prime#int_from_prime_division"
difficulty: 1
format: 2
tags: ["数値計算", "イテレータ", "イディオム"]
---
## ひとことで

`Prime#int_from_prime_division` は、`[素数, 指数]` の組の配列から、**元の整数を組み立てる** メソッドです。
`[[3, 2], [5, 1]]` は、`3² × 5¹ = 45` を表すので、`45` を返します。
前の関数 `prime_division` の逆の働きをします。

## コード

```ruby:line-numbers=268
  def int_from_prime_division(pd)
    pd.inject(1){|value, (prime, index)|
      value * prime**index
    }
  end
```

## 前提知識

- **素因数分解の逆**: 素因数分解で分けた数を、掛け合わせて元に戻すことです。
- **指数（べき乗）**: 同じ数を何回掛けるかを表します。`prime**index` は、素数を指数だけ掛けた値です。
- **`inject`**: 配列の要素を、順に 1 つの値へ畳み込みます。初期値に `1` を指定すると、掛け算の単位元から始まります。
- **ブロックの引数の分解 `(prime, index)`**: 組の配列の 1 つを、`prime` と `index` の 2 つの変数に分けて受け取ります。

## 何をしているか

### 1. 初期値を 1 にして、組を順にかける

```ruby:line-numbers=269
    pd.inject(1){|value, (prime, index)|
      value * prime**index
    }
```

`inject(1)` で、掛け算の初期値を `1` にします。各組 `(prime, index)` について、`value * prime**index` を計算して、次の段階の値とします。

例えば `[[3, 2], [5, 1]]` では、最初に `1 * 3² = 9`、次に `9 * 5¹ = 45` となります。

## ここがすごい

### 掛け算の単位元から始める

掛け算の初期値を `0` にすると、すべての結果が 0 になってしまいます。
`1` から始めることで、どんな組でも正しく掛け合わせられます。

### 組を分解して、そのまま式に書く

ブロックの引数を `(prime, index)` と分けて書くことで、`prime**index` という式が、読んですぐ意味のわかる形になります。
添字を使って `pair[0]` と書くより、何を掛けているかが明確です。

### 元に戻せることを確かめる

`prime_division` で分けた結果を、この関数で戻すと、元の数に一致します。
分解と組み立てが対になっているので、どちらか一方の正しさを、もう一方で確かめられます。

## まとめ

- 掛け算で値を組み立てるときは、初期値を単位元の `1` にします。
- 組の配列は、ブロックの引数で分解すると、式が読みやすくなります。
- 分解と組み立てを対で作ると、互いの正しさを確かめる手段になります。
