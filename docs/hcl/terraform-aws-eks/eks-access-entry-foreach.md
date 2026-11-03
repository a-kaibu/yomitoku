---
title: "アクセスエントリを主体の名前で for_each に渡す"
description: "terraform-aws-eks の aws_eks_access_entry。for 式で作成フラグを確かめたマップを for_each に渡し、政策の関連付けには主体とポリシーを連結した文字列をキーにする書き方。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [358, 373]
format: 2
function: "resource \"aws_eks_access_entry\""
difficulty: 2
tags: ["データ構造", "設計パターン"]
---

## ひとことで
`aws_eks_access_entry` は、クラスターに入る主体（IAM ロールやユーザー）を 1 件ずつ作ります。`for_each` のキーは、利用者が付けた名前なので、主体の追加や削除が、ほかの主体の作り直しにつながりません。このブロックは、その基本形です。

## コード
```hcl:line-numbers=358
resource "aws_eks_access_entry" "this" {
  for_each = { for k, v in local.merged_access_entries : k => v if local.create }

  region = var.region

  cluster_name      = aws_eks_cluster.this[0].id
  kubernetes_groups = try(each.value.kubernetes_groups, null)
  principal_arn     = each.value.principal_arn
  type              = try(each.value.type, null)
  user_name         = try(each.value.user_name, null)

  tags = merge(
    var.tags,
    try(each.value.tags, {}),
  )
}
```

## 前提知識
- `resource ... for_each`: マップの要素の数だけリソースを作ります。キーは管理上の名前になります。
- `each.value`: 今の要素の値です。`principal_arn` などの項目を持ちます。
- `try(each.value.項目, 既定値)`: 項目が無いときに既定値を使います。ここでは `kubernetes_groups` や `type` などが省略されることを想定しています。
- `merge(var.tags, try(each.value.tags, {}))`: 共通のタグと、主体ごとのタグを合わせます。
- `count` と `for_each`: `count` は番号でリソースを区別しますが、`for_each` はキーで区別します。

## 何をしているか
### 1. 作成フラグを `for` 式で確かめる
```hcl:line-numbers=359
  for_each = { for k, v in local.merged_access_entries : k => v if local.create }
```

`for_each = { for k, v in local.merged_access_entries : k => v if local.create }` は、モジュールを作らないときは空のマップにします。キーは、利用者が付けたエントリの名前のまま使われます。

### 2. 省略できる項目を try で補う
```hcl:line-numbers=364
  kubernetes_groups = try(each.value.kubernetes_groups, null)
  principal_arn     = each.value.principal_arn
  type              = try(each.value.type, null)
  user_name         = try(each.value.user_name, null)
```

`kubernetes_groups`、`type`、`user_name` は、利用者が書かなければ `null` になります。`try` によって、項目が存在しなくてもエラーで止まりません。`principal_arn` だけは必須なので、そのまま参照しています。

### 3. タグを合わせる
```hcl:line-numbers=369
  tags = merge(
    var.tags,
    try(each.value.tags, {}),
  )
```

モジュール全体のタグと、主体ごとのタグを `merge` で合わせます。`try(each.value.tags, {})` によって、タグが無いときは空のマップを使います。

## ここがすごい
`for_each` のキーを利用者の名前にすると、エントリの並び順が変わっても、リソースは同じアドレスのままです。これは `count` で番号を振る場合との大きな違いです。

また、主体ごとの関連付けは、別のリソース（`aws_eks_access_policy_association`）が、`"${v.entry_key}_${v.pol_key}"` という文字列をキーにして作ります。元のエントリの名前と、ポリシーの名前を連結した、一意で読めるキーです。

## まとめ
- `for_each` にマップを渡すと、キーの名前で管理できます。
- `try` と `merge` を使うと、省略された項目やタグを安全に扱えます。
- キーを連結した文字列にすると、組み合わせごとに一意な名前を作れます。

