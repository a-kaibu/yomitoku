---
title: "ディレクトリバケットでは、メトリクスのタグを送らない"
description: "terraform-aws-s3-bucket のメトリクス設定。ディレクトリバケットのときは filter の tags を null にし、対応していない項目を AWS に送らない。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [1381, 1389]
format: 2
function: "resource \"aws_s3_bucket_metric\"（dynamic \"filter\"）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
S3 のメトリクス（CloudWatch への監視項目）は、フィルタで対象を絞れます。このモジュールには、通常のバケットと、ディレクトリバケットという別の種類のバケットがあります。ディレクトリバケットでは、タグによるフィルタが使えません。このコードは、その違いを `null` の切り替えで吸収しています。

## コード
```hcl:line-numbers=1381
  dynamic "filter" {
    for_each = each.value.filter != null ? [each.value.filter] : []

    content {
      prefix       = filter.value.prefix
      tags         = var.is_directory_bucket ? null : filter.value.tags
      access_point = filter.value.access_point
    }
  }
```

## 前提知識
- S3 のメトリクス設定: バケットの中の一部（プレフィックスやタグ）について、リクエストの数などを CloudWatch に出す設定です。
- ディレクトリバケット: 階層の構造を持つ、高速な S3 の種類です。通常のバケットと、使える機能が一部違います。
- アクセスポイント: バケットへのアクセスの入口を、用途ごとに分ける仕組みです。
- `null`: 属性を送らないことを表します。
- 三項演算子: 条件に応じて、値か `null` を選びます。

## 何をしているか
### 1. 指定があるときだけ、フィルタを作る

```hcl:line-numbers=1381
  dynamic "filter" {
    for_each = each.value.filter != null ? [each.value.filter] : []
```

フィルタの指定が無ければ、ブロックは作られません。全体のリクエストを監視します。指定があれば、そのフィルタを 1 つ作ります。

### 2. タグは、ディレクトリバケットでは送らない

```hcl:line-numbers=1386
      tags         = var.is_directory_bucket ? null : filter.value.tags
```

ディレクトリバケットのときは、タグの値を `null` にして送りません。通常のバケットのときだけ、利用者が書いたタグを使います。

### 3. プレフィックスとアクセスポイントは、そのまま渡す

`prefix` と `access_point` は、どちらの種類のバケットでも使えるので、加工せずに渡しています。対応しない項目だけを、特別扱いしています。

## ここがすごい
「種類によって使えない項目がある」という問題を、1 行の三項演算子で解いています。利用者は、ディレクトリバケットかどうかを意識せず、同じフィルタの書き方を使えます。

また、バケットの名前の参照も、同じ `var.is_directory_bucket` で切り替えています。バケットの種類による違いを、1 つのフラグにまとめているので、読み手は変化点をすぐに見つけられます。

## まとめ
- 種類ごとに使えない項目は、三項演算子で `null` にすると、同じ書き方を保てます。
- フラグを 1 つ決めて、そこから違いを派生させると、変化点が見やすくなります。
- 対応している項目はそのまま渡すと、余計な分岐を増やさずに済みます。
