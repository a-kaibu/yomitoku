---
title: "経路の行き先を、項目ごとの lookup で 1 つだけ選ぶ"
description: "terraform-aws-vpc の既定のルートテーブル。経路の宛先と行き先を、項目ごとに lookup で取り出し、書かれていない行き先は null にして、AWS の 1 つだけという制約に合わせる書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1514, 1530]
format: 2
function: "resource \"aws_default_route_table\"（dynamic \"route\"）"
difficulty: 3
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
既定のルートテーブルに、利用者が指定した経路を追加する `dynamic` ブロックです。経路には、宛先（CIDR）と、行き先（ゲートウェイや NAT など）が必要です。行き先は 8 種類のどれか 1 つだけを指定する決まりなので、このブロックは、すべての行き先を `lookup` で取り出し、書かれていないものを `null` にします。

## コード
::: code-group

```hcl:line-numbers=1514 [日本語訳]
  dynamic "route" {
    for_each = var.default_route_table_routes
    content {
      # 次のどれか 1 つの宛先を必ず指定する
      cidr_block      = route.value.cidr_block
      ipv6_cidr_block = lookup(route.value, "ipv6_cidr_block", null)

      # 次のどれか 1 つの行き先を必ず指定する
      egress_only_gateway_id    = lookup(route.value, "egress_only_gateway_id", null)
      gateway_id                = lookup(route.value, "gateway_id", null)
      instance_id               = lookup(route.value, "instance_id", null)
      nat_gateway_id            = lookup(route.value, "nat_gateway_id", null)
      network_interface_id      = lookup(route.value, "network_interface_id", null)
      transit_gateway_id        = lookup(route.value, "transit_gateway_id", null)
      vpc_endpoint_id           = lookup(route.value, "vpc_endpoint_id", null)
      vpc_peering_connection_id = lookup(route.value, "vpc_peering_connection_id", null)
    }
```

```hcl:line-numbers=1514 [原文]
  dynamic "route" {
    for_each = var.default_route_table_routes
    content {
      # One of the following destinations must be provided
      cidr_block      = route.value.cidr_block
      ipv6_cidr_block = lookup(route.value, "ipv6_cidr_block", null)

      # One of the following targets must be provided
      egress_only_gateway_id    = lookup(route.value, "egress_only_gateway_id", null)
      gateway_id                = lookup(route.value, "gateway_id", null)
      instance_id               = lookup(route.value, "instance_id", null)
      nat_gateway_id            = lookup(route.value, "nat_gateway_id", null)
      network_interface_id      = lookup(route.value, "network_interface_id", null)
      transit_gateway_id        = lookup(route.value, "transit_gateway_id", null)
      vpc_endpoint_id           = lookup(route.value, "vpc_endpoint_id", null)
      vpc_peering_connection_id = lookup(route.value, "vpc_peering_connection_id", null)
    }
```

:::

## 前提知識
- ルートテーブルの経路（route）: 宛先の範囲に対して、通信を送る次の行き先を決めます。
- 宛先と行き先: 宛先は `cidr_block` や `ipv6_cidr_block`、行き先は `gateway_id`、`nat_gateway_id` などです。
- `dynamic "route"`: 経路の数だけ、ブロックを作ります。
- `lookup(route.value, "項目", null)`: 経路の中に項目があればその値を、無ければ `null` を返します。
- `null` の引数: AWS のリソースに渡されず、省略したのと同じ扱いになります。

## 何をしているか
### 1. 宛先を決める
```hcl:line-numbers=1518
      cidr_block      = route.value.cidr_block
      ipv6_cidr_block = lookup(route.value, "ipv6_cidr_block", null)
```

`cidr_block` は、経路の IPv4 の宛先です。必ず書く必要がある項目なので、`route.value.cidr_block` で直接取り出します。`ipv6_cidr_block` は、書かれていなければ `null` で、IPv4 だけの経路になります。

### 2. 行き先を 1 つだけ選ぶ
```hcl:line-numbers=1522
      egress_only_gateway_id    = lookup(route.value, "egress_only_gateway_id", null)
      gateway_id                = lookup(route.value, "gateway_id", null)
      instance_id               = lookup(route.value, "instance_id", null)
      nat_gateway_id            = lookup(route.value, "nat_gateway_id", null)
      network_interface_id      = lookup(route.value, "network_interface_id", null)
      transit_gateway_id        = lookup(route.value, "transit_gateway_id", null)
      vpc_endpoint_id           = lookup(route.value, "vpc_endpoint_id", null)
      vpc_peering_connection_id = lookup(route.value, "vpc_peering_connection_id", null)
```

`egress_only_gateway_id` から `vpc_peering_connection_id` まで、8 種類の行き先を、すべて `lookup` で取り出します。利用者が書いたものだけが値を持ち、残りは `null` になります。AWS は行き先を 1 つだけ受け付けるので、`null` の項目は省略されて、結果的に 1 つだけが残ります。

## ここがすごい
行き先を「全部並べて、無いものは null」にする書き方によって、利用者は書きたい行き先だけを 1 つ書けばよくなります。種類ごとに `dynamic` を作ると、ブロックが 8 つに増えてしまいますが、この書き方なら 1 つのブロックに収まります。

また、コメントにあるように「どれか 1 つを必ず指定する」という約束は、Terraform の型では表せません。この式は、その約束を利用者への説明として書き、実際の制御は AWS の側の検証に任せています。

## まとめ
- `lookup(..., null)` を並べると、任意の項目を 1 つのブロックで扱えます。
- `null` の引数は省略と同じなので、必要な 1 つだけが AWS に届きます。
- 型で表せない約束は、コメントで読み手に明示すると分かりやすくなります。
