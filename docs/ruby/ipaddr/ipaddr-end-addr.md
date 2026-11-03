---
title: "マスクを反転して、範囲の最後のアドレスを作る"
description: "IPAddr の内部メソッド end_addr は、アドレスとマスクの反転値の OR を取って、ネットワークの最後のアドレスを求める。"
language: ruby
project: "Ruby ipaddr (標準ライブラリ)"
repo: https://github.com/ruby/ipaddr
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002 Hajimu UMEMOTO <ume@mahoroba.org>; Copyright (c) 2007-2017 Akinori MUSHA <knu@iDaemons.org>"
commit: "5b61ff80018849935cad16aac5bb383ebc57dd08"
file: lib/ipaddr.rb
lines: [637, 646]
function: "IPAddr#end_addr"
difficulty: 2
format: 2
tags: ["ネットワーク", "ビット演算"]
---
## ひとことで

`end_addr` は、ネットワークの中で一番大きいアドレスを求める内部メソッドです。
たとえば `192.168.2.0/24` なら `192.168.2.255` を返します。
先頭のアドレスを求める `begin_addr` と組になって、範囲の両端を作ります。

## コード

```ruby:line-numbers=637
  def end_addr
    case @family
    when Socket::AF_INET
      @addr | (IN4MASK ^ @mask_addr)
    when Socket::AF_INET6
      @addr | (IN6MASK ^ @mask_addr)
    else
      raise AddressFamilyError, "unsupported address family"
    end
  end
```

## 前提知識

- **ビットの OR（`|`）**: 2 つの数の、対応するビットのどちらかが 1 なら 1 になる演算です。
- **ビットの XOR（`^`）**: 対応するビットが違うときに 1 になる演算です。ここでは、マスクを反転するために使われています。
- **マスク**: ネットワーク部分のビットが 1、ホスト部分のビットが 0 の数です。`/24` なら、上位 24 ビットが 1 になります。
- **IN4MASK / IN6MASK**: IPv4 は 32 ビット、IPv6 は 128 ビットがすべて 1 の数です。`IN4MASK ^ @mask_addr` で、マスクを反転できます。
- **protected**: このメソッドは、同じクラスのオブジェクトからだけ呼べる内部メソッドです。利用者が直接呼ぶものではありません。

## 何をしているか

### 1. 系統ごとに、使うビット幅を決める

```ruby:line-numbers=638
    case @family
    when Socket::AF_INET
```

IPv4 と IPv6 では、アドレスのビット数が違います。IPv4 は 32 ビット、IPv6 は 128 ビットです。
そのため、ビット幅に合わせた全 1 の値（`IN4MASK` か `IN6MASK`）を選びます。

### 2. マスクを反転して、ホスト部分だけを取り出す

```ruby:line-numbers=640
      @addr | (IN4MASK ^ @mask_addr)
```

`@mask_addr` は、ネットワーク部分が 1 のマスクです。`IN4MASK ^ @mask_addr` で反転すると、ホスト部分だけが 1 になります。
`192.168.2.0/24` の場合、マスクは `255.255.255.0` で、反転すると `0.0.0.255` になります。

### 3. アドレスと OR して、末尾を作る

```ruby:line-numbers=640
      @addr | (IN4MASK ^ @mask_addr)
```

`@addr` は、ふつうは先頭のアドレスです。ホスト部分をすべて 1 にすると、そのネットワークの最後のアドレスになります。
`192.168.2.0` に `0.0.0.255` を OR すると、`192.168.2.255` になります。

## ここがすごい

### 足し算ではなく、OR で末尾を作る

「末尾 = 先頭 + ホスト部分の最大値」と書くこともできます。しかし、OR を使うと、ホスト部分のビットを直接 1 にできます。
ビットの足し算で桁上がりを考える必要がなく、計算の意図も読み取りやすいです。

### 反転だけで、ホスト部分が取り出せる

マスクを反転させるだけで、「ホスト部分」のビットが手に入ります。
ネットワーク部分とホスト部分を、別々に計算しなくてよいのが、この実装の良いところです。

### IPv4 と IPv6 を、同じ形の式で書いている

`case` で分けるのは、ビット幅が違うからだけです。式の形は同じで、読み手は 1 つの考え方として理解できます。

## まとめ

- ネットワークの最後のアドレスは、先頭のアドレス（`@addr`）と、マスクの反転値の OR で求められます。
- マスクの反転は、ホスト部分のビットだけを 1 にする操作です。
- 足し算ではなく OR を使うので、桁上がりを考えずに済みます。
- IPv4 と IPv6 の違いは、ビット幅の定数だけです。
