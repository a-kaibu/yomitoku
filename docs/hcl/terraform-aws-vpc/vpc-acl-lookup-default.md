---
title: "lookup の既定値 null で、ACL ルールの任意項目を省略する"
description: "terraform-aws-vpc の network ACL ルール。lookup(マップ, キー, null) で、利用者が書かなかった項目を null にして、リソースの引数を省略できるようにする書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [247, 264]
format: 2
function: "resource \"aws_network_acl_rule\"（public_inbound）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
この部分は、公開サブネットのネットワーク ACL（アクセス制御のルール）を 1 件ずつ作ります。ポート番号や ICMP の値など、利用者が省略できる項目は `lookup` で取り出し、無いときは `null` にします。項目の一部だけを書けば、ほかは既定の動きに任せられます。

## コード
```hcl:line-numbers=247
resource "aws_network_acl_rule" "public_inbound" {
  count = local.create_public_subnets && var.public_dedicated_network_acl ? length(var.public_inbound_acl_rules) : 0

  region = var.region

  network_acl_id = aws_network_acl.public[0].id

  egress          = false
  rule_number     = var.public_inbound_acl_rules[count.index]["rule_number"]
  rule_action     = var.public_inbound_acl_rules[count.index]["rule_action"]
  from_port       = lookup(var.public_inbound_acl_rules[count.index], "from_port", null)
  to_port         = lookup(var.public_inbound_acl_rules[count.index], "to_port", null)
  icmp_code       = lookup(var.public_inbound_acl_rules[count.index], "icmp_code", null)
  icmp_type       = lookup(var.public_inbound_acl_rules[count.index], "icmp_type", null)
  protocol        = var.public_inbound_acl_rules[count.index]["protocol"]
  cidr_block      = lookup(var.public_inbound_acl_rules[count.index], "cidr_block", null)
  ipv6_cidr_block = lookup(var.public_inbound_acl_rules[count.index], "ipv6_cidr_block", null)
}
```

## 前提知識
- ネットワーク ACL: サブネットの出入りを許可・拒否するルールです。番号（`rule_number`）の小さいものから順に判断されます。
- `count.index`: 今のルールの番号です。`var.public_inbound_acl_rules` の中の、その番号の要素を取り出します。
- `lookup(マップ, キー, 既定値)`: マップにキーがあればその値を、無ければ既定値を返します。
- `var.xxx[count.index]["項目"]`: リストの要素の中のマップの項目を、角括弧で直接取り出します。
- `null`: 値がないことを表します。リソースの引数に `null` を渡すと、その引数は省略されます。
- `protocol`: 通信の種類（TCP、UDP、ICMP など）を表します。

## 何をしているか
### 1. 必須の項目は直接取り出す
```hcl:line-numbers=255
  rule_number     = var.public_inbound_acl_rules[count.index]["rule_number"]
  rule_action     = var.public_inbound_acl_rules[count.index]["rule_action"]
```

`rule_number` と `rule_action`、そして `protocol` は、必ず書く項目なので `["項目"]` で直接取り出します。もし利用者が書き忘れていれば、Terraform はエラーにします。必須と任意を、取り出し方で区別しているのが読み取りのポイントです。

### 2. 任意の項目は lookup で取り出す
```hcl:line-numbers=257
  from_port       = lookup(var.public_inbound_acl_rules[count.index], "from_port", null)
  to_port         = lookup(var.public_inbound_acl_rules[count.index], "to_port", null)
```

`from_port` や `to_port` は、ICMP のルールでは使われないことがあります。そこで `lookup(..., "from_port", null)` で、キーがなければ `null` を入れます。`null` が入った引数は、AWS のリソースに送られず、省略したのと同じ扱いになります。

### 3. 送信元の指定も同じ形で
```hcl:line-numbers=262
  cidr_block      = lookup(var.public_inbound_acl_rules[count.index], "cidr_block", null)
  ipv6_cidr_block = lookup(var.public_inbound_acl_rules[count.index], "ipv6_cidr_block", null)
```

`cidr_block` と `ipv6_cidr_block` も同じ書き方です。IPv4 か IPv6 のどちらかだけを書いても、他方は `null` になります。ルールごとに、書きたい項目だけを書くことができます。

## ここがすごい
1 つのリソースの中で、必須の項目と任意の項目を、取り出し方の違いだけで区別しています。読み手は `[...]` と `lookup` の違いを見れば、どの項目を書かなければならないかが分かります。

また、`lookup` の既定値を `null` にすると、リソースの引数の多くが「書いていない」状態になり、AWS の既定の動きが使われます。利用者は ICMP のルールに `from_port` を書かなくても、そのままエラーにならずに済みます。

## まとめ
- 必須の項目は `["項目"]`、任意の項目は `lookup(..., null)` で取り出すと、区別が明確になります。
- `null` の引数は、省略したのと同じ扱いになります。
- 1 つのリソースの中で、取り出し方を統一すると読みやすくなります。

