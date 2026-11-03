---
title: "16 進の文字列を、そのままバイト列にして IP アドレスを送る形にする"
description: "IPAddr#hton は、アドレスを 16 進の文字列にしてから pack の H 指定でバイト列に変える。文字列の長さが、そのままバイト数を決める。"
language: ruby
project: "Ruby ipaddr (標準ライブラリ)"
repo: https://github.com/ruby/ipaddr
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002 Hajimu UMEMOTO <ume@mahoroba.org>; Copyright (c) 2007-2017 Akinori MUSHA <knu@iDaemons.org>"
commit: "5b61ff80018849935cad16aac5bb383ebc57dd08"
file: lib/ipaddr.rb
lines: [311, 319]
function: "IPAddr#hton"
difficulty: 2
format: 2
tags: ["ネットワーク", "パース", "ビット演算"]
---
## ひとことで

`IPAddr#hton` は、IP アドレスを、ネットワークに送るためのバイト列に変換します。
名前の `hton` は「host to network」の略で、C 言語の `htonl` などと同じ意味です。
数を直接バイトに分ける代わりに、いったん 16 進数の文字列にしてから `pack` でバイト列に変えています。

## コード

```ruby:line-numbers=311
  def hton
    case @family
    when Socket::AF_INET, Socket::AF_INET6
      value = to_hex
      return [value].pack("H#{value.length}")
    else
      raise AddressFamilyError, "unsupported address family"
    end
  end
```

## 前提知識

- **16 進数**: 0 から 9 と a から f の 16 種類の数字で表す記数法です。1 桁で 4 ビットを表します。
- **バイト列**: 1 バイトが 8 ビットの数の並びです。2 桁の 16 進数が、ちょうど 1 バイトに対応します。
- **`pack`**: 配列の値を、バイト列に詰め直すメソッドです。`unpack` の逆の操作です。
- **`"H"` 指定**: `pack` で、文字列を 16 進数として読む指定です。`"H8"` は 8 桁の 16 進数を 4 バイトにします。
- **`to_hex`**: IP アドレスを、同じ幅の 16 進数の文字列に変えるメソッドです。

## 何をしているか

### 1. 系統を確かめる

```ruby:line-numbers=312
    case @family
    when Socket::AF_INET, Socket::AF_INET6
```

IPv4 と IPv6 のどちらでも、同じ処理で変換できます。ほかの系統は、ここでエラーになります。

### 2. 16 進数の文字列を作る

```ruby:line-numbers=314
      value = to_hex
```

`to_hex` は、IPv4 なら 8 桁、IPv6 なら 32 桁の 16 進数の文字列を返します。
たとえば `192.168.1.1` は、`"c0a80101"` になります。

### 3. 文字列の長さを使って、バイト列にする

```ruby:line-numbers=315
      return [value].pack("H#{value.length}")
```

`"H#{value.length}"` は、文字列の長さに合わせた `H` 指定を作ります。`"c0a80101"` なら `"H8"` です。
`pack("H8")` は、2 桁ずつ 1 バイトにまとめるので、4 バイトの `"\xC0\xA8\x01\x01"` になります。

## ここがすごい

### 数を 1 バイトずつ割るより、単純な形になる

整数から 1 バイトずつ取り出すには、ビットシフトと `& 0xff` を繰り返す必要があります。
この実装は、まず 16 進数の文字列にすることで、その計算をすべて省いています。
16 進数は、1 桁 4 ビットなので、2 桁が 1 バイトに、そのまま対応します。

### 長さを変数で指定する

`"H#{value.length}"` と書くことで、IPv4 と IPv6 のどちらも、同じ式で処理できます。
IPv6 でも `"H32"` になるだけで、コードは一切変わりません。

### 変換の結果が、ネットワークの並び順になる

16 進数の文字列は、上位のバイトから順に並んでいます。
ネットワークでは、上位バイトを先に送る決まりがあるので（ネットワークバイトオーダー）、この並びがそのまま使えます。

## まとめ

- 16 進数の文字列は、1 桁が 4 ビットなので、2 桁が 1 バイトに対応します。
- `pack("H…")` は、16 進数の文字列を直接バイト列に変えます。
- 文字列の長さから形式を作ると、IPv4 と IPv6 を同じ式で扱えます。
- 変換の結果は、ネットワークで使う上位バイトが先の並び順になります。
