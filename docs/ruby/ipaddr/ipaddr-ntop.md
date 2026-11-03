---
title: "バイト列を、人が読める IP アドレスの表記に戻す"
description: "IPAddr.ntop は、ネットワーク用の 4 バイトか 16 バイトの文字列を、192.168.1.1 や IPv6 の表記に変換する。"
language: ruby
project: "Ruby ipaddr (標準ライブラリ)"
repo: https://github.com/ruby/ipaddr
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002 Hajimu UMEMOTO <ume@mahoroba.org>; Copyright (c) 2007-2017 Akinori MUSHA <knu@iDaemons.org>"
commit: "5b61ff80018849935cad16aac5bb383ebc57dd08"
file: lib/ipaddr.rb
lines: [115, 128]
function: "IPAddr.ntop"
difficulty: 1
format: 2
tags: ["ネットワーク", "パース", "文字列処理"]
---
## ひとことで

`IPAddr.ntop` は、ネットワークで送られてくる生の IP アドレス（バイト列）を、`192.168.1.1` や `3ffe:505:2::1` のような文字列に変換します。
バイト列の長さを見て、IPv4 か IPv6 かを判断します。
名前の `ntop` は、C 言語の `inet_ntop` と同じ由来です。

## コード

```ruby:line-numbers=115
  def self.ntop(addr)
    if addr.is_a?(String) && addr.encoding != Encoding::BINARY
      raise InvalidAddressError, "invalid encoding (given #{addr.encoding}, expected BINARY)"
    end

    case addr.bytesize
    when 4
      addr.unpack('C4').join('.')
    when 16
      IN6FORMAT % addr.unpack('n8')
    else
      raise AddressFamilyError, "unsupported address family"
    end
  end
```

## 前提知識

- **バイト列（BINARY）**: 文字ではなく、0 から 255 までの数の並びとして扱う文字列です。Ruby では `Encoding::BINARY` の文字列で表します。
- **`bytesize`**: 文字列のバイト数を返すメソッドです。文字数とは別物です。
- **`unpack`**: バイト列を、指定した形式の値の配列に分解するメソッドです。`'C4'` は 1 バイトずつ 4 個、`'n8'` は 2 バイトずつ 8 個の数として読みます。
- **`join`**: 配列の要素を、指定した文字で連結するメソッドです。
- **書式文字列（`%`）**: `format` と同じ働きで、値を埋め込んだ文字列を作ります。

## 何をしているか

### 1. 文字コードを確かめる

```ruby:line-numbers=116
    if addr.is_a?(String) && addr.encoding != Encoding::BINARY
      raise InvalidAddressError, "invalid encoding (given #{addr.encoding}, expected BINARY)"
    end
```

バイト列を、UTF-8 などの文字列として解釈すると、途中のバイトが文字の一部とみなされることがあります。
そのため、BINARY 以外の文字列を受け取ったら、先にエラーにします。

### 2. バイト数で、IPv4 か IPv6 かを決める

```ruby:line-numbers=120
    case addr.bytesize
```

IPv4 は 4 バイト、IPv6 は 16 バイトです。長さがそのまま系統を表すので、余分な引数は要りません。

### 3. IPv4 は、1 バイトずつ数にして、ドットで連結する

```ruby:line-numbers=122
      addr.unpack('C4').join('.')
```

`"\xC0\xA8\x01\x01".b.unpack('C4')` は `[192, 168, 1, 1]` を返します。これを `join('.')` でつなぐと、`192.168.1.1` になります。

### 4. IPv6 は、2 バイトずつ 16 進数にして、書式に埋める

```ruby:line-numbers=124
      IN6FORMAT % addr.unpack('n8')
```

`'n8'` は、2 バイトずつ 8 個の数として読みます。IPv6 の 1 区画は 16 ビットなので、この形で合います。
`IN6FORMAT` は、各区画を 16 進数で表示する書式です。

## ここがすごい

### バイト数だけで、系統を判断する

IPv4 と IPv6 を区別するための引数を取らず、バイト列の長さだけで判断しています。
どちらも、ネットワークから届くときは、長さがそのまま形式を表しています。

### `unpack` の 1 行で、表記を組み立てる

`unpack` の形式文字列を変えるだけで、同じ考え方で IPv4 と IPv6 を変換できます。
ループを書かずに、1 バイトずつ、または 2 バイトずつ取り出せるのが、`unpack` の強みです。

### 間違った文字コードを、先に弾く

エンコーディングの確認を最初に置くことで、後の処理が静かに壊れるのを防いでいます。
「届いたデータの形式を、最初に確かめる」という、防御的なプログラミングの良い例です。

## まとめ

- IP アドレスのバイト列は、長さで IPv4 か IPv6 かを判断できます。
- `unpack('C4')` は IPv4 の各バイトを、`unpack('n8')` は IPv6 の各 16 ビットを取り出します。
- 文字列として解釈される前に、BINARY かどうかを確かめます。
- 表記への変換は、`join` と書式文字列を組み合わせると短く書けます。
