---
title: "App Mesh のプロキシ設定を、種類の既定値付きで作る"
description: "terraform-aws-ecs-alb-service-task のタスク定義。proxy_configuration が無ければブロックを作らず、あれば種類を lookup で既定の APPMESH にする。"
language: hcl
project: "terraform-aws-ecs-alb-service-task"
repo: https://github.com/cloudposse/terraform-aws-ecs-alb-service-task
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "3257ea5cc24eb4f39a3c134828951530b2c3e225"
file: main.tf
lines: [74, 81]
format: 2
function: "resource \"aws_ecs_task_definition\"（dynamic \"proxy_configuration\"）"
difficulty: 2
tags: ["ネットワーク", "API設計"]
---

## ひとことで
ECS のタスクには、通信を中継するプロキシを付けられます。AWS App Mesh を使うときは、そのプロキシの設定が必要です。このコードは、プロキシの設定が無ければブロックを作らず、あるときは種類を `lookup` で読み、省略時は `APPMESH` にします。

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
- ECS のタスク定義: コンテナの構成や、CPU・メモリ、ネットワークの設定をまとめたものです。
- サービスメッシュ（App Mesh）: サービス間の通信を、プロキシを通して管理する仕組みです。
- プロキシ設定（proxy_configuration）: タスク内で、どのコンテナがプロキシの役割を持つかを示すブロックです。
- `container_name`: プロキシとして使うコンテナの名前です。
- `properties`: プロキシの動きを細かく決める、キーと値の組です。

## 何をしているか
### 1. 指定が無ければ、ブロックを作らない

```hcl:line-numbers=75
    for_each = var.proxy_configuration == null ? [] : [var.proxy_configuration]
```

`proxy_configuration` が `null` のときは、空のリストになるので、ブロックは作られません。プロキシを使わないタスクでは、この設定そのものが無くなります。

### 2. 種類は、既定の APPMESH にする

```hcl:line-numbers=77
      type           = lookup(proxy_configuration.value, "type", "APPMESH")
```

プロキシの `type` を、マップから読みます。書かれていなければ、既定の `APPMESH` を使います。App Mesh 以外のプロキシを使うときだけ、利用者が種類を書けば済みます。

### 3. コンテナ名と細かな設定は、そのまま渡す

`container_name` と `properties` は、利用者の値のまま渡します。プロキシが動くコンテナの名前や、その詳細は、利用者が知っているものだからです。

## ここがすごい
「App Mesh を使う」という最も多い使い方を、既定値として組み込んでいます。利用者は、プロキシの種類を書かなくても、よく使う構成をそのまま作れます。一方で、別の種類を使う利用者も、`type` を書けば上書きできます。

さらに、ブロックの有無を、`null` のときは空のリストで判定しています。前に見た記事と同じ型で、「無ければ作らない」の一貫した書き方になっています。

## まとめ
- 省略可能なブロックは、`null` のときに空のリストを使うと、作らない状態を表せます。
- `lookup` の既定値で、よく使う種類を省略できるようにすると、利用者の手間が減ります。
- 同じ型の判定を繰り返すと、読み手が書き方を覚えやすくなります。
