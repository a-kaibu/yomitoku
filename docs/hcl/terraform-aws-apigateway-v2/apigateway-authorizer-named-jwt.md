---
title: "認可の設定を名前付きで並べ、JWT の項目は省けるようにする"
description: "terraform-aws-apigateway-v2 のオーソライザー。マップのキーを名前にして複数作り、jwt_configuration は値があるときだけ dynamic で作る。"
language: hcl
project: "terraform-aws-apigateway-v2"
repo: https://github.com/terraform-aws-modules/terraform-aws-apigateway-v2
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "95e6a1d56d6d761ec12c89b36b29aad03a421b2f"
file: main.tf
lines: [54, 69]
format: 2
function: "resource \"aws_apigatewayv2_authorizer\"（this・dynamic \"jwt_configuration\"）"
difficulty: 3
tags: ["セキュリティ", "データ構造"]
---

## ひとことで
API Gateway で、リクエストを通す前に身元を確かめる仕組みを「オーソライザー」と呼びます。認可の方式には、Lambda で判定するものと、JWT（トークン）を検証するものがあります。このコードは、オーソライザーの一覧をマップで受け取り、キーを名前にして 1 つずつ作ります。JWT の設定は、値があるときだけ作られます。

## コード
```hcl:line-numbers=54
  for_each = { for k, v in var.authorizers : k => v if var.create }

  region = var.region

  api_id = aws_apigatewayv2_api.this[0].id

  authorizer_credentials_arn        = each.value.authorizer_credentials_arn
  authorizer_payload_format_version = each.value.authorizer_payload_format_version
  authorizer_result_ttl_in_seconds  = each.value.authorizer_result_ttl_in_seconds
  authorizer_type                   = each.value.authorizer_type
  authorizer_uri                    = each.value.authorizer_uri
  enable_simple_responses           = each.value.enable_simple_responses
  identity_sources                  = each.value.identity_sources

  dynamic "jwt_configuration" {
    for_each = each.value.jwt_configuration != null ? [each.value.jwt_configuration] : []
```

## 前提知識
- オーソライザー（authorizer）: API のリクエストを受けたときに、その人が許可されているかを確かめる部品です。
- JWT（JSON Web Token）: 認証の結果を入れた、署名付きのトークンです。
- `identity_sources`: オーソライザーがトークンを探す場所（ヘッダーなど）です。
- `authorizer_result_ttl_in_seconds`: 認可の結果を覚えておく秒数です。
- `dynamic` と `[値] : []`: 値があるときだけブロックを作る書き方です。

## 何をしているか
### 1. 作成フラグが真のときだけ、名前付きで並べる

```hcl:line-numbers=54
  for_each = { for k, v in var.authorizers : k => v if var.create }
```

`var.authorizers` をマップのまま回し、作成フラグが真のときだけ残します。キーがオーソライザーの名前になるので、リソースの識別子も安定します。

### 2. 認可の種類と場所を、それぞれの値から読む

```hcl:line-numbers=60
  authorizer_credentials_arn        = each.value.authorizer_credentials_arn
  authorizer_payload_format_version = each.value.authorizer_payload_format_version
  authorizer_result_ttl_in_seconds  = each.value.authorizer_result_ttl_in_seconds
  authorizer_type                   = each.value.authorizer_type
  authorizer_uri                    = each.value.authorizer_uri
  enable_simple_responses           = each.value.enable_simple_responses
  identity_sources                  = each.value.identity_sources
```

各オーソライザーの項目を、`each.value` から読みます。種類が Lambda なのか JWT なのかは、`authorizer_type` で利用者が決めます。

### 3. JWT の設定は、あるときだけ作る

```hcl:line-numbers=69
    for_each = each.value.jwt_configuration != null ? [each.value.jwt_configuration] : []
```

`jwt_configuration` が `null` なら、ブロックは作りません。Lambda 型のオーソライザーでは JWT の設定を書かないので、ブロックが自然に消えます。

## ここがすごい
1 つのリソースで、Lambda 型と JWT 型の両方を扱える設計になっています。どちらの型でも必要な項目を並べ、型に関係ない項目は `null` やブロックの省略で消えます。

また、オーソライザーをマップのキーで管理するので、利用者は名前で複数の認可を並べられます。ルートごとに違う認可を選ぶ使い方とも、名前で自然につながります。

## まとめ
- 複数の方式を扱うリソースは、型の判定を項目ごとに `null` で切り替えると、1 つの書き方で済みます。
- マップのキーを名前にすると、後から参照するときにも分かりやすくなります。
- 任意のブロックは `[値] : []` の形で、値があるときだけ作れます。
