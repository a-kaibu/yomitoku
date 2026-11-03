---
title: "アドオンのバージョンを、利用者の指定か既定の版から選ぶ"
description: "terraform-aws-eks の aws_eks_addon_version データソース。利用者が addon_version を書かなければ、データソースが返す互換のあるバージョンを使う coalesce の書き方。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [819, 827]
format: 2
function: "data \"aws_eks_addon_version\""
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
EKS のアドオン（CoreDNS や VPC CNI などの追加機能）は、クラスターのバージョンと互換のあるバージョンを選ぶ必要があります。このデータソースは、AWS が返す互換のバージョンを読み込みます。利用者がバージョンを書けば、その値を優先します。

## コード
```hcl:line-numbers=819
data "aws_eks_addon_version" "this" {
  for_each = var.addons != null && local.create && !local.create_outposts_local_cluster ? var.addons : {}

  region = var.region

  addon_name         = coalesce(each.value.name, each.key)
  kubernetes_version = coalesce(var.kubernetes_version, aws_eks_cluster.this[0].version)
  most_recent        = each.value.most_recent
}
```

## 前提知識
- アドオン: EKS クラスターに、CoreDNS や kube-proxy などの機能を追加するものです。
- `data "aws_eks_addon_version"`: 指定したアドオンの、指定したクラスターのバージョンに合うバージョンの一覧を返すデータソースです。
- `for_each`: データソースも `for_each` で、アドオンごとに作れます。
- `coalesce(値1, 値2)`: 最初に `null` でも空文字でもない値を返します。
- `each.key` と `each.value`: 今のアドオンのキーと、その設定です。
- `most_recent`: 最新のバージョンを使うかどうかの真偽値です。

## 何をしているか
### 1. 作る条件を決める
```hcl:line-numbers=820
  for_each = var.addons != null && local.create && !local.create_outposts_local_cluster ? var.addons : {}
```

`for_each` は、アドオンが指定されていて、モジュールを作り、かつ Outposts のローカルクラスターでないときだけ、`var.addons` の一覧を使います。それ以外では空のマップになり、データソースは読み込まれません。

### 2. 名前とバージョンを決める
```hcl:line-numbers=824
  addon_name         = coalesce(each.value.name, each.key)
  kubernetes_version = coalesce(var.kubernetes_version, aws_eks_cluster.this[0].version)
  most_recent        = each.value.most_recent
```

`addon_name` は、`each.value.name` があればそれを、無ければキーを使います。`kubernetes_version` は、利用者の指定が無ければクラスターの実際のバージョンを使います。`most_recent` はそのまま渡します。

### 3. バージョンを補う
```hcl:line-numbers=838
  addon_version        = coalesce(each.value.addon_version, data.aws_eks_addon_version.this[each.key].version)
```

`coalesce(each.value.addon_version, data.aws_eks_addon_version.this[each.key].version)` は、利用者が `addon_version` を書けばその値を、書かなければデータソースが返したバージョンを使います。データソースと同じキーを `[each.key]` で引いているので、アドオンごとに正しい値が選ばれます。

## ここがすごい
`coalesce` によって、利用者は多くの場合、バージョンを書かずに済みます。それでも、特定のバージョンに固定したいときは、その値で上書きできます。既定の動きと、上書きの両方を 1 行で表しています。

また、データソースを `for_each` で作るので、アドオンが増えても、それぞれに互換のバージョンが選ばれます。手作業で互換表を管理する必要がありません。

## まとめ
- `coalesce` は、利用者の指定を優先し、無ければ既定の値を使う、という形を表せます。
- データソースも `for_each` で作ると、アドオンごとに値を引けます。
- 既定の動きを自動で決めつつ、上書きも許すと、利用者の負担が減ります。
