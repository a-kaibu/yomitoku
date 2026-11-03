---
title: "NAT ゲートウェイを、EIP と公開サブネットに 1 対 1 で対応させる"
description: "terraform-aws-vpc の aws_nat_gateway。element と三項演算子で、単一の NAT かAZ ごとの NAT かを切り替え、EIP と公開サブネットの番号をそろえる書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1228, 1254]
format: 2
function: "resource \"aws_nat_gateway\"（this）"
difficulty: 3
tags: ["ネットワーク", "イディオム"]
---

## ひとことで
`aws_nat_gateway` は、公開サブネットの中に作られる NAT ゲートウェイです。このモジュールでは、EIP の一覧と公開サブネットの一覧を、同じ番号の順番で対応させて、NAT ゲートウェイを作ります。NAT を 1 つにまとめる設定のときは、どの番号も 0 番目を使います。

## コード
```hcl:line-numbers=1228
resource "aws_nat_gateway" "this" {
  count = local.create_vpc && var.enable_nat_gateway ? local.nat_gateway_count : 0

  region = var.region

  allocation_id = element(
    local.nat_gateway_ips,
    var.single_nat_gateway ? 0 : count.index,
  )
  subnet_id = element(
    aws_subnet.public[*].id,
    var.single_nat_gateway ? 0 : count.index,
  )

  tags = merge(
    {
      "Name" = format(
        "${var.name}-%s",
        element(var.azs, var.single_nat_gateway ? 0 : count.index),
      )
    },
    var.tags,
    var.nat_gateway_tags,
  )

  depends_on = [aws_internet_gateway.this]
}
```

## 前提知識
- NAT ゲートウェイ: プライベートなサブネットから外へ出る通信を、公開 IP を使って変換する部品です。公開サブネットに置きます。
- `allocation_id`: NAT ゲートウェイに付ける EIP の ID です。
- `subnet_id`: NAT ゲートウェイを置くサブネットの ID です。
- `element(リスト, 番号)`: 番号で要素を取り出します。
- `count.index`: `count` で作られる今のリソースの番号です。
- `depends_on`: 他のリソースの後に作るための順番指定です。

## 何をしているか
### 1. 使う EIP を選ぶ
```hcl:line-numbers=1233
  allocation_id = element(
    local.nat_gateway_ips,
    var.single_nat_gateway ? 0 : count.index,
  )
```

`element(local.nat_gateway_ips, 単一なら 0、そうでなければ count.index)` は、EIP の一覧から、このゲートウェイが使う IP を取り出します。単一の NAT では、どのゲートウェイも先頭の IP を使います。AZ ごとの NAT では、番号順に 1 つずつ使います。

### 2. 置くサブネットを選ぶ
```hcl:line-numbers=1237
  subnet_id = element(
    aws_subnet.public[*].id,
    var.single_nat_gateway ? 0 : count.index,
  )
```

`subnet_id` も、同じ番号の決め方です。公開サブネットの ID の一覧から、単一なら先頭、そうでなければ番号の位置のものを取ります。EIP とサブネットが同じ番号で対応するので、AZ ごとに 1 つの NAT が、同じ AZ の公開サブネットに置かれます。

### 3. 名前と順番
```hcl:line-numbers=1253
  depends_on = [aws_internet_gateway.this]
```

Name タグは、EIP と同じ考え方で AZ の名前から作ります。`depends_on` によって、インターネットゲートウェイが先に作られます。NAT はインターネットへの出口なので、IGW がないと意味をなさないからです。

## ここがすごい
単一と AZ ごとの切り替えを、`element` の番号を決める三項演算子だけで表しています。リソースの数（`count`）は、別の条件で決まり、ここでは番号の選び方だけが変わります。

また、EIP と公開サブネットを同じ番号で対応させることで、両者の組み合わせを別々に管理しなくて済みます。番号が一致するという約束が、このモジュールの配置の安定性を支えています。

## まとめ
- `element` の番号を三項演算子で変えると、単一と AZ ごとを切り替えられます。
- 複数のリストを同じ番号で対応させると、組み合わせを管理しやすくなります。
- NAT のような出口には、インターネットゲートウェイを先に作る順番が必要です。

