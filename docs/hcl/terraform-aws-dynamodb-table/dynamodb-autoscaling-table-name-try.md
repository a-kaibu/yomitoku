---
title: "テーブルの作り方が 2 通りでも、スケーリング対象の名前を一つにする"
description: "terraform-aws-dynamodb-table の Auto Scaling 設定。通常のテーブルと GSI 無視版のどちらが作られても、try で同じテーブル名を参照する。"
language: hcl
project: "terraform-aws-dynamodb-table"
repo: https://github.com/terraform-aws-modules/terraform-aws-dynamodb-table
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b6cc515760466a455ff0acb97b16151fdca4511e"
file: autoscaling.tf
lines: [1, 9]
format: 2
function: "resource \"aws_appautoscaling_target\"（table_read）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
DynamoDB テーブルの読み取り容量を自動で増減させるには、「Auto Scaling の対象」を登録します。このモジュールでは、テーブルが 2 通りの方法のどちらで作られても同じ書き方で対象を指定できるように、`try` で名前を選んでいます。

## コード
```hcl:line-numbers=1
resource "aws_appautoscaling_target" "table_read" {
  count = var.create_table && var.autoscaling_enabled && length(var.autoscaling_read) > 0 ? 1 : 0

  max_capacity       = var.autoscaling_read["max_capacity"]
  min_capacity       = var.read_capacity
  resource_id        = "table/${try(aws_dynamodb_table.autoscaled[0].name, aws_dynamodb_table.autoscaled_gsi_ignore[0].name)}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}
```

## 前提知識
- DynamoDB: AWS のキーバリュー型のデータベースです。読み取りと書き込みの容量（キャパシティ）を決めて使います。
- Application Auto Scaling: 負荷に応じて、DynamoDB などの容量を自動で増減させる AWS の仕組みです。
- `resource_id`: 対象を識別する文字列です。DynamoDB では `table/テーブル名` のように書きます。
- `count`: 作る数を決めます。`0` のときは、そのリソースは作られません。
- `try(A, B)`: A を評価してエラーにならなければ A を、エラーになれば B を返します。
- `${...}`: 文字列の中に式の値を埋め込みます。

## 何をしているか
### 1. 作るかどうかを条件で決める

```hcl:line-numbers=2
  count = var.create_table && var.autoscaling_enabled && length(var.autoscaling_read) > 0 ? 1 : 0
```

テーブルを作る、Auto Scaling を有効にする、読み取りの設定がある、の 3 つがそろったときだけ、対象を 1 つ作ります。どれか 1 つでも欠けたら作りません。

### 2. テーブル名を、2 つの候補から選ぶ

```hcl:line-numbers=6
  resource_id        = "table/${try(aws_dynamodb_table.autoscaled[0].name, aws_dynamodb_table.autoscaled_gsi_ignore[0].name)}"
```

テーブルは、`autoscaled` と `autoscaled_gsi_ignore` という 2 つのリソースのどちらかで作られます。どちらも `count` を使うので、作られなかった方は `[0]` で参照するとエラーになります。`try` は、1 番目の `autoscaled[0].name` がエラーになったら、2 番目の `autoscaled_gsi_ignore[0].name` を使います。結果として、どちらの場合でも正しいテーブル名が入ります。

### 3. 参照先のテーブルを 1 つに決める

`resource_id` の文字列は、テーブル名を `table/` の後ろにつなげたものです。`scalable_dimension = "dynamodb:table:ReadCapacityUnits"` が、「読み取り容量を増減させる」ことを指定しています。

## ここがすごい
同じ目的のリソースを 2 種類に分けて作り、後続の設定は両方に対応させる、という書き方はとても実用的です。もし `try` を使わずに、どちらか一方を決め打ちにすると、もう一方の作り方のときに設定が必ずエラーになります。

`try` で 2 つの候補を並べると、「今作られている方」を自動で拾えます。利用者は、テーブルの作り方（GSI を無視するかどうか）を変えても、Auto Scaling の設定を書き直す必要がありません。

## まとめ
- `count = 0` で作られなかったリソースは、`[0]` で参照するとエラーになります。
- `try(A, B)` で、どちらか作られた方の値を拾えます。
- 作り方が変わっても、後ろの設定を書き換えずに済むようにすると、保守が楽になります。
