---
title: "公開サブネットの CIDR を、空のリストでも失敗しないように守る"
description: "terraform-aws-vpc の公開サブネットの cidr_block。concat で末尾に空文字を足し、サブネットの数が 0 のときも element がエラーにならないようにする。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [153, 153]
format: 2
function: "resource \"aws_subnet\"（concat と element による cidr_block）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
公開サブネットの CIDR は、`public_subnets` のリストから、番号で一つずつ取り出します。ただし、リストが空だと、`element` はエラーになります。このコードは、末尾に空文字を足してから取り出すことで、その失敗を避けています。

## コード
```hcl:line-numbers=153
  cidr_block                                     = var.public_subnet_ipv6_native ? null : element(concat(var.public_subnets, [""]), count.index)
```

## 前提知識
- `element(リスト, 番号)`: リストの指定した位置の値を返します。番号は、要素の数で割った余りで扱われます。
- `concat(リスト1, リスト2)`: リストを順につなぎます。
- `count.index`: `count` で作られる資源の、0 から始まる番号です。

## 何をしているか
### 1. 空のリストに、一つだけ空文字を足す

```hcl:line-numbers=153
  cidr_block                                     = var.public_subnet_ipv6_native ? null : element(concat(var.public_subnets, [""]), count.index)
```

`concat` で `[""]` を後ろに足します。`public_subnets` が空でも、リストには必ず一つ要素があるので、`element` はエラーになりません。

### 2. IPv6 のみのサブネットでは null にする

同じ行の三項演算子で、`public_subnet_ipv6_native` が真なら `null` を返します。IPv6 だけのサブネットでは、IPv4 の CIDR は使われないためです。

## ここがすごい
空のリストを特別扱いする `if` を書かず、リストに一つ要素を足すだけで、同じ効果を出しています。その結果、サブネットを作らない場合も、この式がそのまま動きます。

## まとめ
- `element` は空のリストで失敗するので、一つ足して守るのが定番の書き方です。
- `concat` で値を足すと、元のリストを変えずに済みます。
- IPv6 のみの場合のように、使わない属性は `null` で明示すると意図が伝わります。
