---
title: "利用者の一覧から VPC との関連付けを 1 件ずつ作る"
description: "terraform-aws-security-group の VPC 関連付け。for 式で、作成フラグが真のときだけ map を残し、for_each で VPC ごとに関連付けを作る短い書き方。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: main.tf
lines: [104, 111]
format: 2
function: "resource \"aws_vpc_security_group_vpc_association\""
difficulty: 1
tags: ["データ構造", "API設計"]
---

## ひとことで
この部分は、1 つのセキュリティグループを、複数の VPC に関連付けるためのリソースを、利用者が指定した一覧の数だけ作ります。`for_each` と `for` 式を組み合わせた、最も短い部類の書き方です。

## コード
```hcl:line-numbers=104
resource "aws_vpc_security_group_vpc_association" "this" {
  for_each = { for k, v in var.vpc_associations : k => v if local.create }

  region = var.region

  security_group_id = aws_security_group.this[0].id
  vpc_id            = each.value.vpc_id
}
```

## 前提知識
- `for_each`: マップの要素ごとに 1 つずつリソースを作ります。キーはリソースのアドレスになります。
- `for k, v in マップ : k => v if 条件`: 条件に合う要素だけを残す `for` 式です。
- `each.value`: `for_each` の今の要素の値です。`each.key` は今のキーです。
- `local.create`: モジュール全体を作るかどうかを表す真偽値です。
- `security_group_id`: 関連付けの対象となるセキュリティグループの ID です。

## 何をしているか
### 1. 作成フラグが真のときだけ、要素を残す
```hcl:line-numbers=105
  for_each = { for k, v in var.vpc_associations : k => v if local.create }
```

`{ for k, v in var.vpc_associations : k => v if local.create }` は、利用者の一覧（キーと値の組）を読み、`local.create` が真のときだけ同じ組を残した新しいマップを作ります。作成フラグが偽なら空のマップになり、関連付けは 1 つも作られません。

### 2. 関連付けの中身を書く
```hcl:line-numbers=109
  security_group_id = aws_security_group.this[0].id
  vpc_id            = each.value.vpc_id
```

`security_group_id` には、このモジュールが作った 1 つのセキュリティグループの ID を入れます。`vpc_id` には、各要素の `vpc_id` を入れます。`each.value.vpc_id` は、利用者が書いた一覧の中の VPC ID そのものです。

## ここがすごい
同じ条件を、リソースごとに `count` で書く方法もあります。しかし、この書き方では、作成フラグの判定が `for` 式の中の 1 か所に集まっています。そのため、ほかのリソースと同じ規則を繰り返し書かずに済みます。

また、`for_each` のキーに利用者の名前を使うと、後から VPC を 1 つ足しても、既存の関連付けは作り直されません。`count` の番号では、途中の要素を消すと後ろの番号がずれて、不要な再作成が起きやすくなります。

## まとめ
- `for` 式の `if` で、作成フラグによる絞り込みを 1 行で書けます。
- `for_each` のキーに意味のある名前を使うと、変更の影響を小さくできます。
- 短いリソースでも、条件と値の関係を読みやすく書くと、保守がしやすくなります。

