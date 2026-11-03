---
title: "IPアドレスが範囲に入っているかを、2 つの数の比較だけで調べる"
description: "IPAddr#include? は、ネットワークの先頭と末尾のアドレスを数として比べるだけで、あるアドレスがその範囲に入るかを判定する。"
language: ruby
project: "Ruby ipaddr (標準ライブラリ)"
repo: https://github.com/ruby/ipaddr
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002 Hajimu UMEMOTO <ume@mahoroba.org>; Copyright (c) 2007-2017 Akinori MUSHA <knu@iDaemons.org>"
commit: "5b61ff80018849935cad16aac5bb383ebc57dd08"
file: lib/ipaddr.rb
lines: [196, 200]
function: "IPAddr#include?"
difficulty: 1
format: 2
tags: ["ネットワーク", "ビット演算"]
---
## ひとことで

`IPAddr#include?` は、ある IP アドレスが、別のネットワーク（`192.168.2.0/24` のような範囲）に含まれるかを調べます。
範囲を一つずつ列挙するのではなく、範囲の先頭と末尾を数として比べるだけで答えを出します。
`===` という別名があるので、`case` 文の `when` にそのまま書けます。

## コード

```ruby:line-numbers=196
  def include?(other)
    other = coerce_other(other)
    return false unless other.family == family
    begin_addr <= other.begin_addr && end_addr >= other.end_addr
  end
```

## 前提知識

- **IP アドレス**: 4 バイト（IPv4）か 16 バイト（IPv6）の番号です。Ruby の `IPAddr` では、内部で 1 つの大きな整数として持っています。
- **ネットワーク（CIDR 表記）**: `192.168.2.0/24` のように、先頭から何ビットが「ネットワーク部分」かを `/` の後ろに書いた範囲です。
- **`coerce_other`**: 比較相手を `IPAddr` に変換するための内部メソッドです。文字列の `"192.168.2.100"` も受け取れます。
- **`family`**: IPv4 か IPv6 かを表す値です。違う系統どうしは、同じ範囲に入ることはありません。
- **`<=` と `>=`**: 数の大小を比べる演算子です。ここでは、範囲の両端を比べるために使っています。

## 何をしているか

### 1. 系統が違えば、すぐに false を返す

```ruby:line-numbers=197
    other = coerce_other(other)
    return false unless other.family == family
```

`IPv4` の範囲に `IPv6` のアドレスを入れても、意味のある答えはありません。最初に `family` を比べて、違えば `false` で終わります。

### 2. 範囲の先頭と末尾を、数として比べる

```ruby:line-numbers=199
    begin_addr <= other.begin_addr && end_addr >= other.end_addr
```

範囲の先頭 `begin_addr` 以上で、かつ末尾 `end_addr` 以下なら、その範囲の中に全部が入っています。
ここでは、相手が 1 つのアドレスのときも、相手がさらに小さなネットワークのときも、同じ式で扱えます。
たとえば `net1` が `192.168.2.0/24`、`net4` が `192.168.2.0/16` のとき、`net1.include?(net4)` は `false` です。`net4` の末尾は `192.168.255.255` で、`net1` の末尾より大きいからです。

### 3. 先頭と末尾は、マスクから作られる

先頭と末尾は、`begin_addr` と `end_addr` という内部メソッドで求めます。先頭は「アドレスとマスクの AND」、末尾は「アドレスとマスクを反転した値の OR」です。
その詳しい計算は、別の記事で見ていきます。

## ここがすごい

### 範囲の中身を、1 つずつ見なくてよい

素直に書くなら、「範囲の中のアドレスを 1 つずつ列挙して、一致するものがあるか調べる」になります。`/8` の範囲には 1,600 万個以上のアドレスがあるので、その方法は現実的ではありません。
この実装は、比較が 2 回で済みます。範囲の大きさに関係なく、同じ時間で答えが出ます。

### 別名の `===` で、`case` 文に組み込める

`alias === include?` によって、`case` 文の `when` で使えます。

```ruby
case ip
when IPAddr.new("10.0.0.0/8") then "社内"
when IPAddr.new("192.168.0.0/16") then "家庭内"
end
```

判定の意図が、そのまま読める書き方です。

### 系統の違いを、先に弾く

IPv4 の数と IPv6 の数は、同じ整数で比べると意味がずれてしまいます。`family` を先に比べることで、その取り違えを防いでいます。

## まとめ

- ネットワークの範囲は、先頭と末尾の 2 つの数で表せます。
- 「入っているか」は、範囲の中身を列挙せず、2 回の比較で判定できます。
- 系統（IPv4 / IPv6）が違えば、先に `false` で終わらせます。
- `===` という別名で、`case` 文の `when` に自然に書けます。
