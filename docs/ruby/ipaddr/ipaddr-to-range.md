---
title: "ネットワークを、先頭から末尾までの Range にする"
description: "IPAddr#to_range は、ネットワークの先頭と末尾のアドレスを使い、両端を含む Range を作る。Range#cover? で、範囲の判定にもそのまま使える。"
language: ruby
project: "Ruby ipaddr (標準ライブラリ)"
repo: https://github.com/ruby/ipaddr
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002 Hajimu UMEMOTO <ume@mahoroba.org>; Copyright (c) 2007-2017 Akinori MUSHA <knu@iDaemons.org>"
commit: "5b61ff80018849935cad16aac5bb383ebc57dd08"
file: lib/ipaddr.rb
lines: [537, 539]
function: "IPAddr#to_range"
difficulty: 1
format: 2
tags: ["ネットワーク", "イテレータ", "API設計"]
---
## ひとことで

`IPAddr#to_range` は、ネットワークを、最初のアドレスから最後のアドレスまでの `Range`（範囲オブジェクト）に変換します。
`192.168.2.0/24` なら、`192.168.2.0..192.168.2.255` の範囲になります。
Ruby の `Range` の機能（`cover?`、`each`、`step` など）を、そのまま使えるようになります。

## コード

```ruby:line-numbers=537
  def to_range
    self.class.new(begin_addr, @family)..self.class.new(end_addr, @family)
  end
```

## 前提知識

- **`Range`**: `1..10` のように、始まりと終わりの値を持つ範囲オブジェクトです。`..` は終わりを含み、`...` は終わりを含みません。
- **`begin_addr` と `end_addr`**: ネットワークの最初のアドレスと、最後のアドレスを求める内部メソッドです。
- **`self.class.new`**: 同じクラスの新しいオブジェクトを作る書き方です。`IPAddr` の中では `IPAddr.new` と同じ意味になります。
- **`cover?`**: `Range` が、ある値を範囲に含むかを調べるメソッドです。
- **`Comparable`**: 大小の比較ができるクラスが使う仕組みです。`Range` は、両端の `<=>` で範囲を判定します。

## 何をしているか

### 1. ネットワークの先頭アドレスを作る

`self.class.new(begin_addr, @family)` の部分で、先頭の `IPAddr` を作ります。

`begin_addr` は、アドレスとマスクの AND で求めた先頭の数です。
それを `IPAddr` のオブジェクトにして、範囲の左端にします。系統（`@family`）も一緒に渡すので、IPv4 の範囲は IPv4 のまま作られます。

### 2. ネットワークの末尾アドレスを作る

```ruby:line-numbers=538
    self.class.new(begin_addr, @family)..self.class.new(end_addr, @family)
```

`..` の右側で、`end_addr` を使って同じように `IPAddr` を作ります。
これで、両端を含む範囲（`Range`）が完成します。

### 3. 作った範囲で判定する

```ruby
net = IPAddr.new("192.168.2.0/24")
range = net.to_range
range.cover?(IPAddr.new("192.168.2.100"))  # => true
range.cover?(IPAddr.new("192.168.3.0"))    # => false
```

`IPAddr` は `Comparable` を含んでいるので、`Range` は両端との `<=>` で判定できます。
ここでは、`include?` とほぼ同じ答えが、`Range` のメソッドで得られます。

## ここがすごい

### 範囲の計算を、`Range` の仕組みに任せている

`IPAddr` は、範囲の両端を求めるだけで、`Range` を作れます。範囲を判定する、列挙する、といった処理は `Range` の機能に任せられます。
自分で「範囲の判定」「範囲の列挙」を実装しなくてよい設計です。

### 系統を保ったまま、両端を作る

先頭と末尾は、それぞれ別の `IPAddr` になります。両方に `@family` を渡しているので、IPv4 の範囲の両端が、誤って IPv6 になることはありません。

### 「終わりを含む」範囲になっている

`..` を使っているので、末尾のアドレス（`192.168.2.255`）も範囲に含まれます。
ネットワークの最後のアドレスも、正しく範囲の中に入ります。

## まとめ

- `to_range` は、先頭と末尾の `IPAddr` から `Range` を作ります。
- 範囲の判定や列挙は、`Range` のメソッドに任せられます。
- `..` を使うので、末尾のアドレスも範囲に含まれます。
- 系統を一緒に渡すので、両端の系統は必ず揃います。
