---
title: "CORS の規則を、一覧から 1 つずつ作る"
description: "terraform-aws-s3-bucket の CORS 設定。local.cors_rules の各規則を dynamic で cors_rule ブロックにし、許可するメソッドや接続元を渡す。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [355, 366]
format: 2
function: "resource \"aws_s3_bucket_cors_configuration\"（dynamic \"cors_rule\"）"
difficulty: 1
tags: ["API設計", "ネットワーク"]
---

## ひとことで
ブラウザで動く Web アプリが、別のドメインにある S3 のファイルを読んだり書いたりするには、CORS（クロスオリジン共有）という設定が必要です。その設定には、許可する接続元やメソッドを、規則ごとに書きます。このコードは、規則の一覧から、規則の数だけ `cors_rule` のブロックを作ります。

## コード
```hcl:line-numbers=355
  dynamic "cors_rule" {
    for_each = local.cors_rules

    content {
      id              = cors_rule.value.id
      allowed_methods = cors_rule.value.allowed_methods
      allowed_origins = cors_rule.value.allowed_origins
      allowed_headers = cors_rule.value.allowed_headers
      expose_headers  = cors_rule.value.expose_headers
      max_age_seconds = cors_rule.value.max_age_seconds
    }
  }
```

## 前提知識
- CORS（Cross-Origin Resource Sharing）: ブラウザが、別のドメインへのリクエストを許すかを決める仕組みです。S3 のバケットに設定すると、そのバケットを別のサイトから使えるようになります。
- オリジン: `https://example.com` のような、プロトコルとドメインとポートの組です。
- `allowed_methods`: 許可する HTTP のメソッド（`GET` や `PUT` など）です。
- `max_age_seconds`: ブラウザが、この規則の結果を覚えておく秒数です。
- `dynamic` ブロック: 一覧の要素の数だけ、同じ形のブロックを作ります。

## 何をしているか
### 1. 規則の一覧で繰り返す

```hcl:line-numbers=355
  dynamic "cors_rule" {
    for_each = local.cors_rules
```

`local.cors_rules` は、利用者が書いた規則の一覧です。規則の数だけ `cors_rule` のブロックができます。`for_each` にリストを渡すと、`cors_rule.value` で要素を読めます。

### 2. 各規則の値を、そのまま渡す

```hcl:line-numbers=359
      id              = cors_rule.value.id
      allowed_methods = cors_rule.value.allowed_methods
      allowed_origins = cors_rule.value.allowed_origins
      allowed_headers = cors_rule.value.allowed_headers
      expose_headers  = cors_rule.value.expose_headers
      max_age_seconds = cors_rule.value.max_age_seconds
```

それぞれの項目は、利用者が書いた規則の値をそのまま使います。モジュールは、CORS の書式を AWS の形に合わせるだけです。

## ここがすごい
規則を一覧にして `dynamic` で回すと、利用者は規則を 1 つずつ書き足せます。規則ごとに、許すオリジンやメソッドを変えられるので、細かい設定が可能です。

また、規則の中身は一切加工せず、そのまま渡しています。AWS の仕様が増えても、モジュールを書き換えずに利用者が使える余地が残ります。

## まとめ
- CORS のような、数が決まらない設定は、一覧と `dynamic` の組み合わせが向いています。
- 中身を加工せずに渡すと、AWS の新しい項目にも追随しやすくなります。
- `allowed_origins` を絞ると、必要な接続元だけに限れます。
