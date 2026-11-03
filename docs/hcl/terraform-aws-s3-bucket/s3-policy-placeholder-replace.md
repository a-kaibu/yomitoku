---
title: "ポリシーのプレースホルダーを、replace で順番に置き換える"
description: "terraform-aws-s3-bucket の policy。aws_iam_policy_document の JSON に残したプレースホルダーを、バケットの ID・ARN・アカウント ID で replace を重ねて置き換える書き方。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [39, 48]
format: 2
function: "locals（policy）"
difficulty: 3
tags: ["文字列処理", "イディオム"]
---

## ひとことで
S3 のバケットポリシーは、バケットを作ってから、その ID や ARN が分かります。しかし、ポリシーの文書はバケットを作る前に組み立てたい場合があります。このモジュールは、ポリシーの JSON に `_S3_BUCKET_ID_` などの目印を残しておき、バケットが作られた後に `replace` で本当の値に置き換えています。

## コード
```hcl:line-numbers=39
  policy = local.create_bucket && local.attach_policy ? replace(
    replace(
      replace(
        data.aws_iam_policy_document.combined[0].json,
        "_S3_BUCKET_ID_", local.policy_placeholders["_S3_BUCKET_ID_"]
      ),
      "_S3_BUCKET_ARN_", local.policy_placeholders["_S3_BUCKET_ARN_"]
    ),
    "_AWS_ACCOUNT_ID_", local.policy_placeholders["_AWS_ACCOUNT_ID_"]
  ) : ""
```

## 前提知識
- プレースホルダー: 後で値に置き換えるための、目印となる文字列です。ここでは `_S3_BUCKET_ID_` のような名前です。
- `replace(文字列, 探す文字列, 置き換える文字列)`: 文字列の中の部分を、別の文字列に置き換えます。正規表現ではなく、そのままの文字として探します。
- 三項演算子 `条件 ? 真 : 偽`: 条件が成り立つときだけ式を評価します。
- `local.policy_placeholders`: 目印と本当の値の組をマップにまとめたものです。
- `aws_iam_policy_document.combined[0].json`: 組み立てた JSON の文書です。

## 何をしているか
### 1. 目印と本当の値の組を作る
```hcl:line-numbers=33
  policy_placeholders = {
    "_S3_BUCKET_ID_"   = try(var.is_directory_bucket ? aws_s3_directory_bucket.this[0].bucket : aws_s3_bucket.this[0].id, null),
    "_S3_BUCKET_ARN_"  = try(var.is_directory_bucket ? aws_s3_directory_bucket.this[0].arn : aws_s3_bucket.this[0].arn, null),
    "_AWS_ACCOUNT_ID_" = local.account_id
  }
```

`policy_placeholders` は、目印をキーに、本当の値を値にしたマップです。バケットが `is_directory_bucket` によって違う種類のリソースになるため、`try` と三項演算子で、どちらか一方の ID や ARN を使います。

### 2. 目印を 1 つずつ置き換える
```hcl:line-numbers=39
  policy = local.create_bucket && local.attach_policy ? replace(
    replace(
      replace(
        data.aws_iam_policy_document.combined[0].json,
```

`replace` は入れ子になっていて、最も内側の JSON から、目印を 1 つずつ取り除いていきます。最初の `replace` が `_S3_BUCKET_ID_` を置き換え、その結果を次の `replace` が受け取って `_S3_BUCKET_ARN_` を置き換えます。

### 3. 作らない条件をまとめる
```hcl:line-numbers=48
  ) : ""
```

`local.create_bucket && local.attach_policy` が偽のときは、空文字を返します。ポリシーを付けないときに、置き換えの処理そのものを実行しない形です。

## ここがすごい
プレースホルダーにすると、ポリシーの組み立てと、バケットの作成の順番を分けられます。循環参照（ポリシーがバケットを参照し、バケットがポリシーを参照する）を避けるための、実用的な工夫です。

また、目印の名前を `_S3_BUCKET_ID_` のように大文字とアンダースコアで書いているので、JSON の中で見つけやすく、ほかの文字列と取り違えにくくなっています。

## まとめ
- 目印を使うと、組み立ての順番を柔軟にできます。
- `replace` を重ねると、複数の目印を順に置き換えられます。
- 作らない条件のときは、処理を省くと無駄がありません。

