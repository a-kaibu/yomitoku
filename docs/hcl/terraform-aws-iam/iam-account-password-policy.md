---
title: "アカウントのパスワードの決まりを、変数から一括で作る"
description: "terraform-aws-iam の iam-account。aws_iam_account_password_policy リソースの各項目を、変数からそのまま渡し、作成フラグが真のときだけ作る書き方。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-account/main.tf
lines: [15, 27]
format: 2
function: "resource \"aws_iam_account_password_policy\""
difficulty: 1
tags: ["セキュリティ", "API設計"]
---

## ひとことで
このリソースは、AWS アカウントのパスワードの決まり（長さ、文字の種類、有効期限など）を設定します。このモジュールでは、利用者が変数で指定した値を、そのまま各項目に渡しています。作成フラグが偽なら、リソースは作られません。

## コード
```hcl:line-numbers=15
resource "aws_iam_account_password_policy" "this" {
  count = var.create && var.create_account_password_policy ? 1 : 0

  max_password_age               = var.max_password_age
  minimum_password_length        = var.minimum_password_length
  allow_users_to_change_password = var.allow_users_to_change_password
  hard_expiry                    = var.hard_expiry
  password_reuse_prevention      = var.password_reuse_prevention
  require_lowercase_characters   = var.require_lowercase_characters
  require_uppercase_characters   = var.require_uppercase_characters
  require_numbers                = var.require_numbers
  require_symbols                = var.require_symbols
}
```

## 前提知識
- IAM ユーザーのパスワードポリシー: アカウント全体で、ユーザーのパスワードに求める決まりです。
- `count = 条件 ? 1 : 0`: 条件が真のときだけ 1 個作ります。
- `&&`: 両方が真のときだけ真になります。ここでは「モジュール全体の作成」と「パスワードポリシーを作る」の両方を求めています。
- `var.xxx`: 利用者が渡した変数の値です。
- `max_password_age` などの項目: 有効期限の日数や、必要な文字の種類を表します。

## 何をしているか
### 1. 作る条件を 2 つ組み合わせる
```hcl:line-numbers=16
  count = var.create && var.create_account_password_policy ? 1 : 0
```

`var.create && var.create_account_password_policy` の両方が真のときだけ、パスワードポリシーを作ります。アカウントの別名（alias）は作るけれどパスワードポリシーは作らない、という組み合わせも選べます。

### 2. 変数を項目へ渡す
```hcl:line-numbers=18
  max_password_age               = var.max_password_age
  minimum_password_length        = var.minimum_password_length
  allow_users_to_change_password = var.allow_users_to_change_password
  hard_expiry                    = var.hard_expiry
  password_reuse_prevention      = var.password_reuse_prevention
  require_lowercase_characters   = var.require_lowercase_characters
  require_uppercase_characters   = var.require_uppercase_characters
  require_numbers                = var.require_numbers
  require_symbols                = var.require_symbols
```

各項目は、同じ名前の変数から値を受け取ります。`max_password_age` は有効期限、`minimum_password_length` は最低の長さ、`require_symbols` などの真偽値は、必要な文字の種類を表します。モジュールの中で値を変換せず、そのまま渡しているのが特徴です。

## ここがすごい
変数と項目の名前をそろえているので、読み手は「`max_password_age` の変数が `max_password_age` の項目に渡る」と、すぐに分かります。変換がないことが、この単純さの理由です。

また、作成フラグとポリシーのフラグを分けているため、利用者は「アカウントの設定はモジュールで行い、パスワードポリシーは別で管理する」という使い方もできます。条件を 2 段に分けたことで、役割の分担がしやすくなっています。

また、`count` の条件を 2 つ並べているので、アカウントの作成は残しつつ、パスワードの決まりだけを別の管理に任せる、という運用もできます。条件を分けるだけで、利用者の選択肢が増える形です。

## まとめ
- 変数と項目の名前をそろえると、対応関係が一目で分かります。
- 作成の条件を 2 つ組み合わせると、部分的な作成ができます。
- 変換しない単純な渡し方は、読みやすさと保守性に効きます。

