---
title: "役割の関連付けを、module の for_each で 1 件ずつ作る"
description: "terraform-aws-rds の db_instance_role_association。利用者が指定した機能名と IAM ロールのマップを for 式で絞り込み、子モジュールを for_each で呼び出す書き方。"
language: hcl
project: "terraform-aws-rds"
repo: https://github.com/terraform-aws-modules/terraform-aws-rds
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "175da043429cbbe41c512f976105719f6d0e538c"
file: main.tf
lines: [173, 182]
format: 2
function: "module \"db_instance_role_association\""
difficulty: 2
tags: ["設計パターン", "API設計"]
---

## ひとことで
RDS のインスタンスには、AWS の機能（S3 へのデータの取り込みや、Lambda の呼び出しなど）を使うための IAM ロールを関連付けられます。このモジュールは、その関連付けを 1 件ごとに子モジュールとして作ります。機能名がキーになるので、関連付けを追加しても、ほかの関連付けには影響しません。

## コード
```hcl:line-numbers=173
module "db_instance_role_association" {
  source = "./modules/db_instance_role_association"

  for_each = { for k, v in var.db_instance_role_associations : k => v if var.create_db_instance }

  feature_name           = each.key
  role_arn               = each.value
  db_instance_identifier = module.db_instance.db_instance_identifier
  region                 = var.region
}
```

## 前提知識
- RDS のインスタンスロール: データベースが、AWS の別のサービスを使うときに引き受ける IAM ロールです。
- `module` の `for_each`: 子モジュールを、マップの要素の数だけ呼び出します。`each.key` は機能名、`each.value` はロールの ARN です。
- `for k, v in マップ : k => v if 条件`: マップを絞り込む `for` 式です。
- `source = "./modules/..."`: 同じリポジトリの中の子モジュールを指します。
- `db_instance_identifier`: 関連付け先のデータベースの識別子です。親のモジュールの出力から受け取ります。

## 何をしているか
### 1. 作る条件を満たす関連付けだけを残す
```hcl:line-numbers=176
  for_each = { for k, v in var.db_instance_role_associations : k => v if var.create_db_instance }
```

`{ for k, v in var.db_instance_role_associations : k => v if var.create_db_instance }` は、データベースを作るときだけ、関連付けの一覧を残します。作らない場合は、子モジュールは 1 つも呼ばれません。

### 2. 機能名とロールを子モジュールに渡す
```hcl:line-numbers=178
  feature_name           = each.key
  role_arn               = each.value
```

`feature_name = each.key` で、キーを機能名として渡します。`role_arn = each.value` で、値のロールの ARN を渡します。キーと値の役割が、マップの形からそのまま読み取れます。

### 3. 親のデータベースを参照する
```hcl:line-numbers=180
  db_instance_identifier = module.db_instance.db_instance_identifier
  region                 = var.region
```

`db_instance_identifier = module.db_instance.db_instance_identifier` は、同じモジュールの中で作ったデータベースの識別子を渡します。子モジュールは、どのデータベースに関連付けるかを、この値で知ります。

## ここがすごい
機能名をキーにすると、関連付けの追加や削除が、ほかの関連付けの作り直しに影響しません。`count` で番号を振る方法と比べて、この安定性が大きな利点です。

また、子モジュールに分けたことで、関連付けの細かい設定を、その中だけに閉じ込められます。親のモジュールは、マップを渡すだけで済みます。

## まとめ
- `module` にも `for_each` を付けると、子モジュールを件数分作れます。
- キーに機能名を使うと、変更の影響を小さくできます。
- 親の出力を子に渡すと、リソース同士の関係を明示できます。

