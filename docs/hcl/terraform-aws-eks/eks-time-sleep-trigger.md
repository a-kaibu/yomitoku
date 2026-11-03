---
title: "time_sleep で、クラスター作成後に待ち時間を入れる"
description: "terraform-aws-eks の time_sleep。クラスターの ID やエンドポイントを triggers に渡し、作成後の一定時間を待ってから後続のリソースを作るための仕組み。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: node_groups.tf
lines: [10, 23]
format: 2
function: "resource \"time_sleep\"（this）"
difficulty: 3
tags: ["設計パターン", "API設計"]
---

## ひとことで
EKS のクラスターを作った直後は、アドオンやノードが準備できていないことがあります。`time_sleep` は、指定した時間だけ待つ、という動きをする Terraform のリソースです。このブロックは、その待ち時間を、クラスターの値が変わったときに入れ直す仕組みとして使っています。

## コード
```hcl:line-numbers=10
resource "time_sleep" "this" {
  count = var.create ? 1 : 0

  create_duration = var.dataplane_wait_duration

  triggers = {
    name               = aws_eks_cluster.this[0].id
    endpoint           = aws_eks_cluster.this[0].endpoint
    kubernetes_version = aws_eks_cluster.this[0].version
    service_cidr       = var.ip_family == "ipv6" ? try(local.kubernetes_network_config.service_ipv6_cidr, "") : try(local.kubernetes_network_config.service_ipv4_cidr, "")

    certificate_authority_data = aws_eks_cluster.this[0].certificate_authority[0].data
  }
}
```

## 前提知識
- `time_sleep`: 指定した時間だけ待つだけのリソースです。`time` プロバイダーに含まれます。
- `create_duration`: 作成のときに待つ時間です。例えば `30s` のような文字列で書きます。
- `triggers`: この値が変わったときに、`time_sleep` を作り直します。作り直すと、待ち時間もやり直しになります。
- `aws_eks_cluster.this[0]`: クラスターの情報です。`id`、`endpoint`、`version` などを持ちます。
- `certificate_authority[0].data`: クラスターの認証局の情報です。

## 何をしているか
### 1. 待ち時間を渡す
```hcl:line-numbers=11
  count = var.create ? 1 : 0

  create_duration = var.dataplane_wait_duration
```

`count` でモジュールを作るときだけ待ち、`create_duration` に利用者の `dataplane_wait_duration` を渡します。既定の待ち時間は、変数で決められています。

### 2. 変化をトリガーにする
```hcl:line-numbers=15
  triggers = {
    name               = aws_eks_cluster.this[0].id
    endpoint           = aws_eks_cluster.this[0].endpoint
    kubernetes_version = aws_eks_cluster.this[0].version
    service_cidr       = var.ip_family == "ipv6" ? try(local.kubernetes_network_config.service_ipv6_cidr, "") : try(local.kubernetes_network_config.service_ipv4_cidr, "")

    certificate_authority_data = aws_eks_cluster.this[0].certificate_authority[0].data
  }
```

`triggers` には、クラスターの名前、エンドポイント、バージョン、サービスの CIDR、認証局のデータを入れています。どれかが変わると、`time_sleep` が作り直されて、待ちが改めて始まります。

## ここがすごい
「待つ」という処理を、リソースとして表せるので、後続のリソースが `depends_on` でこの待ちを参照できます。クラスターの準備が終わってから、データプレーン（ノードなど）を作る順番を、依存関係で明示できます。

また、トリガーにクラスターの値を入れているので、クラスターの設定が変わったときに、待ちも自然にやり直されます。固定の時間で待つより、変化に追従しやすい設計です。

## まとめ
- `time_sleep` は、作成後の待ちを依存関係の一部として表せます。
- `triggers` でリソースの値を入れると、変化に応じて待ちをやり直せます。
- 準備に時間がかかる部品の後に、待ちを挟むと、失敗を減らせます。

