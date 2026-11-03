---
title: "ルールのタグに付ける Name を、指定が無ければキーで補う"
description: "terraform-aws-security-group の ingress ルールのタグ。タグは共通のタグ、Name、ルール個別のタグの順で merge し、Name が無ければキーを使う。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: main.tf
lines: [53, 57]
format: 2
function: "resource \"aws_vpc_security_group_ingress_rule\"（tags の merge と coalesce）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
セキュリティグループのルールには、AWS コンソールで見える名前として `Name` タグを付けます。利用者が名前を書かなければ、このモジュールはルールのキーを名前にします。タグは三つのマップを `merge` でつないで作ります。

## コード
```hcl:line-numbers=53
  tags = merge(
    var.tags,
    { Name = coalesce(each.value.name, each.key) },
    each.value.tags
  )
```

## 前提知識
- `merge(マップ1, マップ2, マップ3)`: 複数のマップを一つにまとめます。後に書いたマップが、同じキーで優先されます。
- `coalesce(値1, 値2)`: 最初に `null` でも空でもない値を返します。
- `for_each` のキー: マップの要素の名前です。ここでは、ルールの名前にあたります。

## 何をしているか
### 1. 共通のタグと、名前のタグをつなぐ

```hcl:line-numbers=54
    var.tags,
    { Name = coalesce(each.value.name, each.key) },
```

共通のタグに、`Name` を一つ加えます。`Name` の値は、`coalesce` で決めます。

### 2. ルール個別のタグを、最後に足す

```hcl:line-numbers=56
    each.value.tags
```

ルールごとのタグは、最後に `merge` されます。同じキーがあれば、ルールの指定が優先されます。

## ここがすごい
名前の既定値を、`for_each` のキーで補っています。ルールに名前が無くても、AWS の画面で区別できるタグが必ず付きます。優先順位は、`merge` の引数の並び順で表されています。

## まとめ
- `merge` の引数の順番が、タグの優先順位になります。
- `coalesce` の後ろに、キーなど必ずある値を置くと、名前の欠落を防げます。
- 共通のタグと個別のタグを分けると、利用者の指定が上書きできます。
