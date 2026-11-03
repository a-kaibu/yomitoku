---
title: "ロールの指定を、リストでも文字列でも受け付ける"
description: "terraform-aws-ecs-alb-service-task の task_role_arn。値がリストなら先頭の要素を、文字列ならそのままの値を使う try の書き方。"
language: hcl
project: "terraform-aws-ecs-alb-service-task"
repo: https://github.com/cloudposse/terraform-aws-ecs-alb-service-task
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "3257ea5cc24eb4f39a3c134828951530b2c3e225"
file: main.tf
lines: [4, 4]
format: 2
function: "locals（task_role_arn の入れ子の try）"
difficulty: 3
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
タスクのロールの指定は、リストの形でも文字列の形でも渡せるようになっています。両方の形を受け取るために、このコードは `try` の候補を三つ並べています。どの形でも、最後には文字列の値が残ります。

## コード
```hcl:line-numbers=4
  task_role_arn                   = try(var.task_role_arn[0], tostring(var.task_role_arn), "")
```

## 前提知識
- `var.task_role_arn[0]`: 変数がリストなら、先頭の要素を取り出します。文字列に `[0]` を付けると、エラーになります。
- `tostring(値)`: 値を文字列に変えます。ここでは、文字列の変数をそのまま文字列として返すために使います。
- `try(候補1, 候補2, 既定値)`: 左から順に試し、最初に成功した値を返します。

## 何をしているか
### 1. リストなら、先頭の要素を使う

```hcl:line-numbers=4
  task_role_arn                   = try(var.task_role_arn[0], tostring(var.task_role_arn), "")
```

`try` は、まず `var.task_role_arn[0]` を試します。変数がリストなら、その先頭が返ります。文字列なら、`[0]` の参照が失敗するので、次の候補に進みます。

### 2. 文字列なら、そのままの値を使う

次の候補の `tostring(var.task_role_arn)` が、文字列の値をそのまま返します。どれも失敗したときは、最後の `""` が空文字を返します。

## ここがすごい
一つの変数で、二つの形の入力を、分岐を書かずに受け取っています。「リストのときは先頭、文字列のときはそのまま」という規則が、候補の並び順だけで表されています。

## まとめ
- `try` の候補を、順番に並べると、入力の形の違いを吸収できます。
- リストの `[0]` は、文字列では失敗するので、そのまま後に続けて使えます。
- 入力の形が複数あるときは、候補の最後に安全な既定値を置くと安心です。
