---
title: "既定の VPC を、Terraform の管理下に置く"
description: "terraform-aws-vpc の aws_default_vpc。AWS が最初から作る既定の VPC を、manage_default_vpc が真のときだけ管理下に置き、名前を coalesce で既定値から決める書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1388, 1401]
format: 2
function: "resource \"aws_default_vpc\"（this）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
AWS のアカウントには、リージョンごとに既定の VPC（デフォルト VPC）が最初から用意されています。`aws_default_vpc` は、その既定の VPC を Terraform の管理下に置くリソースです。このブロックは、利用者が `manage_default_vpc` を真にしたときだけ、その管理を始めます。

## コード
```hcl:line-numbers=1388
resource "aws_default_vpc" "this" {
  count = var.manage_default_vpc ? 1 : 0

  region = var.region

  enable_dns_support   = var.default_vpc_enable_dns_support
  enable_dns_hostnames = var.default_vpc_enable_dns_hostnames

  tags = merge(
    { "Name" = coalesce(var.default_vpc_name, "default") },
    var.tags,
    var.default_vpc_tags,
  )
}
```

## 前提知識
- 既定の VPC（デフォルト VPC）: AWS がアカウントに最初から作る VPC です。新規に作ったインスタンスは、既定でこの VPC に入ります。
- 管理下に置く: `aws_default_vpc` を使うと、既定の VPC の設定を Terraform で変更できます。作るのではなく、既存のものを引き取る形です。
- `count = 条件 ? 1 : 0`: 条件が真のときだけ 1 個作ります。
- `coalesce(値, "default")`: 値が空でなければ値を、空なら `"default"` を使います。
- `enable_dns_support` と `enable_dns_hostnames`: VPC の中で DNS の名前解決と、インスタンスのホスト名を有効にするかどうかの設定です。

## 何をしているか
### 1. 管理するかを決める
```hcl:line-numbers=1389
  count = var.manage_default_vpc ? 1 : 0
```

`count = var.manage_default_vpc ? 1 : 0` で、利用者が真にしたときだけ、既定の VPC を管理します。既定値は偽なので、この設定を書かない限り、既定の VPC には手を付けません。

### 2. DNS の設定を渡す
```hcl:line-numbers=1393
  enable_dns_support   = var.default_vpc_enable_dns_support
  enable_dns_hostnames = var.default_vpc_enable_dns_hostnames
```

DNS の名前解決と、ホスト名の設定を、変数から渡します。既定の VPC の設定を、Terraform の宣言として書けるようになります。

### 3. 名前を決める
```hcl:line-numbers=1396
  tags = merge(
    { "Name" = coalesce(var.default_vpc_name, "default") },
    var.tags,
    var.default_vpc_tags,
  )
```

`{ "Name" = coalesce(var.default_vpc_name, "default") }` で、名前を利用者の指定か `default` にします。その後ろに、共通のタグと個別のタグを `merge` で足します。

## ここがすごい
既定の VPC は、Terraform が作ったものではありません。そのため、このモジュールは「作る」ではなく「管理する」という意味のリソースを使い、利用者が明示的に選んだときだけ触ります。

また、名前の既定値を `coalesce` で与えているので、利用者が何も書かなくても、一定の名前で管理が始まります。`count` の条件と既定値の組み合わせが、安全側に倒れる設計です。

## まとめ
- `aws_default_vpc` は、既存の既定の VPC を管理下に置くためのリソースです。
- 既定の動作を変えない設定（偽）を既定値にすると、安全です。
- `coalesce` で既定の名前を補うと、利用者の入力を減らせます。

