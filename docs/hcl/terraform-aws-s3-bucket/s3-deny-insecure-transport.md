---
title: "HTTPS 以外の通信を、バケットポリシーで拒否する"
description: "terraform-aws-s3-bucket の deny_insecure_transport。aws:SecureTransport が false の要求を Deny で止め、平文の通信で中身が読まれるのを防ぐ。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [1120, 1149]
format: 2
function: "data \"aws_iam_policy_document\"（deny_insecure_transport）"
difficulty: 2
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
S3 へのアクセスが HTTP のような暗号化されていない通信で行われると、データを途中で盗み見られるおそれがあります。このコードは、バケットポリシーに「HTTPS を使わない要求は拒否する」という文を書きます。利用者が何もしなくても、平文の通信を止められます。

## コード
```hcl:line-numbers=1120
data "aws_iam_policy_document" "deny_insecure_transport" {
  count = local.create_bucket && var.attach_deny_insecure_transport_policy && !var.is_directory_bucket ? 1 : 0

  statement {
    sid    = "denyInsecureTransport"
    effect = "Deny"

    actions = [
      "s3:*",
    ]

    resources = [
      "_S3_BUCKET_ARN_",
      "_S3_BUCKET_ARN_/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values = [
        "false"
      ]
    }
  }
}
```

## 前提知識
- バケットポリシー: S3 のバケットに付ける、誰が何をできるかの許可と拒否の書類です。
- `Deny`: 文に合う要求を、他の `Allow` よりも優先して止める効果です。
- `aws:SecureTransport`: 要求が TLS（HTTPS）で来ていれば `true`、そうでなければ `false` になる条件キーです。
- `principals { type = "*" }`: すべての主体を表します。誰からの要求でも、この文が調べられます。
- `_S3_BUCKET_ARN_`: このモジュールが後で実際のバケットの ARN に置き換える、仮の文字列です。

## 何をしているか
### 1. すべての要求を、Deny の対象にする

```hcl:line-numbers=1123
  statement {
    sid    = "denyInsecureTransport"
    effect = "Deny"
```

`effect = "Deny"` は、この文に合う要求を拒否するという意味です。`sid` は文の名前で、ポリシーの中で文を区別するためのラベルです。

### 2. バケットとその中身を対象にする

```hcl:line-numbers=1127
    actions = [
      "s3:*",
    ]

    resources = [
      "_S3_BUCKET_ARN_",
      "_S3_BUCKET_ARN_/*",
    ]
```

`s3:*` はすべての操作を表します。対象は、バケットそのもの（1 つ目）と、その中のオブジェクト（`/*` の 2 つ目）です。仮の文字列は、後で実際の ARN に置き換えられます。

### 3. TLS ではない要求を条件にする

```hcl:line-numbers=1141
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values = [
        "false"
      ]
    }
```

条件は「`aws:SecureTransport` が `false`」です。つまり、HTTPS ではない要求だけが、この Deny に当たります。HTTPS の要求は、この文の対象外なので、普段どおり許可されます。

## ここがすごい
この文は、利用者が何も書かなくても、バケットを平文の通信から守ります。`attach_deny_insecure_transport_policy` という変数で、この文を付けるかどうかを選べるようにしている点も、安全な既定値を使いやすくする工夫です。

また、`Deny` を使うことで、他にどれだけ `Allow` があっても、平文の通信だけは必ず止まります。許可の書き方を増やしても、この安全策は崩れません。

## まとめ
- `Deny` と `aws:SecureTransport` の組み合わせで、HTTPS 以外を一律に止められます。
- `principals` の `*` と `resources` の 2 種類で、バケット全体を対象にできます。
- 安全策は `Allow` より優先されるので、後から許可を増やしても効き続けます。
