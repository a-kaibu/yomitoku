---
title: "ログ配信の設定を、エンジンに合うものだけ絞り込む"
description: "terraform-aws-elasticache の log_delivery_configuration。for 式で if を使い、memcached やレプリケーショングループの場合を除いて動的ブロックを作る。"
language: hcl
project: "terraform-aws-elasticache"
repo: https://github.com/terraform-aws-modules/terraform-aws-elasticache
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "41a277b73b9d375a2856886ab8469fd3f8b6d0ef"
file: main.tf
lines: [28, 37]
format: 2
function: "dynamic \"log_delivery_configuration\"（for 式の if による絞り込み）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
ElastiCache には、ログを配信する設定があります。ただし、この設定は Redis などの一部のエンジンでしか使えず、レプリケーショングループの中では別の場所で指定します。このコードは、`for` 式で条件に合う設定だけを残してから、動的ブロックを作っています。

## コード
```hcl:line-numbers=28
  dynamic "log_delivery_configuration" {
    for_each = { for k, v in var.log_delivery_configuration : k => v if var.engine != "memcached" && !local.in_replication_group }

    content {
      destination      = try(log_delivery_configuration.value.create_cloudwatch_log_group, true) && log_delivery_configuration.value.destination_type == "cloudwatch-logs" ? aws_cloudwatch_log_group.this[log_delivery_configuration.key].name : log_delivery_configuration.value.destination
      destination_type = log_delivery_configuration.value.destination_type
      log_format       = log_delivery_configuration.value.log_format
      log_type         = try(log_delivery_configuration.value.log_type, log_delivery_configuration.key)
    }
  }
```

## 前提知識
- `for` 式: 集まりの要素を一つずつ取り出して、新しい集まりを作ります。
- `{ for k, v in マップ : k => v if 条件 }`: 条件を満たすキーと値だけを残したマップを作ります。
- `dynamic`: 繰り返しのブロックを、`for_each` の要素の数だけ作ります。

## 何をしているか
### 1. 使えないエンジンとグループを除く

```hcl:line-numbers=29
    for_each = { for k, v in var.log_delivery_configuration : k => v if var.engine != "memcached" && !local.in_replication_group }
```

`if` の条件で、memcached の場合と、レプリケーショングループの中の場合を除きます。残ったものだけが、`for_each` の対象になります。

### 2. 残った設定を、ブロックに写す

```hcl:line-numbers=32
      destination      = try(log_delivery_configuration.value.create_cloudwatch_log_group, true) && log_delivery_configuration.value.destination_type == "cloudwatch-logs" ? aws_cloudwatch_log_group.this[log_delivery_configuration.key].name : log_delivery_configuration.value.destination
      destination_type = log_delivery_configuration.value.destination_type
      log_format       = log_delivery_configuration.value.log_format
      log_type         = try(log_delivery_configuration.value.log_type, log_delivery_configuration.key)
```

残った設定のキーを、ブロックの中の属性に写します。送り先は、CloudWatch Logs の作成を指定したときに、この資源の名前を使います。

## ここがすごい
絞り込みを `for` 式の中に入れると、`dynamic` の `for_each` はその結果を回すだけで済みます。どのエンジンでログを出せるかという知識を、条件として一箇所に書いています。

## まとめ
- `for` 式の `if` を使うと、動的ブロックの対象を絞れます。
- 条件はマップのキーと値の両方を見られるので、設定を一度に判定できます。
- エンジンごとの制約は、`for` 式の条件として一か所に書くと、読みやすくなります。
