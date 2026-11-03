---
title: "インスタンスプロファイルを作り直す順番を lifecycle で決める"
description: "terraform-aws-iam の iam-role。インスタンスプロファイルの count の条件と、create_before_destroy で、置き換え時に新しい物を先に作る書き方。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-role/main.tf
lines: [376, 390]
format: 2
function: "resource \"aws_iam_instance_profile\""
difficulty: 2
tags: ["設計パターン", "API設計"]
---

## ひとことで
インスタンスプロファイルは、EC2 インスタンスに IAM ロールを渡すための入れ物です。このリソースは、`create_before_destroy` によって、置き換えが必要になったとき、新しいものを先に作り、古いものを後で消します。ロールの参照が途切れないようにするための書き方です。

## コード
```hcl:line-numbers=376
resource "aws_iam_instance_profile" "this" {
  count = var.create && var.create_instance_profile ? 1 : 0

  role = aws_iam_role.this[0].name

  name        = var.use_name_prefix ? null : var.name
  name_prefix = var.use_name_prefix ? "${var.name}-" : null
  path        = var.path

  tags = var.tags

  lifecycle {
    create_before_destroy = true
  }
}
```

## 前提知識
- インスタンスプロファイル: EC2 インスタンスに IAM ロールを関連付けるための AWS のリソースです。ロールの 1 つを包みます。
- `lifecycle` ブロック: 作り方や置き換え方を決めます。
- `create_before_destroy = true`: 置き換えのときに、新しいリソースを先に作ってから、古いリソースを消します。
- `count = 条件 ? 1 : 0`: 条件が真のときだけ 1 個作ります。
- `name_prefix`: 名前の前半だけを指定し、後ろはランダムな文字列で補う引数です。

## 何をしているか
### 1. 作る条件を決める
```hcl:line-numbers=377
  count = var.create && var.create_instance_profile ? 1 : 0
```

`var.create && var.create_instance_profile` の両方が真のときだけ、インスタンスプロファイルを 1 つ作ります。ロールを作るかどうかとは別に、プロファイルを作るかどうかを選べるようにしています。

### 2. 名前とロールを設定する
```hcl:line-numbers=379
  role = aws_iam_role.this[0].name

  name        = var.use_name_prefix ? null : var.name
  name_prefix = var.use_name_prefix ? "${var.name}-" : null
  path        = var.path
```

`role = aws_iam_role.this[0].name` で、対象のロールを指定します。名前は `use_name_prefix` によって、`name` をそのまま使うか、`name_prefix` で接頭辞として使うかを切り替えます。`null` で片方を省略するのがこのモジュールの流儀です。

### 3. 置き換えの順番を決める
```hcl:line-numbers=387
  lifecycle {
    create_before_destroy = true
  }
```

`create_before_destroy = true` があると、名前が変わるなどで作り直しが必要になったとき、新しいプロファイルを先に作ります。古いプロファイルを先に消すと、置き換えの間に使えない時間が生まれるため、この順番にしています。

## ここがすごい
置き換えの順番は、通常は Terraform が決めますが、このモジュールは `lifecycle` で明示しています。作り直しの途中で止まっても、利用中のロールが無くなる時間を短くできます。

また、名前の指定を `name` と `name_prefix` に分けたため、複数の環境で同じ名前が衝突しないようにできます。`create_before_destroy` と `name_prefix` は組み合わせて使われることが多く、同じ名前の物が同時に存在できないという制約を回避する効き目があります。

## まとめ
- `create_before_destroy` で、置き換え時の新旧の順番を決められます。
- `name` と `name_prefix` の切り替えは、`null` で省略すると簡潔に書けます。
- 作るかどうかの条件を、リソースごとに分けると、構成の柔軟性が上がります。
