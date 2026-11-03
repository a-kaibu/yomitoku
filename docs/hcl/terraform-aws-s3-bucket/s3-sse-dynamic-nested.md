---
title: "暗号化の設定を、入れ子の dynamic で任意に作る"
description: "terraform-aws-s3-bucket の server_side_encryption_configuration。rule と apply_server_side_encryption_by_default を、値があるときだけ作る二段の dynamic ブロック。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [292, 308]
format: 2
function: "resource \"aws_s3_bucket_server_side_encryption_configuration\"（dynamic \"rule\"）"
difficulty: 3
tags: ["メタプログラミング", "セキュリティ"]
---

## ひとことで
S3 バケットの既定の暗号化は、`rule` と、その中の `apply_server_side_encryption_by_default` という 2 段のブロックで指定します。このモジュールは、利用者が書いた段の数に合わせて、2 段の `dynamic` ブロックを使い、書かれていない段は作りません。

## コード
```hcl:line-numbers=292
  dynamic "rule" {
    for_each = var.server_side_encryption_configuration.rule != null ? [var.server_side_encryption_configuration.rule] : []

    content {
      bucket_key_enabled = rule.value.bucket_key_enabled

      dynamic "apply_server_side_encryption_by_default" {
        for_each = rule.value.apply_server_side_encryption_by_default != null ? [rule.value.apply_server_side_encryption_by_default] : []

        content {
          sse_algorithm     = apply_server_side_encryption_by_default.value.sse_algorithm
          kms_master_key_id = apply_server_side_encryption_by_default.value.kms_master_key_id
        }
      }
      blocked_encryption_types = rule.value.blocked_encryption_types
    }
  }
```

## 前提知識
- サーバー側の暗号化（SSE）: S3 に保存するデータを、AWS 側で暗号化する設定です。
- `sse_algorithm`: 暗号化の方式です（`AES256` や `aws:kms`）。
- `kms_master_key_id`: KMS（鍵管理サービス）の鍵を指定します。`aws:kms` のときに使います。
- `bucket_key_enabled`: KMS の呼び出し回数を減らすための設定です。
- `dynamic` の入れ子: `dynamic` の `content` の中で、別の `dynamic` を書けます。内側は外側の `content` の中を基準にします。
- `rule.value`: 外側の `dynamic` の今の要素を指します。

## 何をしているか
### 1. 外側の rule を作るかを決める
```hcl:line-numbers=292
  dynamic "rule" {
    for_each = var.server_side_encryption_configuration.rule != null ? [var.server_side_encryption_configuration.rule] : []
```

`for_each` は、`rule` の設定があれば 1 件のリスト、なければ空のリストです。`rule` ブロックは、この 1 件分だけ作られます。

### 2. 内側の既定の暗号化を作るかを決める
```hcl:line-numbers=298
      dynamic "apply_server_side_encryption_by_default" {
        for_each = rule.value.apply_server_side_encryption_by_default != null ? [rule.value.apply_server_side_encryption_by_default] : []
```

`apply_server_side_encryption_by_default` は、`rule.value` の中の値を見ます。値があれば 1 件のリストになり、内側のブロックが作られます。外側が作られていなければ、内側の `for_each` も評価されません。

### 3. 中身を移す
```hcl:line-numbers=301
        content {
          sse_algorithm     = apply_server_side_encryption_by_default.value.sse_algorithm
          kms_master_key_id = apply_server_side_encryption_by_default.value.kms_master_key_id
        }
      }
      blocked_encryption_types = rule.value.blocked_encryption_types
```

`sse_algorithm` と `kms_master_key_id` は、`apply_server_side_encryption_by_default.value` から取り出します。`blocked_encryption_types` は、`rule.value` から直接移します。段ごとに値の置き場所が違うことが、読み取りのポイントです。

## ここがすごい
2 段の `dynamic` を使うと、利用者は必要な段だけを書けます。`rule` を書かなければ、暗号化の設定そのものが作られず、AWS の既定の動きに任せられます。

また、内側の `for_each` は外側の `rule.value` を参照しているので、外側が無い場合はそもそも評価されません。入れ子の条件が、構造の中で自然に守られています。

## まとめ
- 入れ子の `dynamic` では、外側の `content` の中で内側を書けます。
- 段ごとに「作るか作らないか」を決めると、必要な設定だけを作れます。
- 値の置き場所（外側か内側か）を読み取ると、入れ子の構造が分かります。
