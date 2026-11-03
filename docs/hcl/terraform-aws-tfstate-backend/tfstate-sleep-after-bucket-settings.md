---
title: "S3 の設定が落ち着くまで、30 秒の待ち時間を挟む"
description: "terraform-aws-tfstate-backend の time_sleep。バケットのアクセス設定の後に 30 秒待ってから、後続のリソースを作る。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: main.tf
lines: [262, 268]
format: 2
function: "resource \"time_sleep\"（wait_for_aws_s3_bucket_settings）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Terraform の状態（state）を保存する S3 バケットは、公開設定や バケットポリシーを付けた直後に、次の操作を受けつけないことがあります。このコードは `time_sleep` という部品で、設定を付けた後に 30 秒待つ時間を作ります。後続の処理は、この待ち時間の後で動きます。

## コード
```hcl:line-numbers=262
resource "time_sleep" "wait_for_aws_s3_bucket_settings" {
  count = local.enabled ? 1 : 0

  depends_on       = [aws_s3_bucket_public_access_block.default, aws_s3_bucket_policy.default]
  create_duration  = "30s"
  destroy_duration = "30s"
}
```

## 前提知識
- tfstate（状態ファイル）: Terraform が、管理しているリソースの情報を保存しておく場所です。S3 に置くのが一般的です。
- `time_sleep`: Terraform の `time` プロバイダーの部品で、指定した時間だけ待つだけのリソースです。値は何も作りません。
- `depends_on`: このリソースを、指定したリソースの作成の後に行う、と順番を決める引数です。
- `create_duration` / `destroy_duration`: 作成と削除の後に待つ時間です。
- `count = 条件 ? 1 : 0`: 条件が真のときだけ、待ち時間のリソースを 1 つ作ります。

## 何をしているか
### 1. 待ちの前に、2 つの設定を終えさせる

```hcl:line-numbers=265
  depends_on       = [aws_s3_bucket_public_access_block.default, aws_s3_bucket_policy.default]
```

`depends_on` で、公開アクセスのブロック設定と、バケットポリシーの作成が終わってから、待ちが始まるようにしています。順番を明示しないと、待つ意味がなくなってしまいます。

### 2. 作成と削除で、30 秒ずつ待つ

```hcl:line-numbers=266
  create_duration  = "30s"
  destroy_duration = "30s"
```

作成のときも、削除のときも、30 秒待ちます。削除の方にも待ちを入れているのは、設定を外すときにも、順番の衝突が起きないようにするためです。

## ここがすごい
Terraform は、依存関係を見て順番を決めますが、AWS 側の「設定が反映されたか」は見えません。そこで、`time_sleep` を使って、人が決めた時間だけ待つ、という素朴な方法を取っています。待ちの長さを変数にしないのは、このモジュールの中での既定の調整として、固定しているからです。

また、待ちを 1 つのリソースに閉じ込め、後続のリソースは `depends_on` でこの待ちに依存させています。どこで待つかが、ひと目で分かる設計になっています。

## まとめ
- 反映の遅れがあるときは、`time_sleep` と `depends_on` で待ちを順番に挟めます。
- 作成と削除の両方に待ちを入れると、順番の衝突を減らせます。
- 待ちは最後の手段なので、理由をコメントで残しておくと、後で読む人の助けになります。
