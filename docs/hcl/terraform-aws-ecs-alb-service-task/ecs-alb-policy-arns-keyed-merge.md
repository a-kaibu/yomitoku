---
title: "ポリシーの ARN の一覧を、キー付きのマップに変えて merge する"
description: "terraform-aws-ecs-alb-service-task の task_policy_arns_map。ARN のリストに format で一意なキーを付けてマップにし、利用者のマップと merge でつなぐ。"
language: hcl
project: "terraform-aws-ecs-alb-service-task"
repo: https://github.com/cloudposse/terraform-aws-ecs-alb-service-task
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "3257ea5cc24eb4f39a3c134828951530b2c3e225"
file: main.tf
lines: [19, 19]
format: 2
function: "locals（task_policy_arns_map の for 式と merge）"
difficulty: 3
tags: ["データ構造", "API設計"]
---

## ひとことで
タスクに付けるポリシーは、ARN のリストでも、キーと値のマップでも渡せます。Terraform の `for_each` は、キーが必要なので、このコードはリストの各要素に番号付きのキーを作っています。そのうえで、利用者のマップと `merge` でつないでいます。

## コード
```hcl:line-numbers=19
  task_policy_arns_map = merge({ for i, a in var.task_policy_arns : format("_#%v_", i) => a }, var.task_policy_arns_map)
```

## 前提知識
- `for i, a in リスト : キー => 値`: 番号と要素を同時に取り出し、マップを作ります。
- `format("_#%v_", i)`: 番号を埋め込んで、一意なキーを作ります。
- `merge(マップ1, マップ2)`: 二つのマップを一つにまとめます。同じキーがあれば、後のマップが優先されます。

## 何をしているか
### 1. リストの要素に、番号のキーを付ける

```hcl:line-numbers=19
  task_policy_arns_map = merge({ for i, a in var.task_policy_arns : format("_#%v_", i) => a }, var.task_policy_arns_map)
```

リストの各 ARN に、`_#0_`、`_#1_` のようなキーを付けて、マップにします。キーがあるので、`for_each` でそれぞれを一つの資源として扱えます。

### 2. 利用者のマップと、一つにまとめる

同じ行の `merge` で、利用者が直接書いたマップ `var.task_policy_arns_map` を後ろにつなぎます。両方の指定が、一つのマップとして扱われます。

## ここがすごい
リストで書いても、マップで書いても、最後は同じ形のマップになります。キーに記号を入れて、利用者のキーと衝突しにくくしている点も工夫です。

## まとめ
- リストを `for_each` で使うには、番号などでキーを付けてマップに変えます。
- `merge` の後ろに置いた値は、同じキーで優先されます。
- 入力の形を一つにそろえると、後の処理が単純になります。
