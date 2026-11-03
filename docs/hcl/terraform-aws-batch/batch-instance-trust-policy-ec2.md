---
title: "EC2 だけがロールを引き受けられる信頼ポリシーを作る"
description: "terraform-aws-batch のインスタンス用 IAM ロール。sts:AssumeRole を、EC2 のサービスプリンシパルだけに許可する信頼ポリシーを data で作る。"
language: hcl
project: "terraform-aws-batch"
repo: https://github.com/terraform-aws-modules/terraform-aws-batch
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "93a3e2ec1ab003dde08e95b3da055ba040c04ca9"
file: main.tf
lines: [117, 125]
format: 2
function: "data \"aws_iam_policy_document\"（instance・EC2AssumeRole）"
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
IAM ロールには、「誰がそのロールを引き受けてよいか」を書いた信頼ポリシーが必要です。AWS Batch のインスタンスに付けるロールは、EC2 というサービスだけが引き受けられるようにします。このコードは、その信頼ポリシーを、HCL の書き方で作ります。

## コード
```hcl:line-numbers=117
  statement {
    sid     = "EC2AssumeRole"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.${local.dns_suffix}"]
    }
  }
```

## 前提知識
- 信頼ポリシー（trust policy）: ロールの「誰が使ってよいか」を決める書類です。ロールの権限とは別に、引き受けの可否を決めます。
- `sts:AssumeRole`: ロールを一時的に引き受けるための操作です。
- サービスプリンシパル: `ec2.amazonaws.com` のように、AWS のサービスを表す主体です。人ではなく、サービスが引き受けます。
- `dns_suffix`: リージョンの区分によって変わる、ドメインの末尾です。中国リージョンなどでは違います。
- `aws_iam_policy_document`: HCL の書き方から、IAM のポリシーの JSON を作るデータソースです。

## 何をしているか
### 1. 引き受ける操作を決める

```hcl:line-numbers=118
    sid     = "EC2AssumeRole"
    actions = ["sts:AssumeRole"]
```

この文の名前は `EC2AssumeRole` です。操作は `sts:AssumeRole` だけで、ロールを引き受けることだけを許します。ロールの中の権限は、別の文で決めます。

### 2. 引き受けるのは EC2 のサービス

```hcl:line-numbers=121
    principals {
      type        = "Service"
      identifiers = ["ec2.${local.dns_suffix}"]
    }
```

`type = "Service"` は、主体がサービスであることを表します。`identifiers` は `ec2.` にリージョンの `dns_suffix` を付けた名前です。これで、EC2 のインスタンスだけがこのロールを引き受けられます。

## ここがすごい
信頼ポリシーの主体を「EC2 というサービス」に限ることで、ほかのサービスや利用者がこのロールを引き受けることを防いでいます。ロールの権限を書く前の、いちばん外側の守りです。

また、ドメインの末尾をハードコードせず、`dns_suffix` で組み立てているので、中国リージョンのような区分でも同じコードが使えます。前に見た KMS の ARN と同じ考え方が、サービスの名前にも使われています。

## まとめ
- 信頼ポリシーは、ロールを誰が使えるかを決める、外側の守りです。
- `sts:AssumeRole` と `Service` の主体を組み合わせると、特定のサービスだけに限定できます。
- リージョンの違いを `dns_suffix` で吸収すると、同じコードで複数の区分に対応できます。
