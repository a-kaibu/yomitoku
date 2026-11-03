---
title: "クラスターのセキュリティグループを、作り直すときは先に新しく作る"
description: "terraform-aws-eks のクラスター用セキュリティグループ。lifecycle の create_before_destroy で、置き換え時に新しいグループを先に作り、通信の空白を防ぐ。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [458, 477]
format: 2
function: "resource \"aws_security_group\"（cluster・lifecycle）"
difficulty: 2
tags: ["ネットワーク", "防御的プログラミング"]
---

## ひとことで
セキュリティグループの名前や説明を変えると、Terraform は既存のグループを作り直すことがあります。作り直すとき、古いものを先に消すと、一時的にどのグループも付いていない状態が生まれます。このコードは `lifecycle` の `create_before_destroy` を使い、新しいグループを先に作ってから古いものを消すようにしています。

## コード
```hcl:line-numbers=458
resource "aws_security_group" "cluster" {
  count = local.create_security_group ? 1 : 0

  region = var.region

  name        = var.security_group_use_name_prefix ? null : local.security_group_name
  name_prefix = var.security_group_use_name_prefix ? "${local.security_group_name}${var.prefix_separator}" : null
  description = var.security_group_description
  vpc_id      = var.vpc_id

  tags = merge(
    var.tags,
    { "Name" = local.security_group_name },
    var.security_group_tags
  )

  lifecycle {
    create_before_destroy = true
  }
}
```

## 前提知識
- セキュリティグループ: EKS のコントロールプレーンとノードの間の通信を許可する、仮想のファイアウォールです。
- 置き換え（replace）: 既存のリソースを変えられないとき、Terraform が一度消して作り直す動作です。
- `lifecycle`: リソースの作成や削除の順番を指定するブロックです。
- `create_before_destroy = true`: 置き換えるとき、新しいものを先に作り、その後で古いものを削除します。
- `name` と `name_prefix`: 名前を完全に指定するか、接頭辞として使い AWS にランダムな後半を付けてもらうかの違いです。

## 何をしているか
### 1. 名前か接頭辞のどちらかを使う

```hcl:line-numbers=463
  name        = var.security_group_use_name_prefix ? null : local.security_group_name
  name_prefix = var.security_group_use_name_prefix ? "${local.security_group_name}${var.prefix_separator}" : null
```

接頭辞を使うときは、`name` を `null` にして `name_prefix` を使います。接頭辞を使うと、同じ名前が衝突しないので、作り直しの途中でも新旧が両立できます。

### 2. 新しいものを先に作る

```hcl:line-numbers=474
  lifecycle {
    create_before_destroy = true
  }
```

これが、このコードの中心です。`create_before_destroy` が真なので、置き換えのとき、新しいグループが先に作られます。古いグループは、新しいものが作られた後で消えます。

## ここがすごい
名前を固定した状態で `create_before_destroy` を使うと、同じ名前が同時に存在できないため、作成に失敗します。そこで、`name_prefix` と組み合わせて、同じ名前の衝突を避けている点がよく考えられています。

また、通信が途切れないことは、クラスターの運用にとって大切です。作り直しの間にコントロールプレーンのグループが無くなる事故を、この 1 つの設定で防いでいます。

## まとめ
- 置き換えを伴うリソースには、`create_before_destroy` で順番を逆にできます。
- 名前を固定するときは、接頭辞の仕組みと組み合わせると、衝突を避けられます。
- 通信の経路を持つリソースは、作り直しの順番に注意すると、停止時間を減らせます。
