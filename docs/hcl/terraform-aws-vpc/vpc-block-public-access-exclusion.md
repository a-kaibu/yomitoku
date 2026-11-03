---
title: "除外するサブネットを、種類の map と index で引く"
description: "terraform-aws-vpc の aws_vpc_block_public_access_exclusion。サブネットの種類ごとの ID の一覧を lookup に並べ、種類と番号で 1 つのサブネットを取り出す書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [74, 101]
format: 2
function: "resource \"aws_vpc_block_public_access_exclusion\"（this）"
difficulty: 3
tags: ["データ構造", "防御的プログラミング"]
---

## ひとことで
VPC の公開アクセスのブロックから、特定のサブネットを除外する設定です。除外するサブネットは、利用者が「種類（private や public など）」と「番号」で指定します。このブロックは、その指定から、実際のサブネットの ID を取り出します。

## コード
```hcl:line-numbers=74
resource "aws_vpc_block_public_access_exclusion" "this" {
  for_each = { for k, v in var.vpc_block_public_access_exclusions : k => v if local.create_vpc }

  region = var.region

  vpc_id = try(each.value.exclude_vpc, false) ? local.vpc_id : null

  subnet_id = try(each.value.exclude_subnet, false) ? lookup(
    {
      private     = aws_subnet.private[*].id,
      public      = aws_subnet.public[*].id,
      database    = aws_subnet.database[*].id,
      redshift    = aws_subnet.redshift[*].id,
      elasticache = aws_subnet.elasticache[*].id,
      intra       = aws_subnet.intra[*].id,
      outpost     = aws_subnet.outpost[*].id
    },
    each.value.subnet_type,
    null
  )[each.value.subnet_index] : null

  internet_gateway_exclusion_mode = each.value.internet_gateway_exclusion_mode

  tags = merge(
    var.tags,
    try(each.value.tags, {}),
  )
}
```

## 前提知識
- 公開アクセスのブロック（Block Public Access）: VPC の中で、インターネットゲートウェイ経由の公開アクセスを止める機能です。除外を使うと、特定のサブネットだけ許せます。
- `for_each` と除外: `for_each` で、除外の設定ごとに 1 件作ります。
- `lookup(マップ, キー, 既定値)`: マップからキーの値を取り出します。キーが無ければ既定値を返します。
- `マップ(...)[番号]`: 取り出したリストを、番号で 1 つ選ぶ書き方です。
- `try(each.value.exclude_subnet, false)`: 項目が無いときに `false` として扱う書き方です。

## 何をしているか
### 1. VPC を除外するかを決める
```hcl:line-numbers=79
  vpc_id = try(each.value.exclude_vpc, false) ? local.vpc_id : null
```

`try(each.value.exclude_vpc, false) ? local.vpc_id : null` は、VPC 全体を除外するなら VPC の ID を、そうでなければ `null` を渡します。項目が無いときは、除外しない扱いになります。

### 2. 種類からサブネットの一覧を選ぶ
```hcl:line-numbers=81
  subnet_id = try(each.value.exclude_subnet, false) ? lookup(
    {
      private     = aws_subnet.private[*].id,
      public      = aws_subnet.public[*].id,
      database    = aws_subnet.database[*].id,
      redshift    = aws_subnet.redshift[*].id,
      elasticache = aws_subnet.elasticache[*].id,
      intra       = aws_subnet.intra[*].id,
      outpost     = aws_subnet.outpost[*].id
    },
```

`lookup({ private = ..., public = ..., ... }, each.value.subnet_type, null)` は、種類の名前から、そのサブネット ID の一覧を取り出します。種類が見つからなければ `null` です。マップのリテラルの中身は、各種類のサブネットを `[*].id` で集めた一覧です。

### 3. 番号で 1 つを選ぶ
```hcl:line-numbers=91
    each.value.subnet_type,
    null
  )[each.value.subnet_index] : null
```

`lookup(...)[each.value.subnet_index]` は、一覧から番号で 1 つのサブネットを選びます。サブネットを除外しない設定のときは、三項演算子によって `null` になります。

## ここがすごい
種類ごとのサブネットを 1 つのマップに並べておくと、利用者は「種類」と「番号」だけで、どのサブネットかを指定できます。ID を直接書く必要がなく、AZ の追加にも自然に追従します。

ただし、番号が一覧の長さを超えると、取り出しでエラーになります。このモジュールは、利用者の番号の正しさに依存している部分でもあるので、読み手は一覧の長さを意識しておく必要があります。

## まとめ
- `lookup` と `[番号]` を組み合わせると、種類と番号で値を選べます。
- マップの中に種類ごとの一覧を並べると、読みやすい設定になります。
- 番号の範囲は、利用者の入力の正しさに依存するので、注意が必要です。
