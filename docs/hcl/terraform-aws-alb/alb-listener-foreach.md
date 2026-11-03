---
title: "リスナーを名前付きの map から for_each で作る"
description: "terraform-aws-alb のリスナー。利用者の listeners を for 式で絞り込み、作成フラグが真のときだけ、キーの名前でリスナーを 1 件ずつ作る書き方。"
language: hcl
project: "terraform-aws-alb"
repo: https://github.com/terraform-aws-modules/terraform-aws-alb
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "6c6e48c10d450d01cf6715346e926df0b858efc2"
file: main.tf
lines: [124, 130]
format: 2
function: "resource \"aws_lb_listener\""
difficulty: 1
tags: ["データ構造", "API設計"]
---

## ひとことで
ALB（Application Load Balancer）のリスナーは、どのポートで受けるかを決める部品です。このモジュールは、利用者が `listeners` という名前付きのマップで渡したリスナーを、`for_each` で 1 件ずつ作ります。キーの名前が、そのままリソースの名前になります。

## コード
```hcl:line-numbers=124
resource "aws_lb_listener" "this" {
  for_each = { for k, v in var.listeners : k => v if local.create }

  region = var.region

  alpn_policy     = each.value.alpn_policy
  certificate_arn = each.value.certificate_arn
```

## 前提知識
- リスナー: ロードバランサーが、どのプロトコルとポートでリクエストを受けるかを決める設定です。
- `for_each`: マップの要素の数だけ、リソースを作ります。キーは管理上の名前です。
- `for k, v in マップ : k => v if 条件`: マップを絞り込み、キーと値をそのまま残す `for` 式です。
- `each.value`: 今のリスナーの設定です。`alpn_policy` や `certificate_arn` などの項目を持ちます。
- `local.create`: モジュールを作るかどうかを表す真偽値です。
- `alpn_policy`: TLS の接続で使う ALPN（アプリケーション層のプロトコル交渉）の方式です。

## 何をしているか
### 1. 作成フラグで絞り込む
```hcl:line-numbers=125
  for_each = { for k, v in var.listeners : k => v if local.create }
```

`{ for k, v in var.listeners : k => v if local.create }` は、利用者のリスナーの一覧を読み、モジュールを作るときだけ残します。作らない場合は空のマップになり、リスナーは 1 つも作られません。

### 2. リスナーの設定を移す
```hcl:line-numbers=129
  alpn_policy     = each.value.alpn_policy
  certificate_arn = each.value.certificate_arn
```

`alpn_policy` と `certificate_arn` は、利用者が書いた値をそのまま渡します。TLS を使わないリスナーでは、これらは省略されて `null` になります。`region` は、モジュール全体で同じ値を使うために渡しています。

## ここがすごい
リスナーにキーを付けておくと、利用者は「http」「https」などの名前で、リスナーを区別できます。キーは管理上の名前なので、利用者はリスナーを名前で区別できます。リスナーの作り直しが、ほかのリスナーに影響しないという意味でも、キーは大切です。

また、`for` 式の `if` で作成フラグを確かめているので、モジュール全体を作らないときは、リスナーに関する処理も全部止まります。条件の書き方が 1 か所にまとまっています。

## まとめ
- `for_each` にマップを渡すと、名前付きのリソースを作れます。
- `for` 式の `if` で、作成フラグを絞り込みに使えます。
- キーを意味のある名前にすると、後の参照がしやすくなります。

