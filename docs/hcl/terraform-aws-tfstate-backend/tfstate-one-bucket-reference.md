---
title: "count で作られたバケットを one() で参照する"
description: "terraform-aws-tfstate-backend の S3 バケット関連のリソース。バケットが作られていないときは、one() が null を返し、ポリシーやロックの設定が無効になる書き方。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: main.tf
lines: [187, 193]
format: 2
function: "resource \"aws_s3_bucket_policy\"（default）"
difficulty: 2
tags: ["型システム", "防御的プログラミング"]
---

## ひとことで
この部分は、バケットに付けるポリシーを作ります。バケットは `count` で作られるので、参照の仕方を `one(...[*].id)` に統一しています。バケットが作られない設定でも、この参照は `null` になり、リソースは作られないので、エラーにはなりません。

## コード
```hcl:line-numbers=187
resource "aws_s3_bucket_policy" "default" {
  count = local.bucket_enabled ? 1 : 0

  bucket     = one(aws_s3_bucket.default[*].id)
  policy     = local.policy
  depends_on = [aws_s3_bucket_public_access_block.default]
}
```

## 前提知識
- `resource "aws_s3_bucket_policy"`: S3 バケットに、アクセスを決める JSON のポリシーを付けるリソースです。
- `count = 条件 ? 1 : 0`: 条件が真なら 1 個、偽なら 0 個のリソースを作ります。
- `one(aws_s3_bucket.default[*].id)`: `count` で作られたバケットの ID を取り出します。0 個なら `null`、1 個ならその ID を返します。
- `depends_on`: 他のリソースの後に作るように、順序を明示する引数です。ここでは公開アクセスの設定を先に作ります。
- `local.policy`: `terraform-aws-tfstate-backend` の `aggregated_policy` などで組み立てた、JSON のポリシーです。

## 何をしているか
### 1. 作る条件を決める
```hcl:line-numbers=188
  count = local.bucket_enabled ? 1 : 0
```

`count = local.bucket_enabled ? 1 : 0` で、バケットを有効にしているときだけポリシーを作ります。`local.bucket_enabled` は、モジュール全体の有効化と、利用者の `bucket_enabled` の 2 つの条件を合わせたものです。

### 2. バケットの ID を one() で受け取る
```hcl:line-numbers=190
  bucket     = one(aws_s3_bucket.default[*].id)
```

`bucket = one(aws_s3_bucket.default[*].id)` は、バケットの ID を 1 つだけ取り出します。バケットが作られていないときは `null` ですが、その場合は `count` が 0 なのでポリシー自体も作られません。`one()` は、2 個以上になったらエラーで止めるため、取り違えを防ぎます。

### 3. 公開アクセスの設定を先に作る
```hcl:line-numbers=191
  policy     = local.policy
  depends_on = [aws_s3_bucket_public_access_block.default]
```

`policy` には`local.policy` を、`depends_on` には `aws_s3_bucket_public_access_block` を指定しています。公開アクセスの制限を先に作ってからポリシーを付けるため、順番が逆になる心配がありません。

## ここがすごい
同じバケットの参照を、ポリシー、ACL、ロックの設定など、複数のリソースで同じ書き方にしています。読み手は、どのリソースでも `one(...)` を見れば「バケットが無いときは `null`」と分かります。

また、`count` の条件とバケットの参照の条件が、同じ `bucket_enabled` でそろっているため、片方だけ作られて参照が壊れることがありません。条件を 1 か所で決めていることが、この安全性の土台です。

## まとめ
- `one(リソース[*].id)` は、`count` で作られたリソースの ID を安全に参照する定番の書き方です。
- 作る条件と参照する条件をそろえると、取り違えを防げます。
- `depends_on` で、作る順番を明示できます。

