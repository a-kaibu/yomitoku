---
title: "IPAM を使うときは、CIDR を送らずに割り当てを任せる"
description: "terraform-aws-vpc の VPC 本体。use_ipam_pool が真なら cidr_block を null にし、IP の範囲は IPAM のプールに任せる。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [33, 38]
format: 2
function: "resource \"aws_vpc\"（this・cidr_block と IPAM）"
difficulty: 2
tags: ["ネットワーク", "API設計"]
---

## ひとことで
VPC の IP アドレスの範囲（CIDR）は、利用者が直接書くのが普通です。しかし、AWS の IPAM（IP アドレスの管理サービス）を使うと、範囲は IPAM のプールから自動で割り当てられます。このコードは、IPAM を使うときは `cidr_block` を送らず、プールの ID とネットマスクの長さを送ります。

## コード
```hcl:line-numbers=33
  cidr_block          = var.use_ipam_pool ? null : var.cidr
  ipv4_ipam_pool_id   = var.ipv4_ipam_pool_id
  ipv4_netmask_length = var.ipv4_netmask_length

  assign_generated_ipv6_cidr_block     = var.enable_ipv6 && !var.use_ipam_pool ? true : null
  ipv6_cidr_block                      = var.ipv6_cidr
```

## 前提知識
- CIDR: `10.0.0.0/16` のように、IP アドレスの範囲を表す書き方です。
- IPAM（IP Address Manager）: 組織の中の IP アドレスの範囲を、プールとして管理するサービスです。プールから、VPC に範囲を割り当てられます。
- ネットマスクの長さ（netmask length）: `/16` の `16` にあたる値です。範囲の大きさを表します。
- 自動生成の IPv6 CIDR: AWS が IPv6 の範囲を自動で割り当てる設定です。
- `null`: 属性を送らないことを表します。

## 何をしているか
### 1. IPAM のときは、CIDR を送らない

```hcl:line-numbers=33
  cidr_block          = var.use_ipam_pool ? null : var.cidr
```

`use_ipam_pool` が真なら `null` です。AWS は、IPAM のプールから範囲を決めます。偽なら、利用者が書いた `cidr` をそのまま使います。

### 2. プールの ID とネットマスクを送る

```hcl:line-numbers=34
  ipv4_ipam_pool_id   = var.ipv4_ipam_pool_id
  ipv4_netmask_length = var.ipv4_netmask_length
```

IPAM を使うときは、プールの ID と、必要な範囲の大きさ（ネットマスクの長さ）を送ります。両方とも、利用者の値をそのまま渡しています。

### 3. IPv6 も、IPAM の有無で切り替える

```hcl:line-numbers=37
  assign_generated_ipv6_cidr_block     = var.enable_ipv6 && !var.use_ipam_pool ? true : null
```

IPv6 の範囲は、IPAM を使わず、IPv6 を有効にしたときだけ AWS に自動で割り当ててもらいます。IPAM を使うときは `null` にして、IPAM 側の割り当てに任せます。

## ここがすごい
「範囲を書くか、プールから取るか」の二者択一を、1 つのフラグ `use_ipam_pool` で切り替えています。利用者は、フラグを 1 つ決めれば、IPv4 と IPv6 の両方の割り当て方が揃います。

また、IPAM を使うときに送らない項目（CIDR や自動の IPv6）を、同じフラグで `null` にしている点も大切です。送ってしまうと、IPAM の割り当てと衝突してエラーになります。

## まとめ
- 二者択一の割り当ては、1 つのフラグで両方を切り替えると分かりやすくなります。
- IPAM を使うときは、CIDR の代わりにプールの ID とネットマスクを送ります。
- 衝突する項目は、フラグに応じて `null` にすると、エラーを避けられます。
