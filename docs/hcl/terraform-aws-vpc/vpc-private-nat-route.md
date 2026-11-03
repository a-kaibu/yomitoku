---
title: "プライベートサブネットの経路を、NAT ゲートウェイへ向ける"
description: "terraform-aws-vpc の aws_route。プライベートのルートテーブルの番号と NAT ゲートウェイの番号を element で対応させ、宛先の経路を NAT ゲートウェイに向ける書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1256, 1268]
format: 2
function: "resource \"aws_route\"（private_nat_gateway）"
difficulty: 2
tags: ["ネットワーク", "イディオム"]
---

## ひとことで
`aws_route` は、ルートテーブルに 1 本の経路を追加します。このブロックは、プライベートなサブネットのルートテーブルに、宛先を NAT ゲートウェイへ向ける経路を作ります。宛先は変数で決まり、既定は `0.0.0.0/0`、つまりすべての IPv4 の通信です。ルートテーブルと NAT ゲートウェイの数が同じときに、番号で 1 対 1 に結びつけます。

## コード
```hcl:line-numbers=1256
resource "aws_route" "private_nat_gateway" {
  count = local.create_vpc && var.enable_nat_gateway && var.create_private_nat_gateway_route ? local.nat_gateway_count : 0

  region = var.region

  route_table_id         = element(aws_route_table.private[*].id, count.index)
  destination_cidr_block = var.nat_gateway_destination_cidr_block
  nat_gateway_id         = element(aws_nat_gateway.this[*].id, count.index)

  timeouts {
    create = "5m"
  }
}
```

## 前提知識
- ルートテーブル: サブネットの通信の行き先を決める表です。経路（route）の並びで書かれます。
- `aws_route`: ルートテーブルに 1 本の経路を追加するリソースです。
- `destination_cidr_block`: 経路の宛先の範囲です。`0.0.0.0/0` のような書き方で、すべての IPv4 アドレスを表します。
- `nat_gateway_id`: 経路の次の行き先となる NAT ゲートウェイの ID です。
- `timeouts`: リソースの作成や削除の制限時間です。ここでは作成の時間を 5 分に指定しています。

## 何をしているか
### 1. 作る条件を決める
```hcl:line-numbers=1257
  count = local.create_vpc && var.enable_nat_gateway && var.create_private_nat_gateway_route ? local.nat_gateway_count : 0
```

`local.create_vpc && var.enable_nat_gateway && var.create_private_nat_gateway_route` の 3 つが真のときだけ、経路を作ります。NAT を作る設定でも、経路だけは作らない、という選択を利用者ができるようにしています。

### 2. ルートテーブルと NAT ゲートウェイを番号で結ぶ
```hcl:line-numbers=1261
  route_table_id         = element(aws_route_table.private[*].id, count.index)
  destination_cidr_block = var.nat_gateway_destination_cidr_block
  nat_gateway_id         = element(aws_nat_gateway.this[*].id, count.index)
```

`element(aws_route_table.private[*].id, count.index)` で、今の番号のプライベートなルートテーブルを選びます。同じ番号の NAT ゲートウェイを `element(aws_nat_gateway.this[*].id, count.index)` で選び、経路の行き先にします。番号が同じなので、AZ ごとの組み合わせになります。

### 3. 作成の時間を指定する
```hcl:line-numbers=1265
  timeouts {
    create = "5m"
  }
```

`timeouts` の `create = "5m"` は、経路の作成に 5 分まで待つことを表します。NAT ゲートウェイの準備が終わるまで待つ場合があるため、既定より長めに指定しています。

## ここがすごい
ルートテーブルと NAT ゲートウェイを、同じ番号で結ぶことで、経路の対応関係が式の形から読み取れます。AZ ごとの 1 対 1 の対応を、特別な分岐なしに表せています。

また、経路を作るかどうかの判定を、NAT の作成とは別の変数で持っています。利用者は NAT を作りながら、経路は自分で管理する、といった柔軟な構成もできます。

## まとめ
- `element` で番号を揃えると、ルートテーブルと NAT の対応を表せます。
- 経路の作成条件を NAT の作成と分けると、構成の自由度が上がります。
- `timeouts` は、時間のかかる作成で必要な場合に指定します。

