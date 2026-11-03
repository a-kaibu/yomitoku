---
title: "GitHub の OIDC 条件で subject の前置きをそろえる"
description: "terraform-aws-iam の iam-role。GitHub Actions の信頼ポリシーで、利用者の subject に repo: が付いていても付いていなくても同じ形になる for 式と trimprefix。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-role/main.tf
lines: [87, 122]
format: 2
function: "data \"aws_iam_policy_document\"（GitHub OIDC の statement）"
difficulty: 3
tags: ["文字列処理", "セキュリティ"]
---

## ひとことで
GitHub Actions からの認証を許す信頼ポリシーの `statement` です。GitHub 側の `sub`（主題）の条件には、`repo:組織/リポジトリ` の形が使われます。利用者が `repo:` を付けても付けなくても、ポリシーに入る値を同じ形にそろえています。

## コード
::: code-group

```hcl:line-numbers=87 [日本語訳]
  dynamic "statement" {
    for_each = var.enable_github_oidc ? [1] : []

    content {
      sid = "GithubOidcAuth"
      actions = [
        "sts:TagSession",
        "sts:AssumeRoleWithWebIdentity",
      ]

      principals {
        type        = "Federated"
        identifiers = ["arn:${local.partition}:iam::${local.account_id}:oidc-provider/${var.github_provider}"]
      }

      condition {
        test     = "ForAllValues:StringEquals"
        variable = "${var.github_provider}:iss"
        values   = ["https://${var.github_provider}"]
      }

      condition {
        test     = "ForAllValues:StringEquals"
        variable = "${var.github_provider}:aud"
        values   = coalescelist(var.oidc_audiences, ["sts.amazonaws.com"])
      }

      dynamic "condition" {
        for_each = length(var.oidc_subjects) > 0 ? [1] : []

        content {
          test     = "StringEquals"
          variable = "${var.github_provider}:sub"
          # 利用者が repo: を付けていても同じ形になるよう、先頭の repo: を取り除く
          values = [for subject in var.oidc_subjects : "repo:${trimprefix(subject, "repo:")}"]
        }
```

```hcl:line-numbers=87 [原文]
  dynamic "statement" {
    for_each = var.enable_github_oidc ? [1] : []

    content {
      sid = "GithubOidcAuth"
      actions = [
        "sts:TagSession",
        "sts:AssumeRoleWithWebIdentity",
      ]

      principals {
        type        = "Federated"
        identifiers = ["arn:${local.partition}:iam::${local.account_id}:oidc-provider/${var.github_provider}"]
      }

      condition {
        test     = "ForAllValues:StringEquals"
        variable = "${var.github_provider}:iss"
        values   = ["https://${var.github_provider}"]
      }

      condition {
        test     = "ForAllValues:StringEquals"
        variable = "${var.github_provider}:aud"
        values   = coalescelist(var.oidc_audiences, ["sts.amazonaws.com"])
      }

      dynamic "condition" {
        for_each = length(var.oidc_subjects) > 0 ? [1] : []

        content {
          test     = "StringEquals"
          variable = "${var.github_provider}:sub"
          # Strip `repo:` to normalize for cases where users may prepend it
          values = [for subject in var.oidc_subjects : "repo:${trimprefix(subject, "repo:")}"]
        }
```

:::

## 前提知識
- OIDC の `sub`（subject）: 認証を受けた主体を表す値です。GitHub Actions では `repo:組織/リポジトリ:ref:...` のような形になります。
- `condition` の `test`: `StringEquals` は完全一致、`ForAllValues:StringEquals` は全部が一致するかを調べる IAM の演算子です。
- `values`: 比べる値の一覧です。
- `trimprefix(文字列, 接頭辞)`: 文字列の先頭に接頭辞があれば取り除く関数です。
- `coalescelist(リストA, リストB)`: 最初に空でないリストを返します。ここでは、利用者が `oidc_audiences` を省略したときの既定値を指定します。
- `[for subject in ... : "式"]`: 一覧の各要素を変換する `for` 式です。

## 何をしているか
### 1. 発行者と対象を決める
```hcl:line-numbers=102
      condition {
        test     = "ForAllValues:StringEquals"
        variable = "${var.github_provider}:iss"
        values   = ["https://${var.github_provider}"]
      }

      condition {
        test     = "ForAllValues:StringEquals"
        variable = "${var.github_provider}:aud"
        values   = coalescelist(var.oidc_audiences, ["sts.amazonaws.com"])
      }
```

`iss` と `aud` の条件で、GitHub の発行者（`https://` 付きの URL）と、対象の `sts.amazonaws.com` を指定しています。`aud` の値は `coalescelist` で、利用者が指定した一覧か、無ければ既定の AWS STS の値を使います。

### 2. subject の前置きを取り除いてから付け直す
```hcl:line-numbers=114
      dynamic "condition" {
        for_each = length(var.oidc_subjects) > 0 ? [1] : []

        content {
          test     = "StringEquals"
          variable = "${var.github_provider}:sub"
          # 利用者が repo: を付けていても同じ形になるよう、先頭の repo: を取り除く
          values = [for subject in var.oidc_subjects : "repo:${trimprefix(subject, "repo:")}"]
        }
      }
```

`values = [for subject in var.oidc_subjects : "repo:${trimprefix(subject, "repo:")}"]` は、各 subject の先頭から `repo:` を一度取り除き、改めて `repo:` を付けます。利用者が `repo:org/app` と書いても、`org/app` と書いても、同じ `repo:org/app` になります。コメントにも、利用者が前置きを付けてもよいように正規化する、と書かれています。

## ここがすごい
`trimprefix` と `"repo:${...}"` の組み合わせは、1 行で「あってもなくても同じ」を実現しています。利用者の書き方の揺れを、モジュールが吸収するので、誤った条件で認証が通らないか、逆に拒否されないかを心配する必要がありません。

また、`dynamic "condition"` の `for_each` を `[1]` や空のリストで決めているため、subject が無いときは `condition` そのものが消えます。条件がないことを、ポリシーの中で正直に表しています。

## まとめ
- `trimprefix` を使うと、先頭の接頭辞の有無に関係なく同じ形にできます。
- `for` 式で、一覧の全要素に同じ変換を適用できます。
- 利用者の入力の揺れを吸収すると、信頼ポリシーの誤りを防げます。

