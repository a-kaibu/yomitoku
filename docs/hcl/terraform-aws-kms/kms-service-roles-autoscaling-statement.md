---
title: "Auto Scaling の役割に、鍵の利用だけを許す文を足す"
description: "terraform-aws-kms の鍵ポリシー。Auto Scaling のサービスロールに、暗号化とデータキーの生成だけを許可する文を、指定があるときだけ作る。"
language: hcl
project: "terraform-aws-kms"
repo: https://github.com/terraform-aws-modules/terraform-aws-kms
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "d25e459bd43d8d0bdff7c250ba6b237a12be7381"
file: main.tf
lines: [226, 243]
format: 2
function: "data \"aws_iam_policy_document\"（this・KeyServiceRolesASG）"
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
EBS で暗号化されたボリュームを使う Auto Scaling グループは、暗号鍵を使ってインスタンスを起動する必要があります。その権限を、Auto Scaling 用のロールに渡す文が、このコードの中にあります。鍵の管理（削除や鍵ポリシーの変更）は含めず、暗号化とデータキーの生成だけを許します。

## コード
```hcl:line-numbers=226
    for_each = length(var.key_service_roles_for_autoscaling) > 0 ? [1] : []

    content {
      sid = "KeyServiceRolesASG"
      actions = [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey",
      ]
      resources = ["*"]

      principals {
        type        = "AWS"
        identifiers = var.key_service_roles_for_autoscaling
      }
    }
```

## 前提知識
- EBS 暗号化: インスタンスのボリュームを KMS の鍵で暗号化する仕組みです。Auto Scaling が起動するときに、その鍵を使う権限が要ります。
- サービスロール: AWS の別のサービス（ここでは Auto Scaling）が、利用者のアカウントの中で動くときに使う IAM ロールです。
- データキー（GenerateDataKey）: 暗号化のための一時的な鍵を作る操作です。
- `kms:ReEncrypt*` のように、末尾の `*` は「その名前で始まる操作すべて」を表します。
- `for_each = 条件 ? [1] : []`: 条件が真のときだけ文を 1 つ作る書き方です。

## 何をしているか
### 1. 指定されたロールがあるときだけ文を作る

```hcl:line-numbers=226
    for_each = length(var.key_service_roles_for_autoscaling) > 0 ? [1] : []
```

`key_service_roles_for_autoscaling` に、ロールの ARN が 1 つでもあれば文を作ります。空なら何も作りません。こうすると、Auto Scaling を使わない鍵では、余計な許可が鍵ポリシーに入りません。

### 2. 操作を、暗号化に必要なものに限る

```hcl:line-numbers=230
      actions = [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey",
      ]
```

`kms:Encrypt` と `kms:Decrypt` は、データの暗号化と復号です。`GenerateDataKey*` は、ボリュームごとのデータキーを作るために使われます。`DescribeKey` は鍵の情報を読むだけです。鍵の削除や、ポリシーの変更は含まれていません。

### 3. 相手は、渡されたロールだけにする

```hcl:line-numbers=239
      principals {
        type        = "AWS"
        identifiers = var.key_service_roles_for_autoscaling
      }
```

`identifiers` には、利用者が渡した IAM ロールの ARN が入ります。アカウント全体ではなく、特定のロールに限定しているので、許可の範囲が狭く保たれます。

## ここがすごい
「必要な操作だけを、必要な相手だけに」という最小権限の考え方が、文の中に素直に表れています。`kms:*` のような広い許可を使わず、暗号化に必要な 5 つの操作だけを並べています。

また、`for_each` の条件で、使わない場合は文そのものを作らないようにしています。鍵ポリシーは、文が 1 つ増えるだけで、読み手の負担が大きく増えます。作らないことが一番安全で読みやすい、という判断が見えます。

## まとめ
- サービスロールには、必要な操作だけを `actions` に並べます。
- `kms:*` の代わりに、`ReEncrypt*` のようなワイルドカードで必要な範囲を書けます。
- 条件付きの `dynamic` で、使わない許可は鍵ポリシーに入れないようにできます。
