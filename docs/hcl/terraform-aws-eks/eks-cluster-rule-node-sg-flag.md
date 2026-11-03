---
title: "ノードのセキュリティグループを、フラグで通信の参照先にする"
description: "terraform-aws-eks のクラスター用ルール。source_node_security_group が真ならノードのグループを参照先にし、そうでなければ利用者の指定を使う。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [479, 498]
format: 2
function: "resource \"aws_security_group_rule\"（cluster）"
difficulty: 3
tags: ["ネットワーク", "API設計"]
---

## ひとことで
EKS のクラスターのセキュリティグループには、通信を許すルールを追加できます。そのルールの送信元は、CIDR（IP の範囲）か、別のセキュリティグループのどちらかです。このモジュールでは、「ノードのセキュリティグループから来る通信を許す」という、よく使う指定をフラグで書けるようにしています。

## コード
```hcl:line-numbers=479
resource "aws_security_group_rule" "cluster" {
  for_each = { for k, v in merge(
    local.cluster_security_group_rules,
    var.security_group_additional_rules
  ) : k => v if local.create_security_group }

  region = var.region

  security_group_id        = aws_security_group.cluster[0].id
  protocol                 = each.value.protocol
  from_port                = each.value.from_port
  to_port                  = each.value.to_port
  type                     = each.value.type
  description              = try(each.value.description, null)
  cidr_blocks              = try(each.value.cidr_blocks, null)
  ipv6_cidr_blocks         = try(each.value.ipv6_cidr_blocks, null)
  prefix_list_ids          = try(each.value.prefix_list_ids, null)
  self                     = try(each.value.self, null)
  source_security_group_id = try(each.value.source_node_security_group, false) ? local.node_security_group_id : try(each.value.source_security_group_id, null)
}
```

## 前提知識
- セキュリティグループルール: 「どの方向の、どのプロトコルとポートの通信を、どこから許すか」を 1 つずつ表す設定です。
- ノードのセキュリティグループ: EKS のワーカーノードに付くセキュリティグループです。コントロールプレーンとの通信で使われます。
- `from_port` / `to_port`: 許可するポートの範囲です。
- `source_security_group_id`: 送信元として、別のセキュリティグループを指定する項目です。
- `try(値, null)`: 値が無ければ `null` を使います。

## 何をしているか
### 1. 対象のルールを絞る

```hcl:line-numbers=480
  for_each = { for k, v in merge(
    local.cluster_security_group_rules,
    var.security_group_additional_rules
  ) : k => v if local.create_security_group }
```

モジュールが用意したルールと、利用者が追加したルールを `merge` で 1 つにまとめます。作成するかどうかの条件を満たすものだけを残します。キーがルールの名前になります。

### 2. 送信元を、フラグで切り替える

```hcl:line-numbers=497
  source_security_group_id = try(each.value.source_node_security_group, false) ? local.node_security_group_id : try(each.value.source_security_group_id, null)
```

`source_node_security_group` が真なら、ノードのセキュリティグループの ID を送信元にします。偽なら、利用者が書いた `source_security_group_id` をそのまま使います。`try` で、フラグが無いルールは偽として扱われます。

### 3. 他の項目は、欠けても `null` にする

`description` や `cidr_blocks` などは、`try(..., null)` で読みます。ルールの種類によって、使う項目が違うので、無い項目は `null` にして送らないようにしています。

## ここがすごい
ノードからの通信を許すという、もっともよく使うルールを、「フラグ 1 つ」で書けるようにしています。利用者は、ノードのセキュリティグループの ID を調べる必要がありません。

また、ルールの種類ごとに違う項目を、すべて `try` で読んでいるので、1 つのリソースで CIDR のルールも、グループのルールも扱えます。判定の仕組みは 1 行ですが、その分だけ多様な指定ができます。

## まとめ
- よく使う送信元は、フラグで指定できるようにすると、利用者の手間が減ります。
- 「フラグが無ければ偽」の扱いを `try` で書くと、既存のルールも壊れません。
- 種類ごとに違う項目は、`try` で `null` にすると、1 つのリソースで多様なルールを作れます。
