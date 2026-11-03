---
title: "サービス名を、利用者の名前かキーのどちらかにする coalesce"
description: "terraform-aws-ecs の ECS サービス。利用者が name を書けば、その値を使い、書かなければマップのキーを使う coalesce の書き方と、for_each の関係。"
language: hcl
project: "terraform-aws-ecs"
repo: https://github.com/terraform-aws-modules/terraform-aws-ecs
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "135c225c75c7f0044966329c55ad8d647b358a57"
file: main.tf
lines: [120, 130]
format: 2
function: "module \"service\"（for_each の各サービス）"
difficulty: 1
tags: ["API設計", "イディオム"]
---

## ひとことで
ECS のサービスは、利用者がマップのキーで名前を付け、必要なら `name` で別の名前を指定します。`coalesce` によって、`name` が空のときはキーを使います。この部分は、サービスごとの設定を子モジュールに渡す、冒頭の一覧です。

## コード
```hcl:line-numbers=120
  enable_execute_command             = each.value.enable_execute_command
  force_delete                       = each.value.force_delete
  force_new_deployment               = each.value.force_new_deployment
  health_check_grace_period_seconds  = each.value.health_check_grace_period_seconds
  launch_type                        = each.value.launch_type
  load_balancer                      = each.value.load_balancer
  name                               = coalesce(each.value.name, each.key)
  assign_public_ip                   = each.value.assign_public_ip
  security_group_ids                 = each.value.security_group_ids
  subnet_ids                         = each.value.subnet_ids
  ordered_placement_strategy         = each.value.ordered_placement_strategy
```

## 前提知識
- ECS（Elastic Container Service）: コンテナを動かす AWS のサービスです。サービスは、同じタスクを一定数だけ動かし続けます。
- `coalesce(値1, 値2)`: 最初に `null` でも空文字でもない値を返します。
- `each.value.name` と `each.key`: `for_each` の今の要素の値と、キーです。
- `each.value.launch_type`: `EC2` か `FARGATE` のような起動方式です。
- `module "service"` の `for_each`: サービスの数だけ、子モジュールを呼び出します。

## 何をしているか
### 1. 名前を決める
```hcl:line-numbers=126
  name                               = coalesce(each.value.name, each.key)
```

`name = coalesce(each.value.name, each.key)` は、利用者が `name` を書けばその値を、書かなければキーを使います。キーは、利用者がマップに付けた名前なので、名前を書かなくても一意なサービス名になります。

### 2. 他の設定をそのまま渡す
```hcl:line-numbers=120
  enable_execute_command             = each.value.enable_execute_command
  force_delete                       = each.value.force_delete
  force_new_deployment               = each.value.force_new_deployment
  health_check_grace_period_seconds  = each.value.health_check_grace_period_seconds
  launch_type                        = each.value.launch_type
  load_balancer                      = each.value.load_balancer
```

`enable_execute_command`、`force_delete`、`launch_type` などは、利用者の値を変換せずに渡します。`load_balancer` も同じく、オブジェクトのまま子モジュールへ渡されます。モジュールの中では、値の加工をほとんどしていません。

### 3. ネットワークの設定を渡す
```hcl:line-numbers=127
  assign_public_ip                   = each.value.assign_public_ip
  security_group_ids                 = each.value.security_group_ids
  subnet_ids                         = each.value.subnet_ids
  ordered_placement_strategy         = each.value.ordered_placement_strategy
```

`security_group_ids` や `subnet_ids` も、利用者が書いた一覧をそのまま渡します。`ordered_placement_strategy` も同じく、利用者の指定をそのまま通します。

## ここがすごい
同じ `coalesce` の書き方は、既定の名前を省略可能にする定番です。利用者は名前を書かずに、キーだけで設定を書けます。キーと名前の両方を持てるので、同じサービスを別の名前で作るような場合にも対応できます。

また、多くの項目をそのまま渡すことで、子モジュールの側が設定の意味を決められます。親は「橋渡し」に徹し、読み手は親の一覧を読めば、どの設定が子に届くかを一覧できます。

## まとめ
- `coalesce` で、既定のキーを名前の代わりにできます。
- 値をそのまま子モジュールに渡すと、親の役割が単純になります。
- キーを一意な名前に使うと、利用者は名前を省略できます。
