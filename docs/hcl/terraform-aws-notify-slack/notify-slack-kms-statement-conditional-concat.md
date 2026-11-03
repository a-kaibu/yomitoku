---
title: "KMS の権限を、鍵があるときだけ policy に足す"
description: "terraform-aws-notify-slack の aws_iam_policy_document。concat で固定の権限に、kms_key_arn が空でないときだけ復号の権限を追加する。"
language: hcl
project: "terraform-aws-notify-slack"
repo: https://github.com/terraform-aws-modules/terraform-aws-notify-slack
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "a7765ac0a547f95c8aa48459f84077be8562c0f7"
file: main.tf
lines: [42, 50]
format: 2
function: "data \"aws_iam_policy_document\" \"lambda\"（dynamic \"statement\" と concat）"
difficulty: 2
tags: ["API設計", "セキュリティ"]
---

## ひとことで
Lambda に付ける権限は、常に必要なものと、鍵を使うときだけ必要なものに分かれます。このコードは、鍵の ARN が空でないときだけ、KMS の復号の権限を policy に加えています。権限の一覧を、`concat` でつないでから `dynamic` で回しています。

## コード
```hcl:line-numbers=42
  dynamic "statement" {
    for_each = concat([local.lambda_policy_document,
    local.lambda_policy_document_securityhub], var.kms_key_arn != "" ? [local.lambda_policy_document_kms] : [])
    content {
      sid       = statement.value.sid
      effect    = statement.value.effect
      actions   = statement.value.actions
      resources = statement.value.resources
    }
```

## 前提知識
- `aws_iam_policy_document`: IAM の policy を HCL で書くためのデータソースです。JSON を作ってくれます。
- `concat(リスト1, リスト2)`: リストを順番につないで、一つのリストにします。
- `dynamic "statement"`: 権限の文を、リストの要素の数だけ作ります。

## 何をしているか
### 1. 必ず使う権限を並べる

```hcl:line-numbers=43
    for_each = concat([local.lambda_policy_document,
    local.lambda_policy_document_securityhub], var.kms_key_arn != "" ? [local.lambda_policy_document_kms] : [])
```

ログの書き込みと Security Hub の権限は、常に含まれます。この 2 つは、まず `concat` の最初のリストになります。

### 2. 鍵があるときだけ、復号の権限を足す

```hcl:line-numbers=44
    local.lambda_policy_document_securityhub], var.kms_key_arn != "" ? [local.lambda_policy_document_kms] : [])
```

`var.kms_key_arn` が空文字でなければ、KMS の復号の権限を `[]` の代わりに入れます。空なら空のリストが足されるので、文は増えません。

### 3. 権限の文を、一つずつ作る

```hcl:line-numbers=45
    content {
      sid       = statement.value.sid
      effect    = statement.value.effect
      actions   = statement.value.actions
      resources = statement.value.resources
```

`dynamic` で、つながったリストを一つずつ回し、`statement` を作ります。権限の追加の仕組みは、リストを増やすだけで済みます。

## ここがすごい
条件付きの権限を、`if` の分岐ではなく空のリストで表しています。`concat` の第二引数に `[]` を渡せば、その権限は無かったことになります。権限の数が変わっても、文を書き換える必要がありません。

## まとめ
- 条件付きの要素は、`cond ? [x] : []` の形で表すと、`concat` でそのまま足せます。
- `dynamic` は、リストの数だけ文を作るので、権限の増減に強くなります。
- 常に必要な権限と、条件付きの権限を分けて書くと、意図が読み取りやすくなります。
