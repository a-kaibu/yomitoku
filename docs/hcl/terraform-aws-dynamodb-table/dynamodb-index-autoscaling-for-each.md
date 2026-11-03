---
title: "グローバルセカンダリインデックスごとに、スケーリングを作る"
description: "terraform-aws-dynamodb-table のインデックス用 Auto Scaling。autoscaling_indexes のキーを index 名にして for_each で作り、条件が偽なら空のマップを使う。"
language: hcl
project: "terraform-aws-dynamodb-table"
repo: https://github.com/terraform-aws-modules/terraform-aws-dynamodb-table
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b6cc515760466a455ff0acb97b16151fdca4511e"
file: autoscaling.tf
lines: [61, 69]
format: 2
function: "resource \"aws_appautoscaling_target\"（index_read）"
difficulty: 2
tags: ["データ構造", "API設計"]
---

## ひとことで
DynamoDB には、テーブルとは別に「グローバルセカンダリインデックス（GSI）」を持たせられます。GSI も読み取りの容量を Auto Scaling で増減させられます。このコードは、利用者が渡したインデックスのマップから、インデックスごとに 1 つずつスケーリングの対象を作ります。

## コード
```hcl:line-numbers=61
resource "aws_appautoscaling_target" "index_read" {
  for_each = var.create_table && var.autoscaling_enabled ? var.autoscaling_indexes : {}

  max_capacity       = each.value["read_max_capacity"]
  min_capacity       = each.value["read_min_capacity"]
  resource_id        = "table/${try(aws_dynamodb_table.autoscaled[0].name, aws_dynamodb_table.autoscaled_gsi_ignore[0].name)}/index/${each.key}"
  scalable_dimension = "dynamodb:index:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}
```

## 前提知識
- GSI（グローバルセカンダリインデックス）: テーブルの別の属性をキーにして検索するための、別の索引です。
- `for_each` にマップを渡すと、キーごとにリソースを 1 つずつ作ります。`each.key` と `each.value` で、その要素の値を使えます。
- `each.value["read_max_capacity"]`: マップの値を、キーの文字列で取り出す書き方です。
- `resource_id`: Auto Scaling が対象を識別する文字列です。インデックスの場合は `table/テーブル名/index/インデックス名` の形です。
- 三項演算子で空のマップ `{}`: 条件が偽のときは、`for_each` に何も渡さない、という書き方です。

## 何をしているか
### 1. 有効なときだけ、インデックスの一覧を使う

```hcl:line-numbers=62
  for_each = var.create_table && var.autoscaling_enabled ? var.autoscaling_indexes : {}
```

テーブルを作り、Auto Scaling が有効なときだけ、`autoscaling_indexes` のマップを使います。どちらでもなければ空のマップなので、インデックスの数だけ作るリソースは 0 個になります。

### 2. 容量の上下限は、値から読む

```hcl:line-numbers=64
  max_capacity       = each.value["read_max_capacity"]
  min_capacity       = each.value["read_min_capacity"]
```

各インデックスの読み取りの最大と最小は、利用者が書いた値をそのまま使います。インデックスごとに上限を変えたいときに、この 2 行が効きます。

### 3. resource_id に、インデックス名を入れる

```hcl:line-numbers=66
  resource_id        = "table/${try(aws_dynamodb_table.autoscaled[0].name, aws_dynamodb_table.autoscaled_gsi_ignore[0].name)}/index/${each.key}"
```

テーブルの名前は、前に見たように `try` で 2 つの候補から選びます。その後ろに `/index/` と、`each.key`（インデックスの名前）をつなげます。こうして、どのインデックスの対象かが一意に決まります。

## ここがすごい
テーブル本体の Auto Scaling と、インデックスの Auto Scaling が、同じ `try` のテーブル名を使っています。テーブルの作り方が変わっても、インデックスの対象の書き方は変える必要がありません。

また、インデックスをマップで受け取り、キーを名前として使う点も大切です。インデックスを一つ増やしても、他のインデックスのリソースは作り直されません。

## まとめ
- `for_each` にマップを渡すと、キーごとに同じ形のリソースを安全に増やせます。
- 条件が偽のときに `{}` を渡すと、リソースを 1 つも作らずに済みます。
- `"/index/${each.key}"` のように、キーを文字列の中へ埋め込むと、識別子を組み立てられます。
