---
title: "空のリストでも element が壊れないように、要素を 1 つ足す"
description: "terraform-aws-vpc の aws_subnet。element(concat(リスト, [\"\"]), count.index) で、CIDR が空でも参照エラーにならない書き方と、AZ の名前と ID を正規表現で振り分ける工夫。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [145, 160]
format: 2
function: "resource \"aws_subnet\"（public）"
difficulty: 3
tags: ["防御的プログラミング", "イディオム"]
---

## ひとことで
`aws_subnet` の `public` は、AZ（アベイラビリティゾーン）ごとの公開サブネットを作ります。CIDR の一覧が空でも `element` が参照エラーを起こさないように、一覧に空文字を 1 つ足しておきます。また、AZ の値が名前かそれとも ID かを、正規表現で見分けています。

## コード
```hcl:line-numbers=145
resource "aws_subnet" "public" {
  count = local.create_public_subnets && (!var.one_nat_gateway_per_az || local.len_public_subnets >= length(var.azs)) ? local.len_public_subnets : 0

  region = var.region

  assign_ipv6_address_on_creation                = var.enable_ipv6 && var.public_subnet_ipv6_native ? true : var.public_subnet_assign_ipv6_address_on_creation
  availability_zone                              = length(regexall("^[a-z]+-", element(var.azs, count.index))) > 0 ? element(var.azs, count.index) : null
  availability_zone_id                           = length(regexall("^[a-z]+-", element(var.azs, count.index))) == 0 ? element(var.azs, count.index) : null
  cidr_block                                     = var.public_subnet_ipv6_native ? null : element(concat(var.public_subnets, [""]), count.index)
  enable_dns64                                   = var.enable_ipv6 && (length(var.public_subnet_ipv6_prefixes) > 0 || var.public_subnet_ipv6_native) && var.public_subnet_enable_dns64
  enable_resource_name_dns_aaaa_record_on_launch = var.enable_ipv6 && (length(var.public_subnet_ipv6_prefixes) > 0 || var.public_subnet_ipv6_native) && var.public_subnet_enable_resource_name_dns_aaaa_record_on_launch
  enable_resource_name_dns_a_record_on_launch    = !var.public_subnet_ipv6_native && var.public_subnet_enable_resource_name_dns_a_record_on_launch
  ipv6_cidr_block                                = var.enable_ipv6 && length(var.public_subnet_ipv6_prefixes) > 0 ? cidrsubnet(aws_vpc.this[0].ipv6_cidr_block, 8, var.public_subnet_ipv6_prefixes[count.index]) : null
  ipv6_native                                    = var.enable_ipv6 && var.public_subnet_ipv6_native
  map_public_ip_on_launch                        = var.map_public_ip_on_launch
  private_dns_hostname_type_on_launch            = var.public_subnet_private_dns_hostname_type_on_launch
```

## 前提知識
- `element(リスト, 番号)`: リストの番号（0 から始まる）の要素を返します。番号が範囲外だとエラーになります。
- `concat(リストA, リストB)`: リストを前後につなぎます。
- `count.index`: `count` で作られた今のリソースの番号です。
- `regexall(正規表現, 文字列)`: 正規表現に合った部分のリストを返します。`length(...) > 0` で、合ったかどうかを判定できます。
- `null`: 値がないことを表します。リソースの引数に `null` を渡すと、その引数は省略されます。
- `cidrsubnet(IPv6のCIDR, 8, 番号)`: 大きな IPv6 のブロックを、指定した番号のサブネットに分けます。

## 何をしているか
### 1. AZ が名前か ID かを判定する
```hcl:line-numbers=151
  availability_zone                              = length(regexall("^[a-z]+-", element(var.azs, count.index))) > 0 ? element(var.azs, count.index) : null
  availability_zone_id                           = length(regexall("^[a-z]+-", element(var.azs, count.index))) == 0 ? element(var.azs, count.index) : null
```

AZ の名前（例: `ap-northeast-1a`）は `^[a-z]+-` に合うので、`regexall` の結果が空でなければ `availability_zone` に入れます。合わなければ、値は `availability_zone_id`（例: `apne1-az4`）として扱います。利用者は、どちらの形で書いても同じ変数で指定できます。

### 2. 空の CIDR でも element を壊さない
```hcl:line-numbers=153
  cidr_block                                     = var.public_subnet_ipv6_native ? null : element(concat(var.public_subnets, [""]), count.index)
```

`element(concat(var.public_subnets, [""]), count.index)` は、利用者が CIDR を 1 つも渡していなくても、要素が 1 つある一覧（空文字）を作ります。`element` は範囲外の番号でエラーになるので、この 1 要素の余裕で「番号が範囲内」であることを保ちます。ただし `public_subnet_ipv6_native` が真のときは、`null` を使って CIDR を省略します。

## ここがすごい
AZ の名前と ID を、利用者が区別して書く必要がないように、モジュールが正規表現で判定しているのが工夫です。利用者は、AZ を指定する値の形式を覚えなくて済みます。

`concat` で空文字を足す書き方は、一見すると奇妙に見えます。しかし、一覧の長さが足りないときの `element` の失敗を、この 1 行で防いでいるので、読み手にとっては「なぜこの空文字があるのか」を考える価値のある箇所です。

## まとめ
- `regexall` の結果の有無で、文字列の種類を振り分けられます。
- `element` の失敗を防ぐには、一覧の末尾に既定の値を足す方法があります。
- 条件を満たさないときに `null` を使うと、引数を省略したのと同じ効果が得られます。

