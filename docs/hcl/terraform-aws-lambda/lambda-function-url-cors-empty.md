---
title: "CORS の設定が空なら、関数 URL のブロックを作らない"
description: "terraform-aws-lambda の関数 URL。cors の中身が空のマップなら dynamic のブロックを作らず、あれば try で各項目を読む。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [508, 519]
format: 2
function: "resource \"aws_lambda_function_url\"（dynamic \"cors\"）"
difficulty: 2
tags: ["ネットワーク", "防御的プログラミング"]
---

## ひとことで
Lambda の関数 URL は、関数に直接 HTTP でアクセスできる URL を発行する機能です。ブラウザから呼ぶときは、CORS の設定が必要になることがあります。このコードは、CORS の設定が空のマップなら、ブロックを作らず、設定があるときだけ各項目を読みます。

## コード
```hcl:line-numbers=508
  dynamic "cors" {
    for_each = length(keys(var.cors)) == 0 ? [] : [var.cors]

    content {
      allow_credentials = try(cors.value.allow_credentials, null)
      allow_headers     = try(cors.value.allow_headers, null)
      allow_methods     = try(cors.value.allow_methods, null)
      allow_origins     = try(cors.value.allow_origins, null)
      expose_headers    = try(cors.value.expose_headers, null)
      max_age           = try(cors.value.max_age, null)
    }
  }
```

## 前提知識
- 関数 URL（Lambda Function URL）: API Gateway を使わずに、Lambda 関数へ直接 HTTPS でアクセスできる URL です。
- CORS: ブラウザが、別のオリジンへのリクエストを許すかを決める仕組みです。
- `allow_origins` / `allow_methods`: 許可する接続元と、メソッドです。
- `length(keys(マップ)) == 0`: マップに項目が 1 つも無いかを調べる書き方です。
- `[var.cors]`: 1 つのオブジェクトを 1 要素のリストに包み、`dynamic` で 1 回だけ回すための書き方です。

## 何をしているか
### 1. 項目が無いときは、ブロックを作らない

```hcl:line-numbers=509
    for_each = length(keys(var.cors)) == 0 ? [] : [var.cors]
```

`cors` のマップのキーが 1 つも無ければ、空のリストを回します。その結果、`cors` のブロックは作られません。項目が 1 つでもあれば、`[var.cors]` を回して 1 つだけ作ります。

### 2. 各項目は try で読む

```hcl:line-numbers=512
      allow_credentials = try(cors.value.allow_credentials, null)
      allow_headers     = try(cors.value.allow_headers, null)
      allow_methods     = try(cors.value.allow_methods, null)
      allow_origins     = try(cors.value.allow_origins, null)
      expose_headers    = try(cors.value.expose_headers, null)
      max_age           = try(cors.value.max_age, null)
```

それぞれの項目は、利用者が書いた場合だけ値が入り、書いていなければ `null` になります。`null` の項目は AWS に送られず、AWS の既定値が使われます。

## ここがすごい
「ブロックを作るかどうか」と「中の項目を読むかどうか」を、2 段に分けています。最初の段は `length(keys())` で、マップ全体が空かを判定します。次の段の `try` は、項目ごとの欠けに対応します。役割が違うので、それぞれの段で別の方法を使っています。

また、CORS の項目をすべて `try` で書いておくと、利用者は必要な項目だけを書けます。`allow_credentials` だけを指定しても、他の項目はエラーにならず、正しく設定されます。

## まとめ
- マップが空かどうかで、ブロックの有無を切り替えられます。
- 項目ごとの欠けは `try` で `null` にすると、AWS の既定値に任せられます。
- ブロックの判定と項目の読み取りを段ごとに分けると、読みやすくなります。
