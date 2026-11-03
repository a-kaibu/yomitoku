---
title: "count と for 式で、作ったルールの ID を集める"
description: "terraform-aws-security-group の排他的なルール管理。for_each で作った ingress と egress のルール ID を for 式で集め、count の条件で作る書き方を読む。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: main.tf
lines: [90, 98]
format: 2
function: "resource \"aws_vpc_security_group_rules_exclusive\""
difficulty: 2
tags: ["設計パターン", "セキュリティ"]
---

## ひとことで
この部分は、セキュリティグループの ingress と egress のルールの ID を集め、「このモジュールが管理するルールだけを残す」ための排他的なリソースに渡します。作るかどうかは `count` で決め、ルール ID の一覧は `for` 式で作ります。

## コード
```hcl:line-numbers=90
resource "aws_vpc_security_group_rules_exclusive" "this" {
  count = local.create && var.enable_exclusive_rules ? 1 : 0

  region = var.region

  security_group_id = aws_security_group.this[0].id
  ingress_rule_ids  = [for rule in aws_vpc_security_group_ingress_rule.this : rule.id]
  egress_rule_ids   = [for rule in aws_vpc_security_group_egress_rule.this : rule.id]
}
```

## 前提知識
- `count = 条件 ? 1 : 0`: 条件が真なら 1 個、偽なら 0 個のリソースを作る書き方です。
- `&&`: 両方が真のときだけ真になる論理積です。
- `[for rule in リソース名 : rule.id]`: 同じリソースの各要素から ID を取り出し、リストにする `for` 式です。`for_each` で作られたリソースは、マップとして扱われます。
- `aws_security_group.this[0].id`: `count` で作ったリソースの最初の要素の ID です。
- 排他的な（exclusive）管理: 宣言していないルールを、Terraform が消す、または管理対象から外す、といった考え方です。

## 何をしているか
### 1. 作るかどうかを 2 つの条件で決める
```hcl:line-numbers=91
  count = local.create && var.enable_exclusive_rules ? 1 : 0
```

`local.create && var.enable_exclusive_rules` の両方が真のときだけ、リソースを 1 個作ります。モジュール全体を作らない場合や、利用者が排他的な管理を望まない場合は、0 個になります。`count` を使うため、リソースのアドレスは `[0]` のように番号で参照されます。

### 2. 対象のセキュリティグループと、ルール ID の一覧を渡す
```hcl:line-numbers=95
  security_group_id = aws_security_group.this[0].id
  ingress_rule_ids  = [for rule in aws_vpc_security_group_ingress_rule.this : rule.id]
  egress_rule_ids   = [for rule in aws_vpc_security_group_egress_rule.this : rule.id]
```

`security_group_id` には、このモジュールで作ったセキュリティグループの ID を渡します。`ingress_rule_ids` と `egress_rule_ids` は、それぞれの `for` 式で、先に作ったルールのリソースから ID を集めたリストです。ルールを作るリソースが `for_each` で作られているので、`rule` は 1 件ずつのリソースを指します。

## ここがすごい
このリソースは、ルールを作るリソースとは別に、ルールの ID だけを一覧で持ちます。ルールの作成と、排他的な管理の宣言を分けることで、どのルールを管理対象にするかを、1 か所で決められます。

さらに、`for` 式は、ルールを作るリソースの数がゼロでも空のリストを返すので、ルールが無い場合でもエラーになりません。`count` の条件と `for` 式の空リストの組み合わせが、この小さなリソースを安全にしています。

## まとめ
- `count` の条件に `&&` を使うと、複数の条件をまとめて判断できます。
- `for` 式で、`for_each` のリソースから ID の一覧を作れます。
- 作るルールと管理の宣言を分けると、役割を明確にできます。

