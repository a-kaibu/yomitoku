---
title: "信頼ポリシーの statement を dynamic ブロックで作る"
description: "terraform-aws-iam の iam-role。OIDC の有効フラグが真のときだけ、プロバイダーごとの statement を作り、その中の condition も dynamic で条件付きに書く仕組み。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-role/main.tf
lines: [26, 51]
format: 2
function: "data \"aws_iam_policy_document\"（OIDC の statement）"
difficulty: 3
tags: ["メタプログラミング", "防御的プログラミング"]
---

## ひとことで
`data "aws_iam_policy_document"` の中で、OIDC 用の `statement` を `dynamic` ブロックで作っています。OIDC を有効にしたとき、プロバイダーの数だけ `statement` が作られます。その中の `condition` も、利用者が条件を指定したときだけ作られます。

## コード
::: code-group

```hcl:line-numbers=26 [日本語訳]
  # 汎用の OIDC（一般的な OpenID Connect プロバイダー）
  dynamic "statement" {
    for_each = var.enable_oidc ? local.oidc_providers : []

    content {
      effect = "Allow"
      actions = [
        "sts:TagSession",
        "sts:AssumeRoleWithWebIdentity",
      ]

      principals {
        type = "Federated"

        identifiers = ["arn:${local.partition}:iam::${coalesce(var.oidc_account_id, local.account_id)}:oidc-provider/${statement.value}"]
      }

      dynamic "condition" {
        for_each = length(var.oidc_subjects) > 0 ? local.oidc_providers : []

        content {
          test     = "StringEquals"
          variable = "${statement.value}:sub"
          values   = var.oidc_subjects
        }
      }
```

```hcl:line-numbers=26 [原文]
  # Generic OIDC
  dynamic "statement" {
    for_each = var.enable_oidc ? local.oidc_providers : []

    content {
      effect = "Allow"
      actions = [
        "sts:TagSession",
        "sts:AssumeRoleWithWebIdentity",
      ]

      principals {
        type = "Federated"

        identifiers = ["arn:${local.partition}:iam::${coalesce(var.oidc_account_id, local.account_id)}:oidc-provider/${statement.value}"]
      }

      dynamic "condition" {
        for_each = length(var.oidc_subjects) > 0 ? local.oidc_providers : []

        content {
          test     = "StringEquals"
          variable = "${statement.value}:sub"
          values   = var.oidc_subjects
        }
      }
```

:::

## 前提知識
- `aws_iam_policy_document`: IAM の JSON ポリシーを、HCL で書いて組み立てるデータソースです。`statement`、`principals`、`condition` などのブロックを書きます。
- `statement`: ポリシーの 1 つの許可（または拒否）の文です。`effect` は `Allow` か `Deny` です。
- `principals`: 誰に許可するかを表すブロックです。`type` と `identifiers` を持ちます。
- `condition`: 許可する条件です。`test`（比較の方法）、`variable`（調べる値）、`values`（期待する値）を持ちます。
- `dynamic "名前" { for_each = ... content { ... } }`: 要素の数だけブロックを作ります。
- `statement.value`: `dynamic` ブロックの中で、今のプロバイダーの名前を指します。

## 何をしているか
### 1. プロバイダーの数だけ statement を作る
```hcl:line-numbers=27
  dynamic "statement" {
    for_each = var.enable_oidc ? local.oidc_providers : []

    content {
```

`for_each = var.enable_oidc ? local.oidc_providers : []` は、OIDC が有効なら、プロバイダーの一覧の数だけ `statement` を作ります。無効なら 0 個です。`statement.value` で、今のプロバイダー名を参照します。

### 2. 信頼する主体を指定する
```hcl:line-numbers=37
      principals {
        type = "Federated"

        identifiers = ["arn:${local.partition}:iam::${coalesce(var.oidc_account_id, local.account_id)}:oidc-provider/${statement.value}"]
      }
```

`identifiers` には、`arn:...:oidc-provider/${statement.value}` のような ARN を組み立てて入れます。アカウント ID は `coalesce(var.oidc_account_id, local.account_id)` で、利用者が指定したものがあればそれを、無ければ現在のアカウントを使います。

### 3. 条件を条件付きで追加する
```hcl:line-numbers=43
      dynamic "condition" {
        for_each = length(var.oidc_subjects) > 0 ? local.oidc_providers : []

        content {
          test     = "StringEquals"
          variable = "${statement.value}:sub"
          values   = var.oidc_subjects
        }
      }
```

`dynamic "condition"` の `for_each` で、`oidc_subjects` が空でないときだけ `condition` を作ります。作るときも、プロバイダーの数だけ作られるので、`variable` の中で `${statement.value}:sub` と書けます。条件がないときは、ブロックそのものが消えるので、ポリシーに余計な条件が入りません。

## ここがすごい
`dynamic` を入れ子にすることで、「プロバイダー」「条件」という 2 段階の繰り返しを、1 つのポリシーの中で表しています。利用者は、プロバイダーの URL と subject の一覧を渡すだけで、必要な statement と condition が自然に作られます。

また、条件の有無を `dynamic` の `for_each` で決めているので、「条件が無いときは statement の中身が変わる」という複雑さを、テンプレートに書かずに済みます。読み手は、`for_each` の式を見れば、どの条件でどのブロックが出るかが分かります。

## まとめ
- `dynamic` は、リソース以外に、データソースの中のブロックにも使えます。
- 入れ子の `dynamic` で、2 段階の繰り返しを表現できます。
- `for_each` が空のリストなら、ブロックは作られず、条件の有無が自然に表せます。

