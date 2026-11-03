---
title: "KMS 鍵の管理者を、指定が無ければ実行している人にする"
description: "terraform-aws-eks の暗号化鍵。鍵の説明は coalesce で既定の文を入れ、鍵の管理者は coalescelist で、指定が無ければ実行者の発行元 ARN を使う。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [416, 416]
format: 2
function: "module \"kms\"（key_administrators・description）"
difficulty: 2
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
EKS のクラスターは、Secrets（Kubernetes の秘密情報）を暗号化するための KMS 鍵を、一緒に作れます。その鍵を管理できる人を指定しないと、後から鍵の設定を変えられなくなることがあります。このコードは、利用者が管理者を指定しなければ、今この Terraform を実行している人の IAM ロールを管理者にします。

## コード
```hcl:line-numbers=416
  key_administrators        = coalescelist(var.kms_key_administrators, [try(data.aws_iam_session_context.current[0].issuer_arn, "")])
```

## 前提知識
- KMS 鍵の管理者（key administrator）: 鍵のポリシーを変えたり、鍵を削除したりできる人（ロール）です。
- 鍵の利用者（key user）: 鍵で暗号化や復号ができる人です。管理者とは別に決めます。
- 発行元 ARN（issuer_arn）: 現在の作業が、どの IAM ロールから来ているかを表す ARN です。`aws_iam_session_context` のデータソースで取れます。
- `coalescelist(A, B)`: 最初に空でないリストを返します。
- `try(データ, 代わり)`: データの読み取りに失敗したら、代わりの値を使います。

## 何をしているか
### 1. 管理者の指定を、そのまま使う

```hcl:line-numbers=416
  key_administrators        = coalescelist(var.kms_key_administrators, [try(data.aws_iam_session_context.current[0].issuer_arn, "")])
```

`kms_key_administrators` にリストが入っていれば、それを使います。空なら、2 番目の候補の、現在の実行者の発行元 ARN を 1 要素のリストにして使います。

### 2. 取れないときは空文字

`try(..., "")` の内側は、実行者の情報を読み取る処理です。読み取りが失敗したとき（例えば、データソースが作られていないとき）は、空文字が入ります。その場合は、管理者が空のリストになる、という結果になります。

### 3. 説明文にも、既定の文を入れる

同じファイルの `description` は、`coalesce(var.kms_key_description, "${var.name} cluster encryption key")` のように、クラスター名を含む既定の説明を使います。鍵の一覧を見るときに、どのクラスターの鍵か分かるようにするためです。

## ここがすごい
鍵の管理者を、利用者の指定と「今の実行者」で補うのは、とても実用的です。最低限、Terraform を実行した人が、後で鍵を触れる状態になります。管理者を誰にもしないまま鍵を作ると、鍵を変更できなくなるので、その事故を防いでいます。

また、`coalescelist` は、説明文の `coalesce` と同じ考え方を、リストに広げたものです。どちらも「指定が無ければ既定の値」で統一されていて、読み手は同じ目で式を読めます。

## まとめ
- `coalescelist` で、指定が無いときに既定のリストを使えます。
- 実行者の情報を `try` で読むと、取れなかったときも安全な空の値になります。
- 管理者と利用者を分けて決めると、鍵の権限を細かく管理できます。
