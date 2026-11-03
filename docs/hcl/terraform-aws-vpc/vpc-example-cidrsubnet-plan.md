---
title: "cidrsubnet で、サブネットの範囲を番号で切り分ける"
description: "terraform-aws-vpc の complete 例。1 つの VPC の CIDR を cidrsubnet で 8 ビット分割し、用途ごとに番号をずらして、サブネット同士が重ならない配置を作る。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: examples/complete/main.tf
lines: [31, 37]
format: 2
function: "module \"vpc\"（private_subnets・public_subnets など）"
difficulty: 2
tags: ["ネットワーク", "数値計算"]
---

## ひとことで
VPC の大きな IP アドレスの範囲（CIDR）から、サブネットを切り出すとき、`cidrsubnet` 関数を使うと、番号を指定して小さな範囲を取り出せます。この例では、用途ごとに番号の開始位置をずらして、プライベート・パブリック・データベースなどのサブネットが重ならないように配置しています。

## コード
```hcl:line-numbers=31
  azs                 = local.azs
  private_subnets     = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k)]
  public_subnets      = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 4)]
  database_subnets    = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 8)]
  elasticache_subnets = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 12)]
  redshift_subnets    = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 16)]
  intra_subnets       = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 20)]
```

## 前提知識
- CIDR: IP アドレスの範囲を `10.0.0.0/16` のように書く表記です。`/16` の部分が、先頭から固定する bit の数を表します。
- `cidrsubnet(親の CIDR, 追加する bit 数, 番号)`: 親の範囲を、追加した bit 数の分だけ細かく分け、指定した番号の範囲を返す関数です。`/16` に `8` を足すと `/24` になり、番号は 0 から 255 まで使えます。
- `for k, v in リスト : 式`: リストの各要素について式を作り、リストにします。ここでは `k` が番号、`v` が AZ です。
- `local.azs`: AZ（アベイラビリティゾーン）の一覧です。ここでは 3 つだけを使います。
- `k + 4` のような式: 番号の開始位置をずらす書き方です。

## 何をしているか
### 1. プライベートサブネットの範囲を作る
```hcl:line-numbers=32
  private_subnets     = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k)]
```

`cidrsubnet(local.vpc_cidr, 8, k)` は、`10.0.0.0/16` を `/24` に分けた中から、番号 `k` の範囲を取り出します。AZ が 3 つなら、`k` は 0、1、2 となり、3 つのサブネットが作られます。

### 2. 用途ごとに番号をずらす
```hcl:line-numbers=33
  public_subnets      = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 4)]
  database_subnets    = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 8)]
  elasticache_subnets = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 12)]
  redshift_subnets    = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 16)]
  intra_subnets       = [for k, v in local.azs : cidrsubnet(local.vpc_cidr, 8, k + 20)]
```

パブリックは `k + 4`、データベースは `k + 8` というように、番号の開始位置を用途ごとにずらしています。こうすると、同じ `k` を使っても、それぞれの範囲は重なりません。`k + 4` が 4 から 6、`k + 8` が 8 から 10 というように、番号の帯を分けています。

## ここがすごい
サブネットの CIDR を手で書くと、AZ を増やしたときに、重なりや書き忘れが起きやすくなります。この例は、`for` 式と `cidrsubnet` を組み合わせて、AZ の数に合わせて範囲を自動で作ります。

また、用途ごとの番号の帯を分けているので、読み手は「番号が 4 から 7 はパブリック」のように、帯の意味を理解できます。将来サブネットの種類を増やすなら、次の空いた帯を使えばよいという考え方です。

## まとめ
- `cidrsubnet` は、親の範囲から番号指定で子の範囲を作る関数です。
- `for` 式と組み合わせると、AZ の数に応じたサブネットを自動で作れます。
- 用途ごとに番号の帯を分けると、範囲の重なりを避けやすくなります。

