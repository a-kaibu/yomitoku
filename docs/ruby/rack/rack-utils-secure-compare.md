---
title: "長さが同じ文字列だけを、時間をかけずに比べる"
description: "Rack::Utils.secure_compare は、トークンやパスワードを比べるときに、最初の違いで打ち切らない比較を使う。長さが違えば、すぐ false を返す。"
language: ruby
project: "Rack"
repo: https://github.com/rack/rack
license: "MIT"
copyright: "Copyright (C) 2007-2021 Leah Neukirchen <http://leahneukirchen.org/infopage.html>"
commit: "da90464e3fa93e3cb49dc2d4ede798e6c6b70b4f"
file: lib/rack/utils.rb
lines: [539, 543]
function: "Rack::Utils.secure_compare"
difficulty: 2
format: 2
tags: ["セキュリティ", "暗号", "防御的プログラミング"]
---
## ひとことで

`Rack::Utils.secure_compare` は、2 つの文字列が同じかを、**一致しない場所で打ち切らずに比べる** メソッドです。
トークンや署名など、秘密の値を比べるときに使います。
長さが違う場合は、すぐに `false` を返します。

## コード

```ruby:line-numbers=539
      def secure_compare(a, b)
        return false unless a.bytesize == b.bytesize

        OpenSSL.fixed_length_secure_compare(a, b)
      end
```

## 前提知識

- **タイミング攻撃**: 比較の処理にかかる時間の差から、秘密の値を少しずつ推測する攻撃です。
- **`bytesize`**: 文字列を、バイト数で数えた長さです。文字の数とは違うことがあります。
- **`return false unless 条件`**: 条件が偽のとき、そこで `false` を返します。
- **`OpenSSL.fixed_length_secure_compare`**: 同じ長さの 2 つのバイト列を、時間がほぼ変わらない方法で比べる関数です。
- **`==` の問題**: 普通の比較は、最初に違う位置が見つかった時点で終わることが多く、違う場所によって時間が変わります。

## 何をしているか

### 1. 長さが違えば、すぐ `false`

```ruby:line-numbers=540
        return false unless a.bytesize == b.bytesize
```

バイト数が違えば、同じ値ではありえません。ここで止めれば、比較の処理は行いません。

この段階の判定は、長さだけで決まるので、秘密の内容は漏れません。

### 2. 同じ長さなら、時間の変わらない比較を使う

```ruby:line-numbers=542
        OpenSSL.fixed_length_secure_compare(a, b)
```

長さがそろったら、`fixed_length_secure_compare` で、最後まで比べます。途中で違いが見つかっても、すぐには終わりません。

## ここがすごい

### 比べる時間に、答えの情報を含ませない

普通の `==` は、最初の 1 文字が違えば、すぐに `false` を返します。
攻撃者は、返事の速さを測ることで、「最初の 1 文字が合っていた」ことを知れます。
この関数は、一致の状況によらず、かかる時間をほぼ同じにしています。

### 長さだけは、先に比べてよい

長さは、秘密の内容ではないと考えて、先に比べています。
そのため、長さが違う場合は、あえて時間を揃えずに速く返せます。
「何を秘密として守るか」を分けて考えた設計です。

### 専用の関数に任せる

自分で「全部の文字を比べて、違いを足し込む」コードを書くと、コンパイラや最適化で時間の差が生まれることがあります。
OpenSSL の関数を使うことで、その心配を減らしています。

## まとめ

- 秘密の値を比べるときは、普通の `==` ではなく、時間の差が出ない比較を使います。
- 秘密ではない長さは先に比べて、無駄な処理を避けられます。
- 暗号の部品は、自分で書き直さずに、用途に合った関数を使うのが安全です。
