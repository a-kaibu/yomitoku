---
title: "API のルートを、条件付きの for 式でまとめて作る"
description: "terraform-aws-apigateway-v2 のルート作成。routes のマップを for 式で回し、ルートを作る条件が真のときだけ、キーごとに aws_apigatewayv2_route を作る。"
language: hcl
project: "terraform-aws-apigateway-v2"
repo: https://github.com/terraform-aws-modules/terraform-aws-apigateway-v2
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "95e6a1d56d6d761ec12c89b36b29aad03a421b2f"
file: main.tf
lines: [193, 200]
format: 2
function: "resource \"aws_apigatewayv2_route\"（this）"
difficulty: 2
tags: ["API設計", "ネットワーク"]
---

## ひとことで
API Gateway（HTTP や WebSocket の API）では、「どの URL の、どのメソッドを、どの統合先へつなぐか」を、ルートごとに決めます。このモジュールは、ルートの一覧を 1 つのマップで受け取り、条件に合うときだけ、キーごとにルートを作ります。

## コード
```hcl:line-numbers=193
resource "aws_apigatewayv2_route" "this" {
  for_each = { for k, v in var.routes : k => v if local.create_routes_and_integrations }

  region = var.region

  api_id = aws_apigatewayv2_api.this[0].id

  api_key_required           = local.is_websocket ? each.value.api_key_required : null
```

## 前提知識
- API Gateway（v2）: HTTP API や WebSocket API を、サーバーレスで公開するサービスです。
- ルート: 「リクエストの種類（例: `GET /items`）」と、それを受け取る統合先（Lambda など）の対応です。
- 統合（integration）: ルートの先で実際の処理を行う部品です。別のリソースとして作られ、ルートから参照されます。
- `for_each` と `if`: マップの要素のうち、条件に合うものだけでリソースを作る書き方です。
- `null`: 属性を設定しないことを表します。WebSocket のときだけ、値を使うといった切り替えに使います。

## 何をしているか
### 1. 作る条件を満たすルートだけを残す

```hcl:line-numbers=194
  for_each = { for k, v in var.routes : k => v if local.create_routes_and_integrations }
```

`var.routes` は、ルートの名前（キー）と設定（値）のマップです。`local.create_routes_and_integrations` が偽なら、マップは空になり、ルートは 1 つも作られません。真なら、利用者が書いた全部のルートが作られます。

キーはルートの識別子として使われます。ルートを追加しても、既存のルートは作り直されません。

### 2. API の ID を、このモジュールの API から取る

```hcl:line-numbers=198
  api_id = aws_apigatewayv2_api.this[0].id
```

ルートは、必ずどの API に属するかを持ちます。このモジュールが作った API の ID を、ここで渡しています。`[0]` は、`count` で作った 1 つ目の API を指します。

### 3. WebSocket のときだけ、API キーの設定を使う

```hcl:line-numbers=200
  api_key_required           = local.is_websocket ? each.value.api_key_required : null
```

API キーの要不要は、WebSocket API のルートだけで有効です。HTTP API では `null` にして、設定を省きます。`each.value` は、そのルートの利用者の設定です。

## ここがすごい
ルートは、同じ形の設定を何十も並べることがあります。マップのキーを名前として使うと、ルートの追加や削除が、ほかのルートに影響しません。また、`for_each` の `if` で、API を作らないときにはルートも作らない、という依存関係を 1 か所に書けます。

さらに、WebSocket と HTTP の違いを、`local.is_websocket ? ... : null` という 1 行で切り替えている点もよいです。同じリソースの書き方を、プロトコルごとに分けずに済みます。

## まとめ
- 条件付きの `for` 式は、作る対象を 1 行で絞り込めます。
- 親のリソース（API）の ID を参照すると、作成の順番も自動で決まります。
- 型によって使えない属性は、三項演算子で `null` にすると、1 つのリソースで両方に対応できます。
