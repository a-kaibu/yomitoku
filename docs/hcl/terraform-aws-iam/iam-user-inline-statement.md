---
title: "ユーザーのインラインポリシーを dynamic の入れ子で組み立てる"
description: "terraform-aws-iam の iam-user。statement の中の principals・not_principals・condition を、それぞれ dynamic で作り、値が無いときは自然に省略される書き方。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-user/main.tf
lines: [37, 76]
format: 2
function: "data \"aws_iam_policy_document\"（inline・dynamic \"statement\"）"
difficulty: 3
tags: ["メタプログラミング", "API設計"]
---

## ひとことで
IAM ユーザーに直接書くインラインポリシーを、利用者の指定から組み立てる部分です。`statement` の数だけ文を作り、その中の `principals`、`not_principals`、`condition` も、値があるときだけ作ります。`dynamic` を入れ子にすることで、JSON の形を HCL の書き方で表しています。

## コード
```hcl:line-numbers=37
  dynamic "statement" {
    for_each = var.inline_policy_permissions != null ? var.inline_policy_permissions : {}

    content {
      sid           = try(coalesce(statement.value.sid, statement.key))
      actions       = statement.value.actions
      not_actions   = statement.value.not_actions
      effect        = statement.value.effect
      resources     = statement.value.resources
      not_resources = statement.value.not_resources

      dynamic "principals" {
        for_each = statement.value.principals != null ? statement.value.principals : []

        content {
          type        = principals.value.type
          identifiers = principals.value.identifiers
        }
      }

      dynamic "not_principals" {
        for_each = statement.value.not_principals != null ? statement.value.not_principals : []

        content {
          type        = not_principals.value.type
          identifiers = not_principals.value.identifiers
        }
      }

      dynamic "condition" {
        for_each = statement.value.condition != null ? statement.value.condition : []

        content {
          test     = condition.value.test
          values   = condition.value.values
          variable = condition.value.variable
        }
      }
    }
  }
```

## 前提知識
- `aws_iam_policy_document`: HCL でポリシーを書くと、JSON の文書にまとめてくれるデータソースです。
- `statement`: 1 つの許可または拒否の文です。`sid` や `actions`、`resources` などを持ちます。
- `principals` と `not_principals`: 誰に許可するか、または誰を除くかを表します。
- `condition`: 許可する条件です。`test`、`variable`、`values` の 3 項目があります。
- `coalesce(値, 既定値)`: 最初に `null` でない値を返します。ここでは `sid` が無ければ、利用者が付けた名前を使います。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。

## 何をしているか
### 1. 利用者が渡した文の一覧から、statement を作る
```hcl:line-numbers=38
    for_each = var.inline_policy_permissions != null ? var.inline_policy_permissions : {}
```

`for_each = var.inline_policy_permissions != null ? var.inline_policy_permissions : {}` は、利用者が渡した文の一覧です。`null` の場合は空のマップを使うので、文が 1 つも無いポリシーになります。`statement.key` は、利用者が付けた名前です。

### 2. sid を補い、文の中身を移す
```hcl:line-numbers=41
      sid           = try(coalesce(statement.value.sid, statement.key))
      actions       = statement.value.actions
      not_actions   = statement.value.not_actions
      effect        = statement.value.effect
      resources     = statement.value.resources
      not_resources = statement.value.not_resources
```

`sid` は、`try(coalesce(statement.value.sid, statement.key))` によって、書かれていなければキーの名前を使います。`actions` などの項目は、そのまま `statement.value` から移します。

### 3. 主体と条件をそれぞれ作る
```hcl:line-numbers=48
      dynamic "principals" {
        for_each = statement.value.principals != null ? statement.value.principals : []

        content {
          type        = principals.value.type
          identifiers = principals.value.identifiers
        }
      }

      dynamic "not_principals" {
        for_each = statement.value.not_principals != null ? statement.value.not_principals : []

        content {
          type        = not_principals.value.type
          identifiers = not_principals.value.identifiers
        }
      }

      dynamic "condition" {
        for_each = statement.value.condition != null ? statement.value.condition : []

        content {
          test     = condition.value.test
          values   = condition.value.values
          variable = condition.value.variable
        }
      }
```

`principals`、`not_principals`、`condition` は、それぞれ `dynamic` で作ります。値が `null` なら空のリストなので、ブロックは作られません。`condition` の中では、`test`、`values`、`variable` の 3 つを、そのまま移しています。

## ここがすごい
JSON のポリシーには、文の中に任意で項目が入るという形があります。`dynamic` の入れ子と `null` の判定を組み合わせると、その「任意」を、HCL の書き方でほぼそのまま表せます。利用者は、必要なブロックだけを書きます。

また、`sid` の補い方を `coalesce` で 1 行にしているので、利用者は短く書いても、JSON に必須の名前が入ります。小さな規則を、データの変換の中に閉じ込めている点が、読み応えのある部分です。

## まとめ
- `dynamic` を入れ子にすると、JSON の入れ子の形を HCL で表せます。
- 空のリストを `for_each` に渡すと、任意のブロックを簡単に省略できます。
- `coalesce` で既定の名前を補うと、利用者の入力の手間が減ります。

