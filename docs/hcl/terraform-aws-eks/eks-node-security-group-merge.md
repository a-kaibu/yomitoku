---
title: "セキュリティグループのルールを、3 つの一覧から merge で 1 つにする"
description: "terraform-aws-eks の node セキュリティグループ。推奨ルール・内部のルール・利用者の追加ルールを merge で 1 つにまとめ、for 式で条件を掛けて for_each に渡す書き方。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: node_groups.tf
lines: [203, 223]
format: 2
function: "resource \"aws_security_group_rule\"（node）"
difficulty: 3
tags: ["設計パターン", "データ構造"]
---

## ひとことで
EKS のノードのセキュリティグループには、モジュールが決めた基本のルール、推奨のルール、利用者が追加したルールがあります。このリソースは、3 つの一覧を `merge` で 1 つにまとめ、そこから 1 件ずつルールを作ります。同じキーのルールは、後の一覧で上書きされます。

## コード
```hcl:line-numbers=203
resource "aws_security_group_rule" "node" {
  for_each = { for k, v in merge(
    local.node_security_group_rules,
    local.node_security_group_recommended_rules,
    var.node_security_group_additional_rules,
  ) : k => v if local.create_node_sg }

  region = var.region

  security_group_id        = aws_security_group.node[0].id
  protocol                 = each.value.protocol
  from_port                = each.value.from_port
  to_port                  = each.value.to_port
  type                     = each.value.type
  description              = try(each.value.description, null)
  cidr_blocks              = try(each.value.cidr_blocks, null)
  ipv6_cidr_blocks         = try(each.value.ipv6_cidr_blocks, null)
  prefix_list_ids          = try(each.value.prefix_list_ids, null)
  self                     = try(each.value.self, null)
  source_security_group_id = try(each.value.source_cluster_security_group, false) ? local.security_group_id : try(each.value.source_security_group_id, null)
}
```

## 前提知識
- セキュリティグループのルール: 通信の方向（`type` の ingress か egress）、プロトコル、ポートの範囲、許可元を決めます。
- `merge(A, B, C)`: 複数のマップを 1 つにまとめます。同じキーがあれば、後のものが優先されます。
- `for k, v in マップ : k => v if 条件`: マップを絞り込む `for` 式です。
- `try(項目, null)`: 項目が無いときに `null` を返します。ルールごとに、書く項目が違うことを扱えます。
- 三項演算子を、引数の中で使うと、値を条件で選べます。

## 何をしているか
### 1. 3 つの一覧を 1 つにまとめる
```hcl:line-numbers=204
  for_each = { for k, v in merge(
    local.node_security_group_rules,
    local.node_security_group_recommended_rules,
    var.node_security_group_additional_rules,
  ) : k => v if local.create_node_sg }
```

`merge` の引数は、モジュールの基本のルール、推奨のルール、利用者の追加のルールです。キーが重なる場合は後の一覧が優先されるので、利用者は既定のルールを、同じキーで上書きできます。最後の `if local.create_node_sg` で、ノードのセキュリティグループを作らないときは空にします。

### 2. ルールの項目を、そのまま、または try で移す
```hcl:line-numbers=212
  security_group_id        = aws_security_group.node[0].id
  protocol                 = each.value.protocol
  from_port                = each.value.from_port
  to_port                  = each.value.to_port
  type                     = each.value.type
  description              = try(each.value.description, null)
  cidr_blocks              = try(each.value.cidr_blocks, null)
  ipv6_cidr_blocks         = try(each.value.ipv6_cidr_blocks, null)
  prefix_list_ids          = try(each.value.prefix_list_ids, null)
  self                     = try(each.value.self, null)
```

`protocol` や `from_port` などの必須の項目は、そのまま渡します。`description` や `cidr_blocks` などは、ルールによって書かれていないことがあるので、`try(..., null)` で受けます。

### 3. 送信元を条件で選ぶ
```hcl:line-numbers=222
  source_security_group_id = try(each.value.source_cluster_security_group, false) ? local.security_group_id : try(each.value.source_security_group_id, null)
```

`source_security_group_id` は、`source_cluster_security_group` が真なら、クラスターのセキュリティグループの ID を使います。そうでなければ、利用者が直接指定した ID を使います。ルールの許可元を、1 行の三項演算子で切り替えています。

## ここがすごい
ルールの出どころを 3 つに分けたまま、`merge` で 1 つの一覧にできるのが工夫です。利用者は、既定のルールを消さずに、同じキーで上書きや追加ができます。出どころの違いを、キーの重なりで自然に扱えます。

また、ルールごとに書く項目が違っても、`try` によって、どのルールも同じリソースの書き方で表せます。ルールの形のばらつきを、リソースの側で吸収しています。

## まとめ
- `merge` で複数の一覧を合わせると、後の一覧で上書きできます。
- `try` を使うと、項目が無いルールでも同じ書き方で扱えます。
- 送信元の切り替えは、三項演算子で 1 行に書けます。

