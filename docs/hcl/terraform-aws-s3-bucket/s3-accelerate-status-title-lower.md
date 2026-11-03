---
title: "アクセラレーションの状態を、大文字小文字を問わず正しい綴りにそろえる"
description: "terraform-aws-s3-bucket の aws_s3_bucket_accelerate_configuration。利用者が書いた enabled などの値を title と lower で整え、AWS が求める綴りにする。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [324, 324]
format: 2
function: "resource \"aws_s3_bucket_accelerate_configuration\"（status の整形）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
S3 の転送アクセラレーションは、`Enabled` か `Suspended` の綴りで設定します。このモジュールは、利用者が `enabled` や `SUSPENDED` のように、どの大文字小文字で書いても受け付けるように、値を整えてから渡しています。

## コード
```hcl:line-numbers=324
  status = title(lower(var.acceleration_status))
```

## 前提知識
- `lower(文字列)`: 文字列をすべて小文字にします。
- `title(文字列)`: 単語の先頭を大文字にします。`enabled` は `Enabled` になります。
- `var.acceleration_status`: 利用者が指定する変数です。

## 何をしているか
### 1. 小文字にそろえてから、先頭を大文字にする

```hcl:line-numbers=324
  status = title(lower(var.acceleration_status))
```

`lower` で、どの書き方でも同じ形にそろえます。`ENABLED` でも `Enabled` でも、中間の結果は `enabled` です。次に `title` で先頭を大文字にし、結果は `Enabled` か `Suspended` になります。AWS の API が受け付ける綴りです。

## ここがすごい
利用者に正しい綴りを覚えさせず、モジュールの側で吸収しています。`lower` と `title` を組み合わせるだけで、大文字小文字の揺れを防げます。同じ考え方は、このモジュールの他の設定（request payer や replica の状態）でも使われています。

## まとめ
- `title(lower(値))` の組み合わせで、大文字小文字の揺れを吸収できます。
- API の綴りを、利用者の入力から切り離せます。
- 小さな整形でも、利用者の失敗を減らせます。
