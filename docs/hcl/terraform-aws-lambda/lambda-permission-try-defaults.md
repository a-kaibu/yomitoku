---
title: "Lambda の呼び出し許可を、未指定の項目は既定値で補う"
description: "terraform-aws-lambda の aws_lambda_permission。action や principal などを try で読み、書かれていなければ既定の値を使う。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [346, 354]
format: 2
function: "resource \"aws_lambda_permission\"（current_version_triggers）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Lambda 関数を、API Gateway や EventBridge などのサービスから呼べるようにするには、呼び出しの許可（permission）を作ります。許可には、誰が（principal）、何を（action）、どこから（source）呼ぶかを書きます。このコードは、利用者が書いた許可の一覧から、書かれていない項目を `try` で読み、既定の値で補います。

## コード
```hcl:line-numbers=346
  statement_id_prefix      = try(each.value.statement_id, each.key)
  action                   = try(each.value.action, "lambda:InvokeFunction")
  principal                = try(each.value.principal, format("%s.amazonaws.com", try(each.value.service, "")))
  principal_org_id         = try(each.value.principal_org_id, null)
  source_arn               = try(each.value.source_arn, null)
  source_account           = try(each.value.source_account, null)
  event_source_token       = try(each.value.event_source_token, null)
  function_url_auth_type   = try(each.value.function_url_auth_type, null)
  invoked_via_function_url = try(each.value.invoked_via_function_url, null)
```

## 前提知識
- Lambda の呼び出し許可: 「このサービスやアカウントが、この関数を呼んでよい」という、関数側に付ける許可です。
- principal: 呼び出し元の主体です。`apigateway.amazonaws.com` のようなサービス名で書きます。
- action: 許可する操作です。通常の呼び出しは `lambda:InvokeFunction` です。
- source_arn: 呼び出しを送るリソースの ARN です。これで、特定のリソースからの呼び出しだけに絞れます。
- `try(値, 代わり)`: 値がエラーになったら代わりを使います。項目が無いマップを読むときに使います。
- `format("%s.amazonaws.com", ...)`: 文字列の中に値を埋めて、サービスのドメインを作ります。

## 何をしているか
### 1. 呼び出しの操作と主体を、既定値で補う

```hcl:line-numbers=347
  action                   = try(each.value.action, "lambda:InvokeFunction")
  principal                = try(each.value.principal, format("%s.amazonaws.com", try(each.value.service, "")))
```

`action` が書かれていなければ、既定の `lambda:InvokeFunction` を使います。`principal` が無ければ、`service` の名前から `サービス.amazonaws.com` を作ります。入れ子の `try` で、`service` も無いときは空文字になります。

### 2. 任意の絞り込みは、無ければ null

```hcl:line-numbers=349
  principal_org_id         = try(each.value.principal_org_id, null)
  source_arn               = try(each.value.source_arn, null)
  source_account           = try(each.value.source_account, null)
```

組織の ID、呼び出し元の ARN、アカウントの指定は、無ければ `null` にします。`null` は「絞り込まない」という意味になり、AWS の既定の動きに任せられます。

### 3. 利用者の値を、そのまま渡す項目

`statement_id_prefix` などの名前は、利用者の `statement_id` か、マップのキーを使います。キーを既定の名前にする書き方は、前に見た記事と同じ考え方です。

## ここがすごい
利用者は、`service = "apigateway"` とだけ書けば、主体の名前を正しく組み立てられます。許可の中身を細かく書く必要がある場合にだけ、`principal` や `source_arn` を追加できます。

また、すべての項目を `try` で読むことで、どの項目が省略されても、エラーにならずに安全な既定値が入ります。マップの形が利用者によって違っても、同じ式で受け取れる点がよいところです。

## まとめ
- `try` で読むと、書かれていない項目を既定値で補えます。
- 入れ子の `try` と `format` を組み合わせると、サービス名から主体の名前を組み立てられます。
- 絞り込みの項目は `null` にすると、AWS の既定の動きに任せられます。
