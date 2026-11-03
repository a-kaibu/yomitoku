---
title: "リクエスト支払いの値を、ひとつの判定で二択に決める"
description: "terraform-aws-s3-bucket の aws_s3_bucket_request_payment_configuration。requester かどうかだけを見て、支払者の値を Requester と BucketOwner のどちらかにする。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [340, 340]
format: 2
function: "resource \"aws_s3_bucket_request_payment_configuration\"（payer の判定）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
S3 のリクエスト支払いは、データの転送料を誰が払うかを決めます。値は `Requester` か `BucketOwner` の二つだけです。このコードは、利用者の入力が何であっても、必ずどちらかに決まるように書かれています。

## コード
```hcl:line-numbers=340
  payer = lower(var.request_payer) == "requester" ? "Requester" : "BucketOwner"
```

## 前提知識
- リクエスト支払い: データを取り出す側が転送料を払う仕組みです。
- 三項演算子 `条件 ? 真の値 : 偽の値`: 条件に応じて、どちらかの値を返します。
- `lower`: 文字列を小文字にします。

## 何をしているか
### 1. 大文字小文字を無視して、一致したときだけ Requester にする

```hcl:line-numbers=340
  payer = lower(var.request_payer) == "requester" ? "Requester" : "BucketOwner"
```

`lower(var.request_payer)` で小文字にしてから `"requester"` と比べます。`Requester` でも `REQUESTER` でも一致します。一致しなければ `BucketOwner` になるので、`"requester"` 以外の入力で失敗せず、既定の支払者に戻ります。

## ここがすごい
入力の検査をエラーにせず、既定の値に寄せています。許される値が二つしかないとき、一致する方だけを書いて、残りを既定にすれば、分岐がひとつで済みます。

## まとめ
- 二択の値は、一方に一致するかだけを判定すると簡潔になります。
- 比べる前に `lower` でそろえると、大文字小文字の揺れに強くなります。
- 三項演算子の偽の側を既定値にすると、入力の不備でも安全な値に決まります。
