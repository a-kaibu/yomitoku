---
title: "顧客ゲートウェイの省略できる項目を、lookup で読む"
description: "terraform-aws-vpc の顧客ゲートウェイ。BGP の AS 番号などは lookup で既定の null を返すようにして、必須の ip_address だけを直接読む。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1288, 1297]
format: 2
function: "resource \"aws_customer_gateway\"（this）"
difficulty: 2
tags: ["ネットワーク", "API設計"]
---

## ひとことで
顧客ゲートウェイは、AWS の外側にある自社の VPN 機器を表す設定です。VPC と VPN でつなぐには、機器の IP アドレスが必須ですが、BGP の AS 番号などは省略できます。このコードは、必須の値は直接読み、省略できる値は `lookup` で既定の `null` を返すようにしています。

## コード
```hcl:line-numbers=1288
resource "aws_customer_gateway" "this" {
  for_each = var.customer_gateways

  region = var.region

  bgp_asn          = lookup(each.value, "bgp_asn", null)
  bgp_asn_extended = lookup(each.value, "bgp_asn_extended", null)
  ip_address       = each.value["ip_address"]
  device_name      = lookup(each.value, "device_name", null)
  type             = "ipsec.1"
```

## 前提知識
- 顧客ゲートウェイ（Customer Gateway）: 自社側の VPN 機器を、AWS に登録するための設定です。
- BGP: ルーター同士が経路を交換するためのプロトコルです。AS 番号は、組織ごとの識別番号です。
- `ipsec.1`: IPsec を使った VPN の種類を表す値です。
- `lookup(マップ, キー, 既定値)`: キーがあれば値を、無ければ既定値を返します。
- `each.value["ip_address"]`: マップの項目を、キーの文字列で直接読む書き方です。必須の項目では、無ければエラーになります。

## 何をしているか
### 1. 省略できる値は lookup で読む

```hcl:line-numbers=1293
  bgp_asn          = lookup(each.value, "bgp_asn", null)
  bgp_asn_extended = lookup(each.value, "bgp_asn_extended", null)
```

BGP の AS 番号は、書いていなければ `null` になります。`null` は「送らない」という意味なので、BGP を使わない VPN でも、設定を書かずに済みます。

### 2. 必須の値は、直接読む

```hcl:line-numbers=1295
  ip_address       = each.value["ip_address"]
```

IP アドレスは、VPN のために必ず必要な値です。`lookup` を使わず、直接キーで読みます。書いていなければ、Terraform がエラーを出すので、設定の書き忘れに気づけます。

### 3. 種類は固定し、名前はキーから作る

```hcl:line-numbers=1297
  type             = "ipsec.1"
```

このモジュールが扱う VPN は、IPsec だけなので、種類は `ipsec.1` に固定しています。利用者が種類を選ぶ必要はありません。

## ここがすごい
必須の値と省略できる値を、読み方で分けています。必須は直接読んでエラーで気づかせ、省略できる値は `lookup` で既定を返す。書き方を見るだけで、どの項目が必要なのかが分かります。

さらに、種類を `ipsec.1` に固定することで、利用者が間違った種類を書くことを防いでいます。選択肢が 1 つしかないなら、入力にしないのが、設計として素直です。

## まとめ
- 必須の値は直接読み、省略できる値は `lookup` で既定を返すと、役割が分かれます。
- 選択肢が 1 つしかない項目は、入力にせず固定すると、ミスを減らせます。
- `null` を既定にすると、省略した項目は AWS の既定の動きに任せられます。
