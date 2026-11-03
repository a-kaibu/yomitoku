---
title: "1 つの CIDR を、private と public に等分して切り分ける"
description: "terraform-aws-dynamic-subnets の CIDR 計算。cidrsubnet を range で回し、private は下の範囲、public は上の範囲のサブネットを割り当てる。"
language: hcl
project: "terraform-aws-dynamic-subnets"
repo: https://github.com/cloudposse/terraform-aws-dynamic-subnets
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "ab53498a69d8a48b0c454482ffbbd112c29d450a"
file: main.tf
lines: [126, 132]
format: 2
function: "locals（ipv4_private_subnet_cidrs・ipv4_public_subnet_cidrs）"
difficulty: 3
tags: ["ネットワーク", "数値計算"]
---

## ひとことで
VPC の大きな IP の範囲（CIDR）を、小さなサブネットに切り分けるには、番号の計算が必要です。このモジュールは `cidrsubnet` という関数で、1 つの範囲から順番に小さな範囲を取り出します。先頭の番号は private に、続きの番号は public に使い、2 つが重ならないようにします。

## コード
```hcl:line-numbers=126
  ipv4_private_subnet_cidrs = local.compute_ipv4_cidrs ? [
    for net in range(0, local.private_cidr_reservations) : cidrsubnet(local.base_ipv4_cidr_block, local.required_ipv4_subnet_bits, net)
  ] : local.supplied_ipv4_private_subnet_cidrs

  ipv4_public_subnet_cidrs = local.compute_ipv4_cidrs ? [
    for net in range(local.private_cidr_reservations, local.cidr_reservations) : cidrsubnet(local.base_ipv4_cidr_block, local.required_ipv4_subnet_bits, net)
  ] : local.supplied_ipv4_public_subnet_cidrs
```

## 前提知識
- CIDR: `10.0.0.0/16` のように、IP アドレスの範囲を「先頭の一部 / ビット数」で表す書き方です。
- サブネット: VPC の範囲をさらに小さく分けたものです。AZ（アベイラビリティゾーン）ごとに置かれます。
- `cidrsubnet(prefix, newbits, netnum)`: ある CIDR を `newbits` だけ細かく分けて、`netnum` 番目の範囲を返します。
- `range(a, b)`: `a` から `b - 1` までの数の列を作ります。
- `for` 式: 数の列を回して、各数に対する結果のリストを作ります。
- 三項演算子: 利用者が範囲を渡したときは、その値を使い、そうでなければ計算した値を使います。

## 何をしているか
### 1. private には、先頭の番号を割り当てる

```hcl:line-numbers=127
    for net in range(0, local.private_cidr_reservations) : cidrsubnet(local.base_ipv4_cidr_block, local.required_ipv4_subnet_bits, net)
```

`range(0, private_cidr_reservations)` で、0 から始まる番号を作ります。`cidrsubnet` は、それぞれの番号に対応する小さな範囲を返します。番号 0 が一番若い範囲になるので、private サブネットは VPC の下の方の範囲を使います。

### 2. public には、続きの番号を割り当てる

```hcl:line-numbers=131
    for net in range(local.private_cidr_reservations, local.cidr_reservations) : cidrsubnet(local.base_ipv4_cidr_block, local.required_ipv4_subnet_bits, net)
```

public は、private が使い終わった番号から始まります。`range` の開始が `private_cidr_reservations` なので、2 つのリストが番号を重ねることはありません。

### 3. 利用者の指定があれば、計算しない

`local.compute_ipv4_cidrs ? [...] : local.supplied_...` の三項演算子で、利用者が直接 CIDR を渡していれば、その値を使います。計算は、必要なときだけ行われます。

## ここがすごい
同じ `base_ipv4_cidr_block` と `required_ipv4_subnet_bits` を使い、番号の範囲だけを `range` で分けています。計算の式は 1 種類なので、private と public の違いが「番号の開始位置」だけに現れます。読み手は、2 行を見比べるだけで、分け方を理解できます。

また、コメントにあるとおり、private に低い範囲を割り当てるのは、古い版との互換性のためです。利用者が既存の VPC で同じ範囲を使い続けられるように、この順番が守られています。

## まとめ
- `cidrsubnet` は、大きな範囲を等しい大きさに分けて、番号で取り出せます。
- `range` の開始位置を変えると、同じ式で重ならない 2 つの範囲を作れます。
- 利用者が直接値を渡せる経路を残すと、計算の仕組みを使わない場合にも対応できます。
