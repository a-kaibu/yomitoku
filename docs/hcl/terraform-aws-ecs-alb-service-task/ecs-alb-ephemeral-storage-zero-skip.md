---
title: "一時領域の指定が 0 のときは、ブロックを作らない"
description: "terraform-aws-ecs-alb-service-task の ephemeral_storage。サイズが 0 のときは空のリストを回し、サイズがあるときだけブロックを作る。"
language: hcl
project: "terraform-aws-ecs-alb-service-task"
repo: https://github.com/cloudposse/terraform-aws-ecs-alb-service-task
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "3257ea5cc24eb4f39a3c134828951530b2c3e225"
file: main.tf
lines: [83, 88]
format: 2
function: "resource \"aws_ecs_task_definition\"（dynamic \"ephemeral_storage\"）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Fargate のタスクには、一時的な記憶領域（エフェメラルストレージ）のサイズを指定できます。指定しないときは、そのブロックをタスク定義に書き込みません。このコードは、サイズが `0` のときは空のリストを、それ以外は一つのリストを渡して、ブロックの有無を切り替えています。

## コード
```hcl:line-numbers=83
  dynamic "ephemeral_storage" {
    for_each = var.ephemeral_storage_size == 0 ? [] : [var.ephemeral_storage_size]
    content {
      size_in_gib = var.ephemeral_storage_size
    }
  }
```

## 前提知識
- エフェメラルストレージ: タスクが停止すると消える、一時的なディスク領域です。
- `dynamic` ブロック: `for_each` の要素の数だけ、ブロックを作ります。
- 空のリスト `[]`: 要素が無いので、`dynamic` はブロックを一つも作りません。

## 何をしているか
### 1. サイズが 0 なら、空のリストを渡す

```hcl:line-numbers=84
    for_each = var.ephemeral_storage_size == 0 ? [] : [var.ephemeral_storage_size]
```

`var.ephemeral_storage_size` が `0` なら、`for_each` に空のリストが渡されます。その結果、ブロックは作られません。

### 2. サイズがあれば、一つだけブロックを作る

```hcl:line-numbers=85
    content {
      size_in_gib = var.ephemeral_storage_size
    }
```

`0` 以外なら、一要素のリストになるので、ブロックが一つ作られます。その中で、サイズを `size_in_gib` に入れます。

## ここがすごい
「サイズが 0 は指定なし」という規則を、`for_each` に渡すリストの中身だけで表しています。`if` で別のブロックを書くより、ブロックの有無がはっきり分かります。

## まとめ
- `dynamic` の `for_each` を空のリストにすると、ブロックを省けます。
- 数値の `0` を指定なしとみなすと、利用者の入力が簡単になります。
- 条件を `for_each` に寄せると、ブロックの書き方が一定になります。
