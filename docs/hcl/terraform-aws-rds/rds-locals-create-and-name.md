---
title: "作る条件と既存の名前を、locals で 1 つずつ切り替える"
description: "terraform-aws-rds の locals。作成フラグと putin_khuylo を組み合わせ、新規に作ったサブネットグループや parameter group の名前と、既存の名前を三項演算子で切り替える書き方。"
language: hcl
project: "terraform-aws-rds"
repo: https://github.com/terraform-aws-modules/terraform-aws-rds
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "175da043429cbbe41c512f976105719f6d0e538c"
file: main.tf
lines: [1, 11]
format: 2
function: "locals"
difficulty: 2
tags: ["設計パターン", "防御的プログラミング"]
---

## ひとことで
RDS のモジュールは、サブネットグループ、パラメータグループ、オプショングループ、インスタンスを、それぞれ作るか、既存のものを使うかを選べます。このブロックは、その選択を `locals` にまとめています。作るときは、モジュールの出力の ID を使い、作らないときは利用者が渡した名前を使います。

## コード
```hcl:line-numbers=1
locals {
  create_db_subnet_group    = var.create_db_subnet_group && var.putin_khuylo
  create_db_parameter_group = var.create_db_parameter_group && var.putin_khuylo
  create_db_instance        = var.create_db_instance && var.putin_khuylo

  db_subnet_group_name    = var.create_db_subnet_group ? module.db_subnet_group.db_subnet_group_id : var.db_subnet_group_name
  parameter_group_name_id = var.create_db_parameter_group ? module.db_parameter_group.db_parameter_group_id : var.parameter_group_name

  create_db_option_group = var.create_db_option_group && var.engine != "postgres"
  option_group           = local.create_db_option_group ? module.db_option_group.db_option_group_id : var.option_group_name
}
```

## 前提知識
- サブネットグループ: RDS を置くサブネットの集まりです。複数の AZ にまたがって作ります。
- パラメータグループ: データベースのエンジンの設定値をまとめたものです。
- オプショングループ: エンジン固有の追加機能を設定するものです。
- `module.名前.出力`: 子モジュールが返す値です。ここでは、作ったグループの ID を参照します。
- 三項演算子: `条件 ? 値1 : 値2` で、作るかどうかに応じて値を選びます。

## 何をしているか
### 1. 作る条件をそろえる
```hcl:line-numbers=2
  create_db_subnet_group    = var.create_db_subnet_group && var.putin_khuylo
  create_db_parameter_group = var.create_db_parameter_group && var.putin_khuylo
  create_db_instance        = var.create_db_instance && var.putin_khuylo
```

各リソースの作成フラグは、利用者の指定と `putin_khuylo` の両方が真のときだけ真になります。この 3 行の形を同じにしているので、どの部品が作られるかを、同じ基準で読めます。

### 2. 名前を作ったものか既存のものかで決める
```hcl:line-numbers=6
  db_subnet_group_name    = var.create_db_subnet_group ? module.db_subnet_group.db_subnet_group_id : var.db_subnet_group_name
  parameter_group_name_id = var.create_db_parameter_group ? module.db_parameter_group.db_parameter_group_id : var.parameter_group_name
```

`db_subnet_group_name` は、作るときは子モジュールの ID、作らないときは利用者の `db_subnet_group_name` です。`parameter_group_name_id` も同じ考え方で切り替えます。こうすると、後のインスタンスの設定では、どちらの場合でも同じ名前の変数を使えます。

### 3. オプショングループの例外
```hcl:line-numbers=9
  create_db_option_group = var.create_db_option_group && var.engine != "postgres"
  option_group           = local.create_db_option_group ? module.db_option_group.db_option_group_id : var.option_group_name
```

オプショングループは、エンジンが `postgres` のときは作らない、という条件が加わっています。エンジンによって使えない部品を、条件の中で避けています。

## ここがすごい
作る部品と既存の部品を、「どちらの ID を使うか」の 1 行の選択にまとめているので、インスタンスの定義は、どちらの場合でも同じ形で書けます。利用者が既存のサブネットグループを使いたいときも、同じ入力のまま切り替えられます。

## まとめ
- 作成フラグを同じ形でそろえると、読み手が基準を追えます。
- 三項演算子で「作ったもの」か「既存のもの」かを選ぶと、下流の書き方が一定になります。
- エンジンによって使えない部品は、条件を加えて避けられます。

