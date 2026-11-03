---
title: "バケット名の長さを、変数の validation で止める"
description: "terraform-aws-tfstate-backend の s3_bucket_name 変数。利用者が渡した名前が 64 文字以上なら、plan の前にエラーにする validation の書き方。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: variables.tf
lines: [140, 149]
format: 2
function: "variable \"s3_bucket_name\"（validation）"
difficulty: 1
tags: ["防御的プログラミング", "文字列処理"]
---

## ひとことで
`s3_bucket_name` は、利用者が S3 バケットの名前を直接指定するための変数です。空文字のときはモジュールが名前を作りますが、値が入っているときは、その長さが 64 文字未満かを `validation` で確かめます。

## コード
```hcl:line-numbers=140
variable "s3_bucket_name" {
  type        = string
  description = "S3 bucket name. If not provided, the name will be generated from the context by the label module."
  default     = ""

  validation {
    condition     = length(var.s3_bucket_name) < 64
    error_message = "A provided S3 bucket name must be fewer than 64 characters."
  }
}
```

## 前提知識
- `variable` の `validation` ブロック: 変数の値に条件を付けます。条件が偽のときは、`error_message` を表示して、実行を止めます。
- `length(文字列)`: 文字列の文字数を返します。
- `default = ""`: 空文字は「指定がない」を表す既定値として使われています。
- S3 バケット名の上限: S3 のバケット名は、63 文字までという制限があります。
- `error_message`: エラーのときに利用者へ見せる文章です。

## 何をしているか
### 1. 型と既定値を決める
```hcl:line-numbers=141
  type        = string
  description = "S3 bucket name. If not provided, the name will be generated from the context by the label module."
  default     = ""
```

`type = string` で文字列を受け取り、`default = ""` で指定なしを表します。説明文には、指定がなければ名前がモジュールによって作られる、と書かれています。

### 2. 長さを確かめる
```hcl:line-numbers=145
  validation {
    condition     = length(var.s3_bucket_name) < 64
    error_message = "A provided S3 bucket name must be fewer than 64 characters."
  }
```

`condition = length(var.s3_bucket_name) < 64` は、空文字（長さ 0）でも通ります。それ以外は、64 文字未満のときだけ通ります。`error_message` で、制限の内容をはっきり伝えています。

## ここがすごい
空文字を「指定なし」として通し、長さの条件だけを書いているので、既定の動きを壊しません。利用者は、指定したときだけ長さの制限を意識すれば十分です。

また、エラーを `plan` の段階で出すので、AWS に長すぎる名前を送って失敗するより前に、利用者が直せます。

モジュールの側でも、名前を作るときは `substr(local.bucket_name, 0, 63)` のように 63 文字で切っています。利用者の入力の検査と、モジュールの中での安全な切り詰めを、2 段で守っている形です。

## まとめ
- 空文字を既定値にすると、「指定なし」と「指定あり」を分けられます。
- `length` と `validation` で、入力の長さを確かめられます。
- `error_message` には、制限の内容を具体的に書くと、利用者がすぐに直せます。

