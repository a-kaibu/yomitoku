---
title: "暗号化していないアップロードを、ポリシーで拒否する"
description: "terraform-aws-tfstate-backend の bucket_policy。prevent_unencrypted_uploads が真のとき、暗号化ヘッダーを付けていない PutObject を拒否する statement を、dynamic で作る書き方。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: main.tf
lines: [70, 101]
format: 2
function: "data \"aws_iam_policy_document\"（bucket_policy・dynamic \"statement\"）"
difficulty: 3
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
状態ファイルを保存するバケットに、「暗号化されていない状態でのアップロード」を拒否するポリシーを付ける部分です。この拒否の文は、設定が真のときだけ作られます。拒否の条件には、`s3:x-amz-server-side-encryption` の値が `AES256` か `aws:kms` でない、という条件を使っています。

## コード
```hcl:line-numbers=70
  dynamic "statement" {
    for_each = local.prevent_unencrypted_uploads ? ["true"] : []

    content {
      sid = "DenyIncorrectEncryptionHeader"

      effect = "Deny"

      principals {
        identifiers = ["*"]
        type        = "AWS"
      }

      actions = [
        "s3:PutObject"
      ]

      resources = [
        "${var.arn_format}:s3:::${local.bucket_name}/*",
      ]

      condition {
        test     = "StringNotEquals"
        variable = "s3:x-amz-server-side-encryption"

        values = [
          "AES256",
          "aws:kms"
        ]
      }
    }
  }
```

## 前提知識
- S3 のサーバー側暗号化: S3 に保存するときに、AWS 側でデータを暗号化する仕組みです。アップロード時に `x-amz-server-side-encryption` のヘッダーで方式を指定します。
- `Deny`（拒否）: 条件に合うリクエストを、ほかの許可に関係なく止める文です。
- `s3:PutObject`: オブジェクトをアップロードする操作です。
- `condition` の `StringNotEquals`: 値が一致しないときに真になる条件です。
- `dynamic "statement" { for_each = 条件 ? ["true"] : [] }`: 条件が真のときだけ 1 件作る、という書き方です。
- `"${var.arn_format}:s3:::..."`: 文字列の中に値を埋め込んで、バケットの ARN を作ります。

## 何をしているか
### 1. 文を作るかどうかを決める
```hcl:line-numbers=67
data "aws_iam_policy_document" "bucket_policy" {
  count = local.enabled ? 1 : 0

  dynamic "statement" {
    for_each = local.prevent_unencrypted_uploads ? ["true"] : []
```

`for_each = local.prevent_unencrypted_uploads ? ["true"] : []` は、この設定が真のときだけ、1 件の要素を持つリストを作ります。`["true"]` の中身は使わず、「1 回作る」という印として使っています。

### 2. 拒否の対象と条件を書く
```hcl:line-numbers=76
      effect = "Deny"

      principals {
        identifiers = ["*"]
        type        = "AWS"
      }

      actions = [
        "s3:PutObject"
      ]

      resources = [
        "${var.arn_format}:s3:::${local.bucket_name}/*",
      ]
```

`effect = "Deny"` で拒否にして、`actions` に `s3:PutObject` を指定します。`resources` はバケットの中のすべてのオブジェクトを表します。`principals` の `"*"` は、すべての主体を対象にする意味です。

### 3. 暗号化の方式が違う場合だけ拒否する
```hcl:line-numbers=91
      condition {
        test     = "StringNotEquals"
        variable = "s3:x-amz-server-side-encryption"

        values = [
          "AES256",
          "aws:kms"
        ]
      }
```

`StringNotEquals` の条件により、暗号化ヘッダーの値が `AES256` でも `aws:kms` でもないときに、この拒否が効きます。暗号化ヘッダーを省略したアップロードも、値が一致しないので拒否されます。

## ここがすごい
この規則は、状態ファイルを保護するという目的をポリシーで直接表しています。利用者がアップロードのやり方を間違えても、バケットの側で止められます。

また、`dynamic` の条件を使うので、設定を無効にしたときは、この拒否の文そのものが作られません。ポリシーの中身が、利用者の選択によってきちんと変わります。

## まとめ
- `Deny` の文を使うと、ほかの許可より強い制限を表せます。
- `dynamic` で「1 回作るかどうか」を条件で決めると、設定に応じた文を作れます。
- 暗号化の条件は、`StringNotEquals` で「許可された値以外」を表すと分かりやすくなります。

