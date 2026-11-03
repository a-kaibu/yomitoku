---
title: "NAT ゲートウェイ用の EIP を、条件と個数で作る"
description: "terraform-aws-vpc の aws_eip。NAT ゲートウェイの数と既存 IP の再利用フラグで個数を決め、Name タグに AZ の名前を element で付ける書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1207, 1226]
format: 2
function: "resource \"aws_eip\"（nat）"
difficulty: 2
tags: ["ネットワーク", "文字列処理"]
---

## ひとことで
NAT ゲートウェイは、プライベートなサブネットからインターネットへ出るための部品で、固定の公開 IP（Elastic IP）を使います。このリソースは、その IP を NAT ゲートウェイの数だけ作ります。既存の IP を使い回す設定のときは、作りません。

## コード
```hcl:line-numbers=1207
resource "aws_eip" "nat" {
  count = local.create_vpc && var.enable_nat_gateway && !var.reuse_nat_ips ? local.nat_gateway_count : 0

  region = var.region

  domain = "vpc"

  tags = merge(
    {
      "Name" = format(
        "${var.name}-%s",
        element(var.azs, var.single_nat_gateway ? 0 : count.index),
      )
    },
    var.tags,
    var.nat_eip_tags,
  )

  depends_on = [aws_internet_gateway.this]
}
```

## 前提知識
- EIP（Elastic IP）: AWS が用意する固定の公開 IP アドレスです。VPC の中で使うときは、`domain = "vpc"` を指定します。
- NAT ゲートウェイ: プライベートなサブネットの機器が、外へ通信するための変換をする部品です。固定の IP を 1 つ付けて使います。
- `count = 条件 ? 数 : 0`: 条件が真のときだけ、指定された数のリソースを作ります。
- `element(リスト, 番号)`: 番号で要素を取り出します。
- `format("${var.name}-%s", 値)`: `%s` の部分に値を入れて、文字列を作ります。
- `depends_on`: 他のリソースの作成が終わってから作る、と順番を明示する引数です。

## 何をしているか
### 1. 作る個数を決める
```hcl:line-numbers=1208
  count = local.create_vpc && var.enable_nat_gateway && !var.reuse_nat_ips ? local.nat_gateway_count : 0
```

`local.create_vpc && var.enable_nat_gateway && !var.reuse_nat_ips` が真のときだけ、`local.nat_gateway_count` の数だけ EIP を作ります。`reuse_nat_ips` が真なら、利用者が既存の IP を渡すので、このリソースは作られません。

### 2. Name タグに AZ の名前を入れる
```hcl:line-numbers=1214
  tags = merge(
    {
      "Name" = format(
        "${var.name}-%s",
        element(var.azs, var.single_nat_gateway ? 0 : count.index),
      )
    },
    var.tags,
    var.nat_eip_tags,
  )
```

`element(var.azs, var.single_nat_gateway ? 0 : count.index)` は、AZ の一覧から、対応する AZ の名前を取り出します。NAT ゲートウェイを 1 つにまとめる設定（`single_nat_gateway`）のときは、常に先頭の AZ の名前を使います。`format` で、`${var.name}-` の後ろに AZ の名前をつなぎます。

### 3. 順番を決める
```hcl:line-numbers=1225
  depends_on = [aws_internet_gateway.this]
```

`depends_on = [aws_internet_gateway.this]` によって、インターネットゲートウェイが先に作られてから、EIP が作られます。EIP を VPC に付けるには、インターネットゲートウェイが必要だからです。

## ここがすごい
個数の決め方と、Name タグの付け方が、どちらも「単一の NAT か、AZ ごとか」の同じ判断に従っています。`single_nat_gateway` の 1 つの変数が、個数と名前の両方に効くので、読み手は一貫した動きを追えます。

また、`tags` の `merge` によって、モジュールが付ける Name を先頭に置き、利用者のタグを後ろから足しています。後ろのものが優先されるので、利用者が `Name` を指定すれば、その値で上書きできます。

## まとめ
- `count` の条件に複数の変数を組み合わせると、作る数を正確に決められます。
- `element` と三項演算子で、単一の構成と AZ ごとの構成を 1 行で切り替えられます。
- `depends_on` で、依存する部品の作成順を明示できます。

