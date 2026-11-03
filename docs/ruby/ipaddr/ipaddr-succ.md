---
title: "次の IP アドレスを、1 を足すだけで作る"
description: "IPAddr#succ は、アドレスの内部の数に 1 を足した新しい IPAddr を返す。範囲の外へ出るときは、set が例外で止める。"
language: ruby
project: "Ruby ipaddr (標準ライブラリ)"
repo: https://github.com/ruby/ipaddr
license: "BSD-2-Clause OR Ruby"
copyright: "Copyright (c) 2002 Hajimu UMEMOTO <ume@mahoroba.org>; Copyright (c) 2007-2017 Akinori MUSHA <knu@iDaemons.org>"
commit: "5b61ff80018849935cad16aac5bb383ebc57dd08"
file: lib/ipaddr.rb
lines: [512, 514]
function: "IPAddr#succ"
difficulty: 1
format: 2
tags: ["ネットワーク", "イディオム"]
---
## ひとことで

`IPAddr#succ` は、いま持っている IP アドレスの「次のアドレス」を返します。
`192.168.1.1` なら `192.168.1.2` です。
元のオブジェクトは変えず、新しいオブジェクトを返すので、ループで順番にアドレスを回すときに便利です。

## コード

```ruby:line-numbers=512
  def succ
    return self.clone.set(@addr + 1, @family)
  end
```

## 前提知識

- **`succ`**: 「次の値」を返すという意味の、Ruby の慣用的なメソッド名です。`Integer#succ` や `String#succ` にも同じ名前があります。
- **`clone`**: オブジェクトの複製を作るメソッドです。複製を変えても、元のオブジェクトは変わりません。
- **メソッドチェーン**: `clone.set(...)` のように、メソッドの戻り値に続けて次のメソッドを呼ぶ書き方です。
- **`set`**: 内部の数（`@addr`）を書き換えるメソッドです。範囲の確認もここで行われます。
- **`@addr`**: IP アドレスを、1 つの整数として持っている変数です。

## 何をしているか

### 1. 元のオブジェクトを複製する

```ruby:line-numbers=513
    return self.clone.set(@addr + 1, @family)
```

`self.clone` で、同じ内容の新しい `IPAddr` を作ります。ここから `set` を呼ぶので、元の `IPAddr` の値は変わりません。

### 2. 内部の数に 1 を足す

```ruby:line-numbers=513
    return self.clone.set(@addr + 1, @family)
```

`@addr + 1` は、数として次のアドレスです。IPv4 の `192.168.1.1` は、整数にすると `3232235777` です。それに 1 を足すと、`3232235778`、つまり `192.168.1.2` になります。

### 3. 範囲を確かめて、結果を返す

`set` には、受け取った数が、IPv4 なら 32 ビット、IPv6 なら 128 ビットに収まるかを確かめる処理があります。
最後のアドレス `255.255.255.255` の次は、32 ビットに収まらないので、`InvalidAddressError` になります。
この確認は、`set` の中で行われるので、`succ` の中身は 1 行で済みます。

## ここがすごい

### 変更せず、新しい値を返す

`succ` は、元のアドレスを書き換えません。`Hash` のキーや `Set` の要素として使っているアドレスを、知らないうちに変えてしまう事故を防げます。
Ruby の数や文字列も、`succ` は同じように新しい値を返します。その約束に合わせた作りです。

### 足し算の範囲外を、自分で書かずに済む

IP アドレスは、ただの整数に見えて、上限があります。その上限チェックを `set` に任せることで、`succ` は「1 を足す」という意図だけを書けています。
読み手は、アドレスを順番に回すときの意味を、すぐ理解できます。

### 系統（IPv4 / IPv6）を、そのまま引き継ぐ

`clone` で複製するので、IPv4 のアドレスは、次も IPv4 のまま残ります。`@family` を引数に渡しているのは、その系統を明示するためです。

## まとめ

- `succ` は、内部の数に 1 を足した新しい `IPAddr` を返します。
- 元のオブジェクトは変わらないので、安全に回せます。
- 上限の確認は `set` が担当し、`succ` は意図だけを書いています。
- IPv4 と IPv6 の系統は、複製の時点で引き継がれます。
