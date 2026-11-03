---
title: "VPC の設定を、2 つの変数がそろったときだけ作る"
description: "terraform-aws-lambda の vpc_config。サブネットとセキュリティグループの両方の指定があるときだけ、VPC 内で動かすための dynamic ブロックを作る条件の書き方。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [112, 120]
format: 2
function: "resource \"aws_lambda_function\"（dynamic \"vpc_config\"）"
difficulty: 2
tags: ["ネットワーク", "防御的プログラミング"]
---

## ひとことで
Lambda 関数を VPC の中で動かすには、サブネットとセキュリティグループの両方を指定します。このブロックは、2 つの変数が両方とも `null` でないときだけ、`vpc_config` を作ります。片方だけ指定された場合は、何も作らずに、AWS の既定の動きに任せます。

## コード
```hcl:line-numbers=112
  dynamic "vpc_config" {
    for_each = var.vpc_subnet_ids != null && var.vpc_security_group_ids != null ? [true] : []
    content {
      security_group_ids          = var.vpc_security_group_ids
      subnet_ids                  = var.vpc_subnet_ids
      ipv6_allowed_for_dual_stack = var.ipv6_allowed_for_dual_stack
    }
  }

```

## 前提知識
- VPC 内の Lambda: 関数の実行環境を、指定したサブネットと、セキュリティグループの中に置くことです。
- `vpc_config`: VPC の設定を表すブロックです。`subnet_ids` と `security_group_ids` の両方が必要です。
- `&&`: 両方が真のときだけ真になります。ここでは、両方の変数が `null` でないことを確かめています。
- `var.vpc_subnet_ids != null`: 値があるかどうかを判定する式です。
- `dynamic` の `for_each = 条件 ? [true] : []`: 条件が真のときだけ、1 件のブロックを作ります。

## 何をしているか
### 1. 両方の値があるかを確かめる
```hcl:line-numbers=113
    for_each = var.vpc_subnet_ids != null && var.vpc_security_group_ids != null ? [true] : []
```

`var.vpc_subnet_ids != null && var.vpc_security_group_ids != null` が真のときだけ、`[true]` を渡します。どちらか一方でも `null` なら、空のリストになり、ブロックは作られません。

### 2. サブネットとセキュリティグループを渡す
```hcl:line-numbers=114
    content {
      security_group_ids          = var.vpc_security_group_ids
      subnet_ids                  = var.vpc_subnet_ids
      ipv6_allowed_for_dual_stack = var.ipv6_allowed_for_dual_stack
    }
  }
```

`subnet_ids` と `security_group_ids` は、変数からそのまま渡します。判定をすでに済ませているので、ここでは `null` を心配せずに値を使えます。

## ここがすごい
「両方そろったときだけ作る」という条件を、`dynamic` の `for_each` に置いています。片方だけの指定は、AWS で不完全な設定になるので、ブロックを作らずに止めます。エラーを出すのではなく、無効な組み合わせを省くという設計です。

ただし、片方だけ指定されたときに、利用者が気づかないことがあります。この点は、読み手が理解しておくと安心できる部分です。

## まとめ
- `&&` で、2 つの値の両方がそろったときだけブロックを作れます。
- 不完全な組み合わせを省くと、AWS に中途半端な設定が届きません。
- 片方だけの指定は、気づきにくい点として覚えておくと良いです。

