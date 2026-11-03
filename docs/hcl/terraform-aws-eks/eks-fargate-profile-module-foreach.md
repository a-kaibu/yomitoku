---
title: "Fargate のプロファイルを、module を for_each で何個も呼ぶ"
description: "terraform-aws-eks の Fargate プロファイル。子モジュールを for_each で、利用者のプロファイルの数だけ呼び出し、作成フラグを条件に掛ける書き方。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: node_groups.tf
lines: [229, 232]
format: 2
function: "module \"fargate_profile\""
difficulty: 3
tags: ["設計パターン", "API設計"]
---

## ひとことで
`module` ブロックにも `for_each` を付けられます。このブロックは、Fargate のプロファイルを、利用者が指定した数だけ子モジュールとして呼び出します。プロファイルごとに、独立したモジュールの状態を持つので、1 つを変えても、ほかのプロファイルに影響しません。

## コード
```hcl:line-numbers=229
module "fargate_profile" {
  source = "./modules/fargate-profile"

  for_each = var.create && !local.create_outposts_local_cluster && var.fargate_profiles != null ? var.fargate_profiles : {}
```

## 前提知識
- Fargate: サーバーを管理せずにコンテナを動かせる EKS の実行環境です。どのポッドを Fargate で動かすかを、プロファイルで決めます。
- `module` ブロック: 別のフォルダにある Terraform の構成を、部品として呼び出します。`source` でその場所を指定します。
- `module` の `for_each`: 同じモジュールを、マップの要素の数だけ呼び出せます。`each.key` と `each.value` が使えます。
- `var.fargate_profiles != null ? ... : {}`: 値が無いときは空のマップにする、という条件付きの書き方です。
- `local.create_outposts_local_cluster`: Outposts のローカルクラスターでは、Fargate を作らないという条件です。

## 何をしているか
### 1. 呼び出す条件を決める
```hcl:line-numbers=232
  for_each = var.create && !local.create_outposts_local_cluster && var.fargate_profiles != null ? var.fargate_profiles : {}
```

`var.create` が真で、Outposts のローカルクラスターでなく、`fargate_profiles` が指定されているときだけ、その一覧を使います。それ以外は空のマップになり、モジュールは 1 つも呼ばれません。

### 2. プロファイルの作成フラグを渡す
```hcl:line-numbers=234
  create = each.value.create
```

`create = each.value.create` によって、利用者は個々のプロファイルを、作るか作らないかで選べます。全体の作成フラグが真でも、個別に `false` を指定すれば、そのプロファイルだけ作られません。

## ここがすごい
`module` の `for_each` を使うと、プロファイルの数だけ独立したモジュールの状態を作れます。リソースの `for_each` と比べると、1 つのプロファイルに複数のリソースが含まれる場合でも、その塊ごとに管理できる点が違います。

また、モジュールに渡す値に、リージョンやパーティションのような共通の情報を、`locals` 経由で渡しています。コメントにあるように、データソースを何度も読まずに済むよう、親が読んだ値を子に渡す設計です。

## まとめ
- `module` にも `for_each` を付けると、同じ部品を複数の数だけ呼べます。
- 作成フラグを、全体と個別の 2 段で持つと、柔軟に選べます。
- 親で読んだ共通の値を子に渡すと、同じ読み込みを繰り返さずに済みます。

