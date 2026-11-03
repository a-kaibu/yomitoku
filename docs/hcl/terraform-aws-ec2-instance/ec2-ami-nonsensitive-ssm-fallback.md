---
title: "AMI の ID を、指定か SSM の値から選ぶ"
description: "terraform-aws-ec2-instance の ami。利用者の指定を優先し、無ければ SSM パラメータの値を nonsensitive で読んで使う。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [8, 8]
format: 2
function: "locals（ami の coalesce と try）"
difficulty: 3
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
EC2 の AMI は、利用者が ID を直接指定するか、SSM パラメータに入った最新の ID を使うかのどちらかです。このコードは、指定があればそれを使い、無ければ SSM の値を読みます。`nonsensitive` は、値を機密として扱わずに、そのまま渡すための関数です。

## コード
```hcl:line-numbers=8
  ami = try(coalesce(var.ami, try(nonsensitive(data.aws_ssm_parameter.this.value), null)), null)
```

## 前提知識
- SSM パラメータ: AWS Systems Manager に保存する値です。AMI の最新 ID を保存しておく使い方が一般的です。
- `nonsensitive(値)`: Terraform が機密として扱う値を、通常の値に変えます。ここでは、SSM の値を比べたり渡したりできるようにします。
- `coalesce` と `try`: 最初に使える値を選ぶ、既定の書き方です。

## 何をしているか
### 1. SSM の値は、機密として扱いを外す

```hcl:line-numbers=8
  ami = try(coalesce(var.ami, try(nonsensitive(data.aws_ssm_parameter.this.value), null)), null)
```

`data.aws_ssm_parameter.this.value` は、Terraform が機密として扱うことがあります。`nonsensitive` で通常の値に変えると、`coalesce` の中で扱えます。

### 2. 指定が無ければ、SSM の値を使う

`coalesce` は、利用者が指定した `var.ami` を先に選びます。指定が無ければ SSM の値を使い、それも読めなければ `try` が `null` を返します。

## ここがすごい
「指定」「自動で探す」「失敗時は null」という三段の選択を、一行で表しています。機密の扱いを、必要な一か所だけで外しているので、ほかの場所には影響しません。

## まとめ
- `nonsensitive` は、必要な値だけに使うと安全性を保てます。
- `coalesce` で、指定と自動の優先順位を一行で書けます。
- 外部の値は、`try` で読めなかった場合の道を用意しておくと安心です。
