---
title: "VPN ゲートウェイの ID を、2 種類のリソースから concat で拾う"
description: "terraform-aws-vpc の aws_vpn_gateway_route_propagation。新しく作った VPN ゲートウェイと既存のアタッチメントのどちらからも ID を取り、番号で 1 つ選ぶ concat と element の書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1339, 1352]
format: 2
function: "resource \"aws_vpn_gateway_route_propagation\"（public）"
difficulty: 2
tags: ["ネットワーク", "イディオム"]
---

## ひとことで
VPN ゲートウェイからの経路を、ルートテーブルへ自動で伝えるための設定です。このブロックは、VPN ゲートウェイの ID を、モジュールで作ったものと、既存のものを接続した（アタッチメントの）ものの両方から拾います。`concat` でつないで、番号で 1 つ選ぶ書き方です。

## コード
```hcl:line-numbers=1339
resource "aws_vpn_gateway_route_propagation" "public" {
  count = local.create_vpc && var.propagate_public_route_tables_vgw && (var.enable_vpn_gateway || var.vpn_gateway_id != "") ? 1 : 0

  region = var.region

  route_table_id = element(aws_route_table.public[*].id, count.index)
  vpn_gateway_id = element(
    concat(
      aws_vpn_gateway.this[*].id,
      aws_vpn_gateway_attachment.this[*].vpn_gateway_id,
    ),
    count.index,
  )
}
```

## 前提知識
- VPN ゲートウェイ: VPC と社内ネットワークを、VPN の接続で結ぶための部品です。
- VPN ゲートウェイのアタッチメント: VPN ゲートウェイを VPC に結びつける関係のリソースです。
- ルート伝播（route propagation）: VPN ゲートウェイから学んだ経路を、ルートテーブルへ自動で載せる設定です。
- `concat(リストA, リストB)`: リストを前後につなぎます。
- `element(リスト, 番号)`: 番号で要素を取り出します。

## 何をしているか
### 1. 作る条件を決める
```hcl:line-numbers=1340
  count = local.create_vpc && var.propagate_public_route_tables_vgw && (var.enable_vpn_gateway || var.vpn_gateway_id != "") ? 1 : 0
```

`propagate_public_route_tables_vgw` が真で、VPN ゲートウェイを作るか既存の ID があるときだけ、この伝播を作ります。VPN を使わない構成では、作られません。

### 2. ルートテーブルを番号で選ぶ
```hcl:line-numbers=1344
  route_table_id = element(aws_route_table.public[*].id, count.index)
```

`element(aws_route_table.public[*].id, count.index)` は、公開のルートテーブルの一覧から、今の番号のものを選びます。

### 3. VPN ゲートウェイの ID を拾う
```hcl:line-numbers=1345
  vpn_gateway_id = element(
    concat(
      aws_vpn_gateway.this[*].id,
      aws_vpn_gateway_attachment.this[*].vpn_gateway_id,
    ),
    count.index,
  )
```

`concat(aws_vpn_gateway.this[*].id, aws_vpn_gateway_attachment.this[*].vpn_gateway_id)` は、新しく作った VPN ゲートウェイの ID と、アタッチメントが持つ VPN ゲートウェイの ID を 1 つのリストにつなぎます。どちらか一方だけが存在するので、空のほうは何も足しません。そのうえで、`element` で `count.index` 番目を取り出します。

## ここがすごい
同じ VPN ゲートウェイの ID が、作られ方によって違うリソースに入っています。`concat` でつなぐと、「どちらから来たか」を気にせず、ID の一覧として扱えます。出どころの違いを、1 行の式で吸収しています。

また、`count` の条件で、VPN を使わないときは伝播そのものを作らないので、中身の `element` が空の一覧を参照することもありません。条件と参照が、同じ前提でそろっています。

## まとめ
- `concat` で、出どころの違う ID の一覧を 1 つにできます。
- `element` と `count.index` を組み合わせると、ルートテーブルと ID を 1 対 1 で結べます。
- 作る条件を前提にそろえると、空の参照を避けられます。

