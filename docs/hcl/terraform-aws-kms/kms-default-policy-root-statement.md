---
title: "KMS 鍵の既定の文で、アカウントの root に全操作を許す"
description: "terraform-aws-kms の既定のポリシー。enable_default_policy が真のとき、アカウントの root に kms:* を許可する文を作る。"
language: hcl
project: "terraform-aws-kms"
repo: https://github.com/terraform-aws-modules/terraform-aws-kms
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "d25e459bd43d8d0bdff7c250ba6b237a12be7381"
file: main.tf
lines: [112, 124]
format: 2
function: "data \"aws_iam_policy_document\"（dynamic \"statement\" の既定の文）"
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
KMS の鍵は、ポリシーで誰が使えるかを決めます。ポリシーに許可が無いと、アカウントの管理者でさえ鍵を操作できなくなることがあります。このコードは、既定のポリシーとして、アカウントの root に鍵の全操作を許す文を作っています。

## コード
```hcl:line-numbers=112
  dynamic "statement" {
    for_each = var.enable_default_policy ? [1] : []

    content {
      sid       = "Default"
      actions   = ["kms:*"]
      resources = ["*"]

      principals {
        type        = "AWS"
        identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
      }
    }
```

## 前提知識
- KMS のキーポリシー: 鍵ごとに付けるポリシーです。IAM のポリシーとは別に、鍵の利用を許可する必要があります。
- アカウントの root: そのアカウントの全体を表す主体です。ここでは、アカウントの IAM の権限を通して鍵を使えるようにします。
- `kms:*`: 鍵に対するすべての操作を表します。

## 何をしているか
### 1. 既定の文を作るかを決める

```hcl:line-numbers=113
    for_each = var.enable_default_policy ? [1] : []
```

`var.enable_default_policy` が真のときだけ、既定の文を作ります。偽なら、利用者の文だけが使われます。

### 2. アカウントの root に全操作を許す

```hcl:line-numbers=116
      sid       = "Default"
      actions   = ["kms:*"]
      resources = ["*"]
```

`kms:*` の操作を、すべてのリソースに対して許可します。

### 3. 主体をアカウントの root にする

```hcl:line-numbers=120
      principals {
        type        = "AWS"
        identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
      }
```

許可する主体は、アカウントの root の ARN です。`local.partition` と `local.account_id` で、パーティションと番号を組み立てています。

## ここがすごい
鍵の管理者が閉め出されないように、アカウントの root を既定の主体にしています。その上で、利用者は `enable_default_policy` を偽にすれば、この既定の文を外せます。

## まとめ
- 鍵のポリシーは、利用者の許可と既定の許可を分けて作ると管理しやすくなります。
- 主体の ARN は、パーティションとアカウント番号を組み立てて、どのリージョンでも動くようにします。
- 広い許可を既定にするときは、その範囲をコメントや変数で明示すると安全です。
