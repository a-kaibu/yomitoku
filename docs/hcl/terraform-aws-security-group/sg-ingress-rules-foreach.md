---
title: "map を for_each に渡して、ルールを 1 件ずつ作る"
description: "terraform-aws-security-group の ingress ルールが、利用者の map を for 式で絞り込み、for_each で 1 件ずつリソースにする仕組み。try と coalesce で省略された値を補う。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: main.tf
lines: [40, 59]
format: 2
function: "resource \"aws_vpc_security_group_ingress_rule\""
difficulty: 2
tags: ["データ構造", "セキュリティ"]
---

## ひとことで
この部分は、利用者が渡した複数の受信ルール（ingress rules）を、1 件ずつ AWS のリソースとして作ります。`for_each` にマップを渡すと、キーごとにリソースが作られ、キーがアドレス（管理上の名前）になります。ルールの一部を省略しても、`try` と `coalesce` が補うように書かれています。

## コード
```hcl:line-numbers=40
resource "aws_vpc_security_group_ingress_rule" "this" {
  for_each = { for k, v in var.ingress_rules : k => v if local.create }

  region = var.region

  cidr_ipv4                    = each.value.cidr_ipv4
  cidr_ipv6                    = each.value.cidr_ipv6
  description                  = each.value.description
  from_port                    = try(coalesce(each.value.from_port, each.value.to_port), null)
  ip_protocol                  = each.value.ip_protocol
  prefix_list_id               = each.value.prefix_list_id
  referenced_security_group_id = each.value.referenced_security_group_id == "self" ? aws_security_group.this[0].id : each.value.referenced_security_group_id
  security_group_id            = aws_security_group.this[0].id
  tags = merge(
    var.tags,
    { Name = coalesce(each.value.name, each.key) },
    each.value.tags
  )
  to_port = try(coalesce(each.value.to_port, each.value.from_port), null)
}
```

## 前提知識
- `resource "種類" "名前" { for_each = マップ }`: マップの各要素について、1 つずつリソースを作ります。`each.key` がキー、`each.value` が値です。
- `for k, v in マップ : k => v if 条件`: マップを絞り込んで、新しいマップを作る `for` 式です。
- `coalesce(値1, 値2)`: 最初に `null` でも空文字でもない値を返します。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。ここでは `null` を既定にしています。
- 三項演算子 `条件 ? 真 : 偽`: 条件で値を選びます。
- `aws_security_group.this[0].id`: `count` で作ったリソースの最初の要素の ID を参照する書き方です。

## 何をしているか
### 1. 作る条件を満たすルールだけを取り出す
```hcl:line-numbers=41
  for_each = { for k, v in var.ingress_rules : k => v if local.create }
```

`for k, v in var.ingress_rules : k => v if local.create` は、ルールの一覧（キーと中身の組）を取り出し、モジュール全体の作成フラグが真のときだけ残します。キーはそのままリソースの名前になるので、利用者は「ssh」「https」のような分かりやすい名前で、ルールを管理できます。

### 2. 省略された値を補う
```hcl:line-numbers=48
  from_port                    = try(coalesce(each.value.from_port, each.value.to_port), null)
```

`from_port = try(coalesce(each.value.from_port, each.value.to_port), null)` は、`from_port` が省略されていれば `to_port` の値を使います。両方省略されていれば `null` になります。`try` で囲んでいるので、`coalesce` がすべて空のときのエラーで止まりません。`to_port` の行も、同じ考えで反対側を補っています。

### 3. 自分自身のセキュリティグループを参照する
```hcl:line-numbers=51
  referenced_security_group_id = each.value.referenced_security_group_id == "self" ? aws_security_group.this[0].id : each.value.referenced_security_group_id
```

`referenced_security_group_id` の値が `"self"` のときは、このモジュールが作ったセキュリティグループ自身の ID を使います。そうでなければ、利用者が直接指定した ID をそのまま使います。ルールの送信元を「同じグループ内」と書けるようにする、短い分岐です。

## ここがすごい
ルールごとのリソースは、`for_each` のおかげで、一覧の中身が変わっても変更だけが反映されます。`count` で番号を振る方法では、途中の 1 件を消すと後ろのルールの番号がずれてしまいますが、キーで管理すると、そのようなずれが起きません。

また、`try` と `coalesce` の組み合わせによって、利用者は `from_port` か `to_port` のどちらか一方だけを書けば済みます。省略の規則をモジュールの中に閉じ込めることで、利用者は AWS の細かい仕様を覚えずに使えます。

## まとめ
- `for_each` にマップを渡すと、キーごとにリソースを作れます。キーが変わらなければ、ほかのルールに影響しません。
- `coalesce` と `try` を組み合わせると、省略された値の補い方を 1 行で書けます。
- `"self"` のような特別な文字列を使うと、同じグループ内の参照を分かりやすく指定できます。

