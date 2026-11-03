---
title: "HCL の入れ子のマップから、jsonencode でポリシーを作る"
description: "terraform-aws-eks の暗号化ポリシー。JSON の形をそのまま HCL のマップで書き、jsonencode で文字列にする書き方。名前に prefix を付けるかどうかの切り替えも含む。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [642, 656]
format: 2
function: "resource \"aws_iam_policy\"（encryption・policy）"
difficulty: 2
tags: ["API設計", "イディオム"]
---

## ひとことで
EKS のクラスターが、KMS の鍵を使って Secrets などを暗号化するために、IAM ポリシーを作ります。このポリシーの本文は、`jsonencode` 関数で、HCL のマップから JSON の文字列に変換しています。JSON の書式を手で書かずに済むので、読み手にも書き手にも分かりやすい形です。

## コード
```hcl:line-numbers=642
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ListGrants",
          "kms:DescribeKey",
        ]
        Effect   = "Allow"
        Resource = var.create_kms_key ? module.kms.key_arn : var.encryption_config.provider_key_arn
      },
    ]
  })
```

## 前提知識
- IAM ポリシーの JSON: `Version` と `Statement` を持つ文書です。`Statement` は文の一覧で、それぞれに `Effect`、`Action`、`Resource` を書きます。
- `jsonencode(値)`: HCL のマップやリストを、JSON の文字列に変換する関数です。
- `Effect = "Allow"`: 許可を表します。
- `Action`: 許可する操作のリストです。ここでは KMS の暗号化と復号などです。
- `Resource`: 操作の対象です。ここでは KMS の鍵の ARN を指定します。
- 三項演算子: `条件 ? 値1 : 値2` で、モジュールが作った鍵か、利用者が渡した鍵かを選びます。

## 何をしているか
### 1. ポリシーの本文を HCL で書く
```hcl:line-numbers=642
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
```

`jsonencode({ Version = ..., Statement = [...] })` の形で、ポリシーの本文を書きます。JSON の `{` や `"` を書く必要がなく、`Version` と `Statement` は HCL の項目として並びます。

### 2. 操作の一覧を書く
```hcl:line-numbers=646
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ListGrants",
          "kms:DescribeKey",
        ]
        Effect   = "Allow"
```

`Action` には、KMS の 4 つの操作を書きます。暗号化、復号、付与の一覧、鍵の説明の取得です。鍵の暗号化と復号、付与、説明の取得という、鍵を扱う操作を並べています。

### 3. 対象の鍵を選ぶ
```hcl:line-numbers=653
        Resource = var.create_kms_key ? module.kms.key_arn : var.encryption_config.provider_key_arn
```

`Resource` は、モジュールが鍵を作るときは `module.kms.key_arn`、そうでなければ利用者が渡した `provider_key_arn` を使います。作る場合と既存の鍵を使う場合の両方を、1 つの式で扱っています。

## ここがすごい
JSON をそのまま文字列で書くと、括弧や引用符の誤りが起きやすく、変数を埋め込むのも面倒です。`jsonencode` は、HCL の値として書いた内容を、必ず正しい JSON に変換します。

また、`Resource` の三項演算子によって、鍵の出所が違っても、ポリシーの書き方は変わりません。利用者の選択を、1 行の条件に閉じ込めています。

## まとめ
- `jsonencode` で、HCL のマップからポリシーの JSON を作れます。
- 手書きの JSON と違い、括弧や引用符の誤りが起きにくくなります。
- 三項演算子で参照先を切り替えると、ポリシーの形は変えずに済みます。

