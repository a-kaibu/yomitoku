---
title: "静的サイトの設定を、値の有無で dynamic ブロックに分ける"
description: "terraform-aws-s3-bucket の website 設定。index_document・error_document・redirect_all_requests_to を、値があるときだけ作る 3 つの dynamic ブロック。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [209, 232]
format: 2
function: "resource \"aws_s3_bucket_website_configuration\"（dynamic ブロック）"
difficulty: 2
tags: ["イディオム", "API設計"]
---

## ひとことで
S3 は、静的な Web サイトとしても使えます。このブロックは、利用者が指定した `website` の設定のうち、「インデックスのページ」「エラーのページ」「すべてのリクエストを別のホストへ転送」の 3 つを、指定があるときだけ作ります。指定がなければ、そのブロックは作られません。

## コード
```hcl:line-numbers=209
  dynamic "index_document" {
    for_each = var.website.index_document != null ? [var.website.index_document] : []

    content {
      suffix = index_document.value
    }
  }

  dynamic "error_document" {
    for_each = var.website.error_document != null ? [var.website.error_document] : []

    content {
      key = error_document.value
    }
  }

  dynamic "redirect_all_requests_to" {
    for_each = var.website.redirect_all_requests_to != null ? [var.website.redirect_all_requests_to] : []

    content {
      host_name = redirect_all_requests_to.value.host_name
      protocol  = redirect_all_requests_to.value.protocol
    }
  }
```

## 前提知識
- `dynamic "名前" { for_each = ... content { ... } }`: 要素の数だけ、中身のブロックを作ります。空のリストなら作られません。
- `[値]` と `[]`: 1 個の要素のリストと、空のリストです。三項演算子で切り替えると、「あるときだけ作る」が表せます。
- `!= null`: 値が `null` でないかを調べる式です。
- `index_document.value` のように `名前.value` で、`dynamic` ブロックの今の要素を参照します。
- `var.website`: 利用者が渡す `website` 設定のオブジェクトです。
- `content { ... }`: 中に書く設定の本体です。`dynamic` の中で使います。

## 何をしているか
### 1. インデックスのページを作るかどうか決める
```hcl:line-numbers=209
  dynamic "index_document" {
    for_each = var.website.index_document != null ? [var.website.index_document] : []

    content {
      suffix = index_document.value
    }
  }
```

`var.website.index_document` が `null` でなければ、その値を 1 要素のリストにして、`dynamic` を 1 回作ります。`content` の中で `suffix = index_document.value` と書くと、ページ名がそのまま入ります。`null` なら空のリストになり、`index_document` ブロックは書かれません。

### 2. エラーのページも同じ形で
```hcl:line-numbers=217
  dynamic "error_document" {
    for_each = var.website.error_document != null ? [var.website.error_document] : []

    content {
      key = error_document.value
    }
  }
```

エラーのページも、同じ書き方です。`error_document` の値は、`key` という引数に入ります。インデックスとエラーは互いに独立しているので、どちらか一方だけを指定することもできます。

### 3. 別のホストへの転送
```hcl:line-numbers=225
  dynamic "redirect_all_requests_to" {
    for_each = var.website.redirect_all_requests_to != null ? [var.website.redirect_all_requests_to] : []

    content {
      host_name = redirect_all_requests_to.value.host_name
      protocol  = redirect_all_requests_to.value.protocol
    }
  }
```

`redirect_all_requests_to` は、`host_name` と `protocol` をまとめて持つオブジェクトです。こちらは 1 つの値の中に複数の項目が入っているので、`redirect_all_requests_to.value.host_name` のように、ブロックの中で項目を取り出します。

## ここがすごい
同じ形の `dynamic` を 3 回書くだけで、「あるときだけ書く設定」を、利用者の指定のまま表せています。`count` でリソースごと分ける方法では、設定の一部だけを切り替えられないので、この書き方が向いています。

また、利用者は `website = { index_document = "index.html" }` のように、必要な項目だけを書けばよく、残りは自動で省略されます。`null` と空のリストを使い分けることで、AWS の設定を「書かない」ことと「空の値を書く」ことを区別しています。

## まとめ
- `dynamic` と `[値]` / `[]` の組み合わせで、値があるときだけブロックを作れます。
- 1 つのオブジェクトの中の項目を、`dynamic` のブロックの中で取り出せます。
- 同じ書き方をそろえると、設定が増えても読み手の負担が増えません。

