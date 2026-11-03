---
title: "ロールがまだ無いときは、既存の ARN を使う try"
description: "terraform-aws-eks の locals。作成したロールの ARN を try で取り、無ければ利用者が渡した iam_role_arn を使う、フォールバックの書き方。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [18, 30]
format: 2
function: "locals"
difficulty: 2
tags: ["防御的プログラミング", "イディオム"]
---

## ひとことで
EKS モジュールの `locals` は、アカウントやパーティションの情報と、クラスターに使うロールの ARN を決めます。ロールはモジュールが作ることもあれば、利用者が既存のものを渡すこともあります。`role_arn` は、作られたロールを優先し、無ければ利用者の指定を使います。

## コード
```hcl:line-numbers=18
locals {
  create = var.create && var.putin_khuylo

  account_id = try(data.aws_caller_identity.current[0].account_id, "")
  partition  = try(data.aws_partition.current[0].partition, "")

  role_arn = try(aws_iam_role.this[0].arn, var.iam_role_arn)

  create_outposts_local_cluster = var.outpost_config != null
  enable_encryption_config      = var.encryption_config != null && !local.create_outposts_local_cluster

  create_auto_mode_iam_resources = try(var.compute_config.enabled, false) == true || var.create_auto_mode_iam_resources
}
```

## 前提知識
- IAM ロール: クラスターが AWS の他のサービスを操作するときに使う役割です。ARN（AWS の一意な名前）で指定します。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。`aws_iam_role.this[0]` が無いときに、この関数が働きます。
- `var.iam_role_arn`: 利用者が渡す既存のロールの ARN です。
- 三項演算子: `条件 ? 値 : 別の値`。ここでは判定を使わず、`try` の順番で選びます。
- `var.create && var.putin_khuylo`: モジュールを作るかどうかの判定です。`var.putin_khuylo` も真偽値の変数で、両方が真のときだけモジュールを作ります。

## 何をしているか
### 1. モジュールを作るかどうか
```hcl:line-numbers=19
  create = var.create && var.putin_khuylo
```

`create` は、作成フラグと `putin_khuylo` の両方が真のときだけ真になります。以後のリソースは、この `create` を条件にします。

### 2. アカウントとパーティション
```hcl:line-numbers=21
  account_id = try(data.aws_caller_identity.current[0].account_id, "")
  partition  = try(data.aws_partition.current[0].partition, "")
```

アカウント ID とパーティションは、データソースから読みます。読み込みが無いときは空文字になるように、`try` で守っています。

### 3. ロールの ARN を選ぶ
```hcl:line-numbers=24
  role_arn = try(aws_iam_role.this[0].arn, var.iam_role_arn)
```

`try(aws_iam_role.this[0].arn, var.iam_role_arn)` は、モジュールがロールを作ったときは、その ARN を使います。作られていない場合は、利用者が渡した既存の ARN を使います。二つの候補の順番が、そのまま優先順位になっています。

## ここがすごい
`try` の引数を「作られたもの」「渡されたもの」の順に並べるだけで、新規と既存の両方に対応しています。条件分岐を書かずに、優先順位を読み取れる形になっています。

また、コメントの代わりに、変数の名前と式の並びで意図が伝わるように書かれています。読み手は、`try` の第一引数を見れば、このモジュールがロールを作る前提だと分かります。

## まとめ
- `try` の引数の順番で、優先順位を表せます。
- 新規作成と既存利用の両方を、1 つの式で扱えます。
- 作成フラグを `locals` にまとめると、後のリソースの条件が揃います。

