---
title: "owner の ID を指定していないときだけ、正規の ID を読む"
description: "terraform-aws-s3-bucket の aws_canonical_user_id。owner の id が省略されているときだけデータソースを読み、ACL の所有者を正規の ID で決める書き方。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [7, 9]
format: 2
function: "data \"aws_canonical_user_id\""
difficulty: 2
tags: ["API設計", "セキュリティ"]
---

## ひとことで
S3 の ACL（アクセス制御リスト）では、所有者を「正規の ID（canonical user ID）」という長い文字列で指定します。このデータソースは、その ID を読み込みます。利用者が `owner` の `id` を書いていれば、読み込みは行わず、読むのは省略されたときだけです。

## コード
```hcl:line-numbers=7
data "aws_canonical_user_id" "this" {
  count = local.create_bucket && local.create_bucket_acl && try(var.owner["id"], null) == null ? 1 : 0
}
```

## 前提知識
- ACL（アクセス制御リスト）: バケットやオブジェクトに対して、誰にどの権限を与えるかを表す、古くからある仕組みです。
- 正規の ID（canonical user ID）: AWS アカウントを表す、長い英数字の文字列です。ACL の所有者として使います。
- `data "aws_canonical_user_id"`: 現在のアカウントの正規の ID を読み込むデータソースです。
- `count`: 条件が真のときだけ、データソースを 1 つ読みます。
- `try(var.owner["id"], null) == null`: 利用者の `owner` マップに `id` が無いか、`owner` 自体が無いかを確かめる式です。

## 何をしているか
### 1. 読み込みを行う条件
```hcl:line-numbers=8
  count = local.create_bucket && local.create_bucket_acl && try(var.owner["id"], null) == null ? 1 : 0
```

`count` の条件は、3 つを組み合わせています。バケットを作ること、ACL を作ること、そして `owner` の `id` が指定されていないことです。3 つが揃ったときだけ、正規の ID を読み込みます。

### 2. 利用者の `owner` を確かめる
```hcl:line-numbers=8
  count = local.create_bucket && local.create_bucket_acl && try(var.owner["id"], null) == null ? 1 : 0
```

`try(var.owner["id"], null) == null` は、`owner` の変数が `null` でも、`id` が無くても、どちらでも `true` になります。`try` で囲んでいるので、マップの項目が無くてもエラーで止まりません。

### 3. 読み込まないときの扱い
```hcl:line-numbers=11
data "aws_caller_identity" "current" {
  count = local.create_bucket ? 1 : 0
}
```

ここで読んでいるのは現在のアカウント情報です。その `count` はバケットを作るかどうかだけで決まり、`owner` の指定とは関係ありません。`owner` の `id` が指定されていれば、正規の ID のデータソースだけは作られないので、読み込みが省かれます。

## ここがすごい
利用者が ID を書いていれば、AWS への問い合わせを 1 回減らせます。モジュールは「必要な時だけ読む」という形で、ネットワークの往復を減らしています。

また、条件の書き方が `try(...) == null` という 1 行にまとまっているため、「指定がない」の意味がはっきり読めます。`null` と欠けた項目を、同じ判定で扱える点が、防御的な書き方の良さです。

## まとめ
- `count` の条件で、読み込みを必要なときだけに限れます。
- `try(...) == null` は、項目の欠けと `null` を同じ判定で扱えます。
- 外部への問い合わせは、条件を絞ると減らせます。
