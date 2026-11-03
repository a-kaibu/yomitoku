---
title: "接続関数の ID を、指定と作成済みの資源から選ぶ"
description: "terraform-aws-cloudfront の connection_function_association。利用者が指定した ID を優先し、無ければ作成した関数の ID を coalesce で使う。"
language: hcl
project: "terraform-aws-cloudfront"
repo: https://github.com/terraform-aws-modules/terraform-aws-cloudfront
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "5b9a0a480220b84f29f02d84ff71dd5340953f68"
file: main.tf
lines: [22, 28]
format: 2
function: "dynamic \"connection_function_association\""
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
CloudFront の接続関数は、利用者が既存の ID を指定するか、このモジュールで作るかのどちらかで使われます。このコードは、関連付ける ID を、指定された値か作成した資源の値かのどちらかに決めています。`coalesce` が、その選択を行います。

## コード
```hcl:line-numbers=22
  dynamic "connection_function_association" {
    for_each = var.connection_function_association_id != null || var.create_connection_function ? [true] : []

    content {
      id = coalesce(var.connection_function_association_id, try(aws_cloudfront_connection_function.this[0].id, null))
    }
  }
```

## 前提知識
- CloudFront の接続関数: 接続時の処理を行う小さな関数です。ディストリビューションに関連付けて使います。
- `coalesce(値1, 値2, ...)`: 最初に null ではなく空でもない値を返します。
- `try(式, null)`: 式が失敗したら null を返します。作成されていない資源を安全に参照できます。

## 何をしているか
### 1. 関連付けるかどうかを決める

```hcl:line-numbers=23
    for_each = var.connection_function_association_id != null || var.create_connection_function ? [true] : []
```

既存の ID が指定されているか、このモジュールで関数を作るときだけ、関連付けの動的ブロックを作ります。どちらでもなければ、ブロックは作られません。

### 2. ID を、指定か作成済みの値から選ぶ

```hcl:line-numbers=26
      id = coalesce(var.connection_function_association_id, try(aws_cloudfront_connection_function.this[0].id, null))
```

`coalesce` は、利用者の指定した ID を先に見ます。指定が無ければ、作成した接続関数の ID を使います。作成していない場合は `try` が `null` を返します。

## ここがすごい
「指定が優先、無ければ自動」という規則を、一行で書いています。作成と指定のどちらでも、同じ属性に値を入れられます。

## まとめ
- 動的ブロックの `for_each` を、条件付きの一要素のリストにすると、関連付けの有無を表せます。
- `coalesce` は、優先順位のある選択に向いています。
- 作らない資源を参照するときは、`try` で守ると安全です。
