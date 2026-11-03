---
title: "プロキシの種類を、指定が無ければ APPMESH にする"
description: "terraform-aws-ecs-alb-service-task の proxy_configuration。プロキシの設定があるときだけブロックを作り、type が無ければ APPMESH を既定にする。"
language: hcl
project: "terraform-aws-ecs-alb-service-task"
repo: https://github.com/cloudposse/terraform-aws-ecs-alb-service-task
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "3257ea5cc24eb4f39a3c134828951530b2c3e225"
file: main.tf
lines: [74, 81]
format: 2
function: "resource \"aws_ecs_task_definition\"（dynamic \"proxy_configuration\" と lookup）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
ECS のタスクには、通信を仲介するプロキシを付けられます。プロキシの種類は、`APPMESH` という既定の種類を持っています。このコードは、プロキシの設定が無ければブロックを作らず、種類が書かれていなければ既定の `APPMESH` を使います。

## コード
```hcl:line-numbers=74
  dynamic "proxy_configuration" {
    for_each = var.proxy_configuration == null ? [] : [var.proxy_configuration]
    content {
      type           = lookup(proxy_configuration.value, "type", "APPMESH")
      container_name = proxy_configuration.value.container_name
      properties     = proxy_configuration.value.properties
    }
  }
```

## 前提知識
- `dynamic` ブロック: 条件に応じてブロックを作るか決めます。`for_each` が空ならブロックは作られません。
- `lookup(マップ, キー, 既定値)`: キーが無ければ既定値を返します。
- App Mesh: AWS のサービスメッシュです。プロキシの種類の既定値として使われています。

## 何をしているか
### 1. 設定が無ければ、ブロックを作らない

```hcl:line-numbers=75
    for_each = var.proxy_configuration == null ? [] : [var.proxy_configuration]
```

`var.proxy_configuration` が `null` なら、空のリストを回すので、プロキシのブロックは作られません。設定があれば、その一つだけを回します。

### 2. 種類は、無ければ APPMESH にする

```hcl:line-numbers=77
      type           = lookup(proxy_configuration.value, "type", "APPMESH")
```

`type` が書かれていなければ、`lookup` が `"APPMESH"` を返します。利用者は、種類を書かなくても、よく使われる構成で動きます。

## ここがすごい
「設定が無ければ何もしない」と「種類が無ければ既定を使う」を、二つの仕組みで組み合わせています。ブロックの有無と、ブロックの中身の既定値を、別々の規則で決めている点が読みどころです。

## まとめ
- `dynamic` の `for_each` で、設定の有無をブロックの有無に変えられます。
- `lookup` の既定値で、省略された項目を補えます。
- 設定の既定値は、よく使われる構成に合わせると利用者が迷いません。
