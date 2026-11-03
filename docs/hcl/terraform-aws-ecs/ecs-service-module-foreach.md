---
title: "ECS サービスを、module と for_each でサービスごとに作る"
description: "terraform-aws-ecs の service モジュールの呼び出し。利用者の services マップを for_each に渡し、作成フラグとサービスごとの設定を子モジュールへ渡す書き方。"
language: hcl
project: "terraform-aws-ecs"
repo: https://github.com/terraform-aws-modules/terraform-aws-ecs
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "135c225c75c7f0044966329c55ad8d647b358a57"
file: main.tf
lines: [96, 104]
format: 2
function: "module \"service\""
difficulty: 2
tags: ["設計パターン", "API設計"]
---

## ひとことで
この ECS のモジュールは、利用者が `services` という名前付きのマップで指定したサービスを、1 件ずつ子モジュールとして作ります。`for_each` によって、サービスの名前がそのままモジュールの識別子になるので、追加や削除が、ほかのサービスに影響しません。

## コード
```hcl:line-numbers=96
module "service" {
  source = "./modules/service"

  for_each = var.create && var.services != null ? var.services : {}

  create         = each.value.create
  create_service = each.value.create_service
  region         = var.region

```

## 前提知識
- ECS のサービス: タスク（コンテナの実行単位）を、指定した数だけ動かし続ける部品です。
- `module` の `for_each`: マップの要素の数だけ、子モジュールを呼び出します。`each.key` は名前、`each.value` は設定です。
- 三項演算子と `null`: `var.services != null ? ... : {}` は、値が無いときに空のマップにします。
- `var.create`: モジュール全体を作るかどうかの真偽値です。
- `source = "./modules/service"`: 同じリポジトリの中の子モジュールを指します。

## 何をしているか
### 1. 作る条件とサービスの一覧を決める
```hcl:line-numbers=99
  for_each = var.create && var.services != null ? var.services : {}
```

`var.create && var.services != null` が真のときだけ、`services` のマップを使います。それ以外は空のマップになり、サービスは作られません。`null` の判定と、作成フラグを 1 つの式にまとめています。

### 2. 子モジュールに作成フラグを渡す
```hcl:line-numbers=101
  create         = each.value.create
  create_service = each.value.create_service
```

`create = each.value.create` と `create_service = each.value.create_service` は、サービスごとの指定を子モジュールに渡します。全体の作成フラグとは別に、個別に作る・作らないを決められます。

### 3. 共通の設定を渡す
```hcl:line-numbers=103
  region         = var.region
```

`region = var.region` のように、全体で共通の値は、すべての子モジュールに同じ値で渡します。サービスごとの違いは `each.value` に、共通の値は親の変数に、と役割を分けています。

## ここがすごい
サービスを 1 件ずつモジュールに分けると、それぞれのサービスの細かいリソースの作り方を、子モジュールに閉じ込められます。親は、マップの形で一覧を渡すだけなので、サービスの数が増えても、親の構造は変わりません。

また、キーがモジュールの識別子になるので、サービスを 1 つ消しても、残りのサービスの作り直しは起きません。`for_each` の利点が、そのまま働いています。

## まとめ
- `module` と `for_each` を組み合わせると、サービスごとに部品を作れます。
- 共通の値と個別の値を、親の変数と `each.value` に分けると、読みやすくなります。
- キーで区別すると、一部の削除が他のサービスに影響しません。
