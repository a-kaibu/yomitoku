---
title: "コントロールプレーンのサブネットを、指定が無ければ共通のものにする"
description: "terraform-aws-eks の vpc_config。コントロールプレーン用のサブネットは、指定があればそれを、無ければ共通のサブネットを使う coalescelist。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [80, 81]
format: 2
function: "resource \"aws_eks_cluster\"（vpc_config）"
difficulty: 2
tags: ["ネットワーク", "API設計"]
---

## ひとことで
EKS のクラスターには、Kubernetes の管理部分（コントロールプレーン）が動くサブネットを指定します。多くの利用者は、ノードと同じサブネットを使うので、わざわざ別に書く必要はありません。このコードは、コントロールプレーン用のサブネットが指定されていなければ、共通のサブネットを使います。また、セキュリティグループは重複と空を取り除いてから渡します。

## コード
```hcl:line-numbers=80
    security_group_ids        = compact(distinct(concat(var.additional_security_group_ids, [local.security_group_id])))
    subnet_ids                = coalescelist(var.control_plane_subnet_ids, var.subnet_ids)
```

## 前提知識
- EKS: AWS の Kubernetes のサービスです。Kubernetes の管理部分（コントロールプレーン）は AWS が運用します。
- サブネット: VPC の中の、IP アドレスの範囲です。どのサブネットを使うかで、通信の経路が変わります。
- セキュリティグループ: 通信を許可するルールの集まりです。
- `coalescelist(A, B)`: 最初に空でないリストを返します。リストの場合の `coalesce` です。
- `compact(リスト)`: リストから空の文字列や `null` を取り除きます。
- `distinct(リスト)`: 同じ値の重複を取り除きます。

## 何をしているか
### 1. サブネットは、指定が無ければ共通のものを使う

```hcl:line-numbers=81
    subnet_ids                = coalescelist(var.control_plane_subnet_ids, var.subnet_ids)
```

`control_plane_subnet_ids` が空でなければ、それを使います。空なら `subnet_ids` を使います。コントロールプレーンだけ別のサブネットに置きたい利用者は、この 1 つの変数を書けば済みます。

### 2. セキュリティグループは、整えてから渡す

```hcl:line-numbers=80
    security_group_ids        = compact(distinct(concat(var.additional_security_group_ids, [local.security_group_id])))
```

利用者の追加のセキュリティグループと、モジュールが作ったものを `concat` で 1 つにまとめます。`distinct` で重複を消し、`compact` で空の値を消します。外から渡された値が雑でも、AWS には整った一覧が届きます。

## ここがすごい
サブネットの指定を `coalescelist` で書くと、「空かどうか」という判断を 1 行に閉じ込められます。利用者が 2 つのサブネットを分けたいときも、何もしないときも、同じ式で正しく動きます。

また、セキュリティグループを `concat`、`distinct`、`compact` の 3 つで整えているのは、関数の組み合わせの良い例です。どれも小さな関数ですが、順番に通すと、「重複なし・空なし・モジュールの分も含む」という 1 つの約束になります。

## まとめ
- `coalescelist` で、リストの既定値を 1 行で書けます。
- `concat`、`distinct`、`compact` を組み合わせると、外から来た一覧を安全に整えられます。
- 既定値の仕組みを使うと、利用者は変えたいところだけを書けます。
