---
title: "Fargate では、EC2 用の設定ブロックを丸ごと作らない"
description: "terraform-aws-batch の ec2_configuration。種類が Fargate なら for_each を空にして、EC2 専用のブロックも、そのほかの値も送らないようにする。"
language: hcl
project: "terraform-aws-batch"
repo: https://github.com/terraform-aws-modules/terraform-aws-batch
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "93a3e2ec1ab003dde08e95b3da055ba040c04ca9"
file: main.tf
lines: [30, 41]
format: 2
function: "resource \"aws_batch_compute_environment\"（dynamic \"ec2_configuration\"・instance_role）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
AWS Batch のコンピュート環境で、Fargate を選んだときは、EC2 に関係する設定は意味を持ちません。このコードは、EC2 の画像の設定ブロックを作らず、キーペアやロール、インスタンスの種類も `null` にしています。Fargate の利用者が、EC2 用の値を書き残していても、AWS に送られることはありません。

## コード
```hcl:line-numbers=30
      dynamic "ec2_configuration" {
        for_each = !contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) && compute_resources.value.ec2_configuration != null ? compute_resources.value.ec2_configuration : []

        content {
          image_id_override = ec2_configuration.value.image_id_override
          image_type        = ec2_configuration.value.image_type
        }
      }

      ec2_key_pair  = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.ec2_key_pair
      instance_role = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : try(aws_iam_instance_profile.instance[0].arn, compute_resources.value.instance_role)
      instance_type = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.instance_types
```

## 前提知識
- コンピュート環境: AWS Batch のジョブを実行する資源の集まりです。
- EC2 の画像設定（ec2_configuration）: EC2 の上で動くときに使う、AMI の種類や上書きの指定です。
- インスタンスロール: EC2 の中のプログラムが、AWS の他のサービスへアクセスするための IAM ロールです。
- キーペア: EC2 に SSH でログインするための鍵の組です。
- `!contains(...) && ... ? x : []`: 「Fargate ではない」かつ「値がある」ときだけ、要素を作る書き方です。

## 何をしているか
### 1. 種類が Fargate でなく、値があるときだけ作る

```hcl:line-numbers=31
        for_each = !contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) && compute_resources.value.ec2_configuration != null ? compute_resources.value.ec2_configuration : []
```

`contains` の前に `!` を付けて、「Fargate ではない」という条件にしています。両方が真のときだけ、EC2 の画像の設定が 1 つ作られます。Fargate のときは空のリストなので、ブロックは作られません。

### 2. キーペアとロールを、判定して null にする

```hcl:line-numbers=39
      ec2_key_pair  = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.ec2_key_pair
      instance_role = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : try(aws_iam_instance_profile.instance[0].arn, compute_resources.value.instance_role)
```

Fargate のときは、キーペアとインスタンスロールを `null` にします。EC2 のときは、利用者の値を使います。インスタンスロールは、モジュールが作ったインスタンスプロファイルがあれば、その ARN を優先します。`try` は、そのプロファイルが無いときに利用者の値へ戻すための仕組みです。

## ここがすごい
「ブロックを作らない」と「値を null にする」を、同じ判定の式で使い分けています。ブロックの場合は `for_each` の空リストで消し、属性の場合は三項演算子で `null` にします。どちらも `contains` の結果だけに頼るので、Fargate かどうかの判断は 1 つの考え方で統一されています。

また、`try` で「モジュールが作ったロール」と「利用者のロール」を切り替えている点も見どころです。作成の有無にかかわらず、同じ属性名で値が決まります。

## まとめ
- 種類による違いは、`for_each` の空リストと `null` の 2 通りで表せます。
- `!contains(...)` の否定を使うと、「EC2 のときだけ」の条件を書けます。
- `try(作ったもの, 利用者の値)` で、作成の有無にかかわらず値を 1 つに決められます。
