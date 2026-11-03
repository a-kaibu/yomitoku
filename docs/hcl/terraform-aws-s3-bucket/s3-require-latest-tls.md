---
title: "古い TLS でのアクセスを、数値の比較で拒否する"
description: "terraform-aws-s3-bucket の require_latest_tls。s3:TlsVersion が 1.2 より小さい要求を Deny し、古い暗号化の通信を止める。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [1151, 1180]
format: 2
function: "data \"aws_iam_policy_document\"（require_latest_tls）"
difficulty: 2
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
TLS（通信の暗号化の方式）には、古い版と新しい版があり、古い版には弱点が見つかっています。このコードは、バケットポリシーに「TLS 1.2 より古い版で来た要求は拒否する」という文を書きます。通信が HTTPS であっても、古すぎる TLS は止められます。

## コード
```hcl:line-numbers=1151
data "aws_iam_policy_document" "require_latest_tls" {
  count = local.create_bucket && var.attach_require_latest_tls_policy && !var.is_directory_bucket ? 1 : 0

  statement {
    sid    = "denyOutdatedTLS"
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
      test     = "NumericLessThan"
      variable = "s3:TlsVersion"
      values = [
        "1.2"
      ]
    }
  }
}
```

## 前提知識
- TLS: 通信を暗号化するための方式です。HTTPS は、この TLS の上で動きます。
- TLS のバージョン: 1.0、1.1、1.2、1.3 のように版があり、新しいほど安全です。
- `s3:TlsVersion`: 要求がどの TLS の版で来たかを表す条件キーです。
- `NumericLessThan`: 数値として「より小さい」かを比べる条件です。
- `Deny`: 条件に合う要求を、他の許可より優先して拒否します。

## 何をしているか
### 1. 対象は、バケットとその中身

```hcl:line-numbers=1162
    resources = [
      "_S3_BUCKET_ARN_",
      "_S3_BUCKET_ARN_/*",
    ]
```

バケット本体と、その中のオブジェクトすべてが対象です。仮の文字列は、後で実際の ARN に置き換えられます。

### 2. TLS の版が 1.2 より小さいものを拒否する

```hcl:line-numbers=1172
    condition {
      test     = "NumericLessThan"
      variable = "s3:TlsVersion"
      values = [
        "1.2"
      ]
    }
```

`NumericLessThan` は、`s3:TlsVersion` の値が `1.2` より小さいときに真になります。真のときに `Deny` が効くので、1.0 や 1.1 の要求が止まります。1.2 以上の要求は、この文の対象外です。

## ここがすごい
「HTTPS を使っているか」とは別に、「どの版の TLS か」を条件にしている点が細かくて良いです。HTTPS でも古い版の暗号化を使う要求は、前の記事の文だけでは通ってしまいます。この 2 つの文を組み合わせると、安全性の下限を両方から守れます。

また、条件を数値の比較にしているので、版の文字列を並べる必要がありません。将来 1.3 の扱いを変えるとしても、閾値を変えるだけで済みます。

## まとめ
- `Deny` と数値の比較で、古い TLS の版を一括で拒否できます。
- HTTPS の強制と、TLS の版の下限は、別の条件として組み合わせると効果的です。
- 条件キーを選ぶと、通信の安全性を細かく決められます。
