---
title: "DynamoDB のロック表は、容量の指定を課金方式で切り替える"
description: "terraform-aws-tfstate-backend の DynamoDB テーブル。課金方式が PROVISIONED のときだけ読み書きの容量を送り、オンデマンドでは null にする。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: main.tf
lines: [279, 284]
format: 2
function: "resource \"aws_dynamodb_table\"（with_server_side_encryption）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Terraform の状態を、複数の人が同時に書かないように、DynamoDB のテーブルでロックを取ります。このテーブルの課金方式には、使った分だけ払うオンデマンドと、容量を決めて払うプロビジョンドの 2 種類があります。容量の指定はプロビジョンドのときだけ意味を持つので、このコードは課金方式で値を切り替えます。

## コード
```hcl:line-numbers=279
  count                       = local.dynamodb_enabled ? 1 : 0
  name                        = local.dynamodb_table_name
  billing_mode                = var.billing_mode
  read_capacity               = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity              = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
  deletion_protection_enabled = var.deletion_protection_enabled
```

## 前提知識
- DynamoDB のテーブル: AWS のキーバリュー型のデータベースです。
- 課金方式（billing_mode）: `PAY_PER_REQUEST`（オンデマンド）か `PROVISIONED`（容量を指定）を選びます。
- 読み取り・書き込みの容量（read/write capacity）: 1 秒あたりに扱える量の上限です。プロビジョンドのときにだけ指定します。
- `deletion_protection_enabled`: 誤って削除されないように守る設定です。
- 三項演算子: 条件に応じて、値か `null` を選びます。

## 何をしているか
### 1. テーブルの名前と課金方式を決める

```hcl:line-numbers=280
  name                        = local.dynamodb_table_name
  billing_mode                = var.billing_mode
```

名前はモジュールが組み立てた値、課金方式は利用者の指定です。ここでは、どちらの課金方式でも同じテーブルを作ります。

### 2. 容量は、プロビジョンドのときだけ送る

```hcl:line-numbers=282
  read_capacity               = var.billing_mode == "PROVISIONED" ? var.read_capacity : null
  write_capacity              = var.billing_mode == "PROVISIONED" ? var.write_capacity : null
```

課金方式が `PROVISIONED` のときは、利用者が書いた容量を使います。それ以外のとき（オンデマンドのとき）は `null` にします。オンデマンドで容量を送ると、AWS がエラーを返すため、この判定が必要です。

### 3. 削除の保護は、利用者の値のまま

```hcl:line-numbers=284
  deletion_protection_enabled = var.deletion_protection_enabled
```

削除の保護は、課金方式とは関係なく使えるので、そのまま渡します。

## ここがすごい
課金方式という 1 つの選択で、関係する 2 つの属性が一緒に決まるようにしています。利用者は、オンデマンドにするかどうかを決めるだけで、容量の書き忘れや、不要な容量の指定を避けられます。

また、同じ判定を読み書きの両方に使っているので、どちらか一方だけが送られる、という不整合が起きません。判定を揃えて書いているのが、読みやすさにもつながっています。

## まとめ
- 関連する属性は、同じ判定で一緒に切り替えると、不整合を防げます。
- 課金方式に応じて、有効な値だけを送ると、AWS のエラーを避けられます。
- 削除の保護のような独立した設定は、判定に関係なくそのまま渡します。
