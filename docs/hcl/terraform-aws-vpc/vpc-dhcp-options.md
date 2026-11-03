---
title: "DHCP オプションを、有効化フラグと merge の優先順位で作る"
description: "terraform-aws-vpc の aws_vpc_dhcp_options。有効化の条件で count を決め、タグを 3 つの map から merge で合わせる。後ろの map が優先される仕組みを読む。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [107, 124]
format: 2
function: "resource \"aws_vpc_dhcp_options\"（this）"
difficulty: 2
tags: ["API設計", "データ構造"]
---

## ひとことで
`aws_vpc_dhcp_options` は、VPC の中のインスタンスに配る DNS サーバーなどの設定です。このブロックは、利用者が有効化したときだけ作られます。タグは、モジュールの名前、共通のタグ、DHCP 専用のタグの 3 つを `merge` で合わせています。

## コード
```hcl:line-numbers=107
resource "aws_vpc_dhcp_options" "this" {
  count = local.create_vpc && var.enable_dhcp_options ? 1 : 0

  region = var.region

  domain_name                       = var.dhcp_options_domain_name
  domain_name_servers               = var.dhcp_options_domain_name_servers
  ntp_servers                       = var.dhcp_options_ntp_servers
  netbios_name_servers              = var.dhcp_options_netbios_name_servers
  netbios_node_type                 = var.dhcp_options_netbios_node_type
  ipv6_address_preferred_lease_time = var.dhcp_options_ipv6_address_preferred_lease_time

  tags = merge(
    { "Name" = var.name },
    var.tags,
    var.dhcp_options_tags,
  )
}
```

## 前提知識
- DHCP オプションセット: VPC の中のインスタンスに、DNS サーバーや NTP サーバーなどの設定を配るための設定です。
- `count = 条件 ? 1 : 0`: 条件が真のときだけ 1 個作ります。
- `merge(マップA, マップB, マップC)`: 複数のマップを 1 つにまとめます。同じキーがあれば、後のものの値が使われます。
- `{ "Name" = var.name }`: キーに `Name` を含むマップのリテラルです。キーは文字列として書きます。
- `var.dhcp_options_domain_name_servers`: DNS サーバーの一覧などを、利用者が渡します。

## 何をしているか
### 1. 作る条件を決める
```hcl:line-numbers=108
  count = local.create_vpc && var.enable_dhcp_options ? 1 : 0
```

`local.create_vpc && var.enable_dhcp_options` が真のときだけ、DHCP オプションを 1 件作ります。VPC を作らない場合や、利用者が DHCP の設定を使わない場合は、作られません。

### 2. 配る設定を渡す
```hcl:line-numbers=112
  domain_name                       = var.dhcp_options_domain_name
  domain_name_servers               = var.dhcp_options_domain_name_servers
  ntp_servers                       = var.dhcp_options_ntp_servers
  netbios_name_servers              = var.dhcp_options_netbios_name_servers
  netbios_node_type                 = var.dhcp_options_netbios_node_type
  ipv6_address_preferred_lease_time = var.dhcp_options_ipv6_address_preferred_lease_time
```

ドメイン名、DNS サーバー、NTP サーバー、NetBIOS の設定などは、変数からそのまま渡します。モジュールの中で値を変換していないので、利用者の指定がそのまま AWS に届きます。

### 3. タグを合わせる
```hcl:line-numbers=119
  tags = merge(
    { "Name" = var.name },
    var.tags,
    var.dhcp_options_tags,
  )
```

`merge` の最初は、モジュール名の `Name` タグ、次は共通のタグ、最後は DHCP 専用のタグです。後ろのものほど優先されるので、利用者が `dhcp_options_tags` に `Name` を書けば、既定の名前が上書きされます。

## ここがすごい
タグを 3 つの層に分けて `merge` するため、既定の名前、全体に付けるタグ、個別のタグの優先順位が、並びの順序で決まります。読み手は、後ろほど強い、と覚えるだけで、動きが予想できます。

また、有効化の条件を `count` の 1 か所にまとめているので、設定の値を並べるだけの本体は、単純な形を保っています。

## まとめ
- `merge` の並びの順番で、タグの優先順位を決められます。
- 有効化の条件を `count` に書くと、リソースの本体が単純になります。
- 既定の名前を先頭に置くと、利用者が後から上書きできます。

