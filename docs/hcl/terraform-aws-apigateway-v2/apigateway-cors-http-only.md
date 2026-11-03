---
title: "CORS の設定は、HTTP API のときだけ作る"
description: "terraform-aws-apigateway-v2 の CORS。API の種類が HTTP で、かつ設定があるときだけ cors_configuration を作り、WebSocket では無視する。"
language: hcl
project: "terraform-aws-apigateway-v2"
repo: https://github.com/terraform-aws-modules/terraform-aws-apigateway-v2
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "95e6a1d56d6d761ec12c89b36b29aad03a421b2f"
file: main.tf
lines: [20, 31]
format: 2
function: "resource \"aws_apigatewayv2_api\"（this・dynamic \"cors_configuration\"）"
difficulty: 2
tags: ["ネットワーク", "API設計"]
---

## ひとことで
API Gateway の API は、HTTP API と WebSocket API の 2 種類があり、CORS（別のドメインからの呼び出しの許可）の設定は HTTP API でだけ使えます。このコードは、種類が HTTP で、かつ CORS の設定があるときだけ、ブロックを 1 つ作ります。

## コード
```hcl:line-numbers=20
  dynamic "cors_configuration" {
    for_each = local.is_http && var.cors_configuration != null ? [var.cors_configuration] : []

    content {
      allow_credentials = cors_configuration.value.allow_credentials
      allow_headers     = cors_configuration.value.allow_headers
      allow_methods     = cors_configuration.value.allow_methods
      allow_origins     = cors_configuration.value.allow_origins
      expose_headers    = cors_configuration.value.expose_headers
      max_age           = cors_configuration.value.max_age
    }
  }
```

## 前提知識
- API Gateway v2: HTTP API と WebSocket API を扱うサービスです。仕組みが少し違い、設定できる項目も違います。
- CORS: ブラウザが別のオリジン（ドメイン）へのリクエストを送ってよいかを決める仕組みです。
- `allow_origins` / `allow_methods` / `allow_headers`: 許可する接続元、メソッド、ヘッダーです。
- `max_age`: ブラウザが、この許可の結果を覚えておく秒数です。
- `local.is_http`: API の種類が HTTP かどうかを表す真偽値です。

## 何をしているか
### 1. HTTP で、かつ設定があるときだけ作る

```hcl:line-numbers=21
    for_each = local.is_http && var.cors_configuration != null ? [var.cors_configuration] : []
```

`local.is_http` と、`var.cors_configuration` が `null` でないこと、の両方が真のときだけ、1 要素のリストになります。どちらかが偽なら空で、ブロックは作られません。

### 2. 中身は、利用者の値をそのまま渡す

```hcl:line-numbers=24
      allow_credentials = cors_configuration.value.allow_credentials
      allow_headers     = cors_configuration.value.allow_headers
      allow_methods     = cors_configuration.value.allow_methods
      allow_origins     = cors_configuration.value.allow_origins
      expose_headers    = cors_configuration.value.expose_headers
      max_age           = cors_configuration.value.max_age
```

CORS の 6 つの項目を、利用者の値のまま渡します。モジュールが中身を加工しないので、AWS の仕様の変更にも追随しやすい形です。

## ここがすごい
「HTTP のときだけ有効」という条件を、`for_each` の `&&` の一方に置いています。種類が WebSocket のときに CORS を渡すと AWS がエラーを返すため、この判定がないと利用者は種類ごとに書き分けなければなりません。

その判定を `local.is_http` という 1 つの値にまとめておくと、同じ条件を他の属性でも使い回せます。前に見た `api_key_selection_expression` の判定と、同じ考え方です。

## まとめ
- 種類で有効な機能が違うときは、種類の判定を `local` にまとめて、各所で使い回します。
- `for_each` の条件に `&&` で判定を足すと、無効な場合のブロックを確実に消せます。
- 中身を加工せずに渡すと、AWS の仕様変更に強くなります。
