---
title: "文字列の一覧を split で受け取り、compact で空を除く"
description: "terraform-aws-vpc の default セキュリティグループ。カンマ区切りの文字列を split で一覧にし、compact で空の要素を除いて、ルールの各項目に渡す書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1410, 1423]
format: 2
function: "resource \"aws_default_security_group\"（dynamic \"ingress\"）"
difficulty: 2
tags: ["文字列処理", "イディオム"]
---

## ひとことで
VPC の既定のセキュリティグループに、受信のルールを追加する `dynamic` ブロックです。CIDR の一覧や SG の一覧は、利用者がカンマで区切った文字列で渡せます。このブロックは、その文字列を `split` で一覧に変え、`compact` で空の要素を取り除いてから、ルールに入れます。

## コード
```hcl:line-numbers=1410
  dynamic "ingress" {
    for_each = var.default_security_group_ingress
    content {
      self             = lookup(ingress.value, "self", null)
      cidr_blocks      = compact(split(",", lookup(ingress.value, "cidr_blocks", "")))
      ipv6_cidr_blocks = compact(split(",", lookup(ingress.value, "ipv6_cidr_blocks", "")))
      prefix_list_ids  = compact(split(",", lookup(ingress.value, "prefix_list_ids", "")))
      security_groups  = compact(split(",", lookup(ingress.value, "security_groups", "")))
      description      = lookup(ingress.value, "description", null)
      from_port        = lookup(ingress.value, "from_port", 0)
      to_port          = lookup(ingress.value, "to_port", 0)
      protocol         = lookup(ingress.value, "protocol", "-1")
    }
  }
```

## 前提知識
- 既定のセキュリティグループ: VPC を作ったときに、AWS が自動で作る既定のセキュリティグループです。
- `dynamic "ingress"`: 受信のルールの数だけ、ブロックを作ります。
- `split(区切り, 文字列)`: 文字列を区切り文字で分けて、一覧にします。`split(",", "")` は、空の文字列 1 個の一覧になります。
- `compact(リスト)`: 一覧から `null` と空文字を取り除きます。
- `lookup(マップ, キー, 既定値)`: キーが無ければ既定値を返します。

## 何をしているか
### 1. ルールの一覧を回す
```hcl:line-numbers=1411
    for_each = var.default_security_group_ingress
    content {
```

`for_each = var.default_security_group_ingress` で、利用者が渡したルールの一覧の数だけ、`ingress` ブロックを作ります。`ingress.value` が、1 件分のルールの値を表します。

### 2. 文字列を一覧にして、空を除く
```hcl:line-numbers=1414
      cidr_blocks      = compact(split(",", lookup(ingress.value, "cidr_blocks", "")))
      ipv6_cidr_blocks = compact(split(",", lookup(ingress.value, "ipv6_cidr_blocks", "")))
      prefix_list_ids  = compact(split(",", lookup(ingress.value, "prefix_list_ids", "")))
      security_groups  = compact(split(",", lookup(ingress.value, "security_groups", "")))
```

`compact(split(",", lookup(ingress.value, "cidr_blocks", "")))` は、`cidr_blocks` の項目が無ければ空文字として扱い、`split` で一覧に変えます。空文字を `split` すると、要素が 1 つの一覧になるので、`compact` で空の要素を取り除き、結果を空のリストにします。こうすると、CIDR を書かなかったルールでも、正しく空の一覧になります。

### 3. 残りの項目を既定値で補う
```hcl:line-numbers=1418
      description      = lookup(ingress.value, "description", null)
      from_port        = lookup(ingress.value, "from_port", 0)
      to_port          = lookup(ingress.value, "to_port", 0)
      protocol         = lookup(ingress.value, "protocol", "-1")
    }
```

`description` は既定で `null`、ポート番号は既定で 0、プロトコルは既定で `-1` になります。`-1` は、すべてのプロトコルを表す AWS の書き方です。利用者は、書きたい項目だけを書けばよい形になっています。

## ここがすごい
利用者は、`"10.0.0.0/16,10.1.0.0/16"` のように、1 つの文字列で複数の CIDR を書けます。Terraform の型としては文字列なので、一覧の型を強制しない代わりに、`split` と `compact` で柔軟に受け止めています。

また、空の文字列でも壊れないように、`split` の後に必ず `compact` を通す約束になっているのが読みどころです。区切りの処理の癖を、1 つの式の中で扱いきっています。

## まとめ
- `split` で文字列を一覧に変え、`compact` で空を除くと、区切り文字の入力を柔軟に扱えます。
- `lookup` の既定値で、省略された項目を補えます。
- 空の文字列を扱うときは、`split` の結果がどうなるかを意識すると安全です。

