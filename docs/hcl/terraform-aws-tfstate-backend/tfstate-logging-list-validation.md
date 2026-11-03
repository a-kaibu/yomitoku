---
title: "ログの設定を 1 件までに限る、list(object) の validation"
description: "terraform-aws-tfstate-backend の logging 変数。list(object) の型で受け取り、validation で件数を 1 件以下に制限する書き方。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: variables.tf
lines: [163, 174]
format: 2
function: "variable \"logging\"（validation）"
difficulty: 2
tags: ["型システム", "防御的プログラミング"]
---

## ひとことで
`logging` は、S3 のアクセスログの送り先を決める変数です。`list(object(...))` という型で、送り先のバケットと接頭辞の組を受け取ります。ただし、このモジュールは 1 件しか扱えないため、`validation` で件数が 2 件以上なら止めます。

## コード
```hcl:line-numbers=163
variable "logging" {
  type = list(object({
    target_bucket = string
    target_prefix = string
  }))
  description = "Destination (S3 bucket name and prefix) for S3 Server Access Logs for the S3 bucket."
  default     = []
  validation {
    condition     = length(var.logging) < 2
    error_message = "Only 1 bucket logging configuration can be provided."
  }
}
```

## 前提知識
- `list(object({ ... }))`: 「同じ形のオブジェクトの並び」を表す型です。`target_bucket` と `target_prefix` が、それぞれ文字列として必要です。
- `default = []`: 空のリストが既定値です。ログが不要なら、この値のままで十分です。
- `length(リスト)`: リストの件数を返します。
- `validation`: 変数に条件を付けます。`condition` が偽のとき、`error_message` で止まります。
- S3 のアクセスログ: バケットへのアクセスを記録して、別のバケットに保存する機能です。

## 何をしているか
### 1. 型の中に必要な項目を書く
```hcl:line-numbers=164
  type = list(object({
    target_bucket = string
    target_prefix = string
  }))
```

`list(object({...}))` の中で、`target_bucket` と `target_prefix` を両方とも文字列として定義しています。どちらか一方が欠けると、型のエラーになります。

### 2. 既定値とエラー時の文章を書く
```hcl:line-numbers=168
  description = "Destination (S3 bucket name and prefix) for S3 Server Access Logs for the S3 bucket."
  default     = []
```

`description` でログの送り先を説明し、`default = []` で何も指定しなければログは作られません。

### 3. 件数を確かめる
```hcl:line-numbers=170
  validation {
    condition     = length(var.logging) < 2
    error_message = "Only 1 bucket logging configuration can be provided."
  }
```

`condition = length(var.logging) < 2` は、0 件か 1 件のときに通します。2 件以上なら偽になり、`error_message` の「1 つのバケットのログ設定しか指定できません」という文章が表示されます。

## ここがすごい
リストの型で受け取ると、利用者は将来の複数対応を想定して、同じ書き方で値を書けます。しかし、このモジュールでは 1 件までという制約があるため、`validation` で制約を明示しています。型と制約を分けることで、両方の意図が読み取れます。

また、`default = []` によって、ログを使わない利用者は何も書かずに済みます。省略可能な設定を、リストの空として自然に表しています。

## まとめ
- `list(object(...))` で、同じ形の項目の並びを型として書けます。
- 型で表せない件数の制約は、`validation` で補えます。
- 既定値を空のリストにすると、省略可能な設定を素直に表現できます。

