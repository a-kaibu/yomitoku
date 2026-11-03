---
title: "OIDC の対象者を、重複と空を除いて 1 つにまとめる"
description: "terraform-aws-eks の OIDC プロバイダー。STS の対象者と利用者の追加分を concat で連結し、distinct と compact で重複と空の値を取り除く。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [523, 525]
format: 2
function: "resource \"aws_iam_openid_connect_provider\"（oidc_provider）"
difficulty: 2
tags: ["セキュリティ", "データ構造"]
---

## ひとことで
EKS のクラスターには、OIDC（認証の仕組み）のプロバイダーを作ると、Pod が IAM ロールを使えるようになります（IRSA）。このプロバイダーは、どの対象者（オーディエンス）からのトークンを受けつけるかを、リストで決めます。このコードは、既定の `sts.amazonaws.com` と、利用者の追加分を 1 つのリストにまとめます。

## コード
```hcl:line-numbers=523
  client_id_list  = distinct(compact(concat(["sts.amazonaws.com"], var.openid_connect_audiences)))
  thumbprint_list = concat(local.oidc_root_ca_thumbprint, var.custom_oidc_thumbprints)
  url             = aws_eks_cluster.this[0].identity[0].oidc[0].issuer
```

## 前提知識
- OIDC（OpenID Connect）: 外部の認証の仕組みで発行されたトークンを、AWS が信頼できるようにする仕組みです。
- IRSA（IAM Roles for Service Accounts）: Kubernetes のサービスアカウントに、IAM ロールを結び付ける仕組みです。
- 対象者（audience）: トークンが、どのサービス向けに発行されたかを表す値です。
- `thumbprint`: OIDC の発行元の証明書の指紋です。AWS が発行元を確かめるために使います。
- `distinct` / `compact` / `concat`: 重複の除去、空の除去、リストの連結を行う関数です。

## 何をしているか
### 1. 既定の対象者と、利用者の追加分をつなげる

```hcl:line-numbers=523
  client_id_list  = distinct(compact(concat(["sts.amazonaws.com"], var.openid_connect_audiences)))
```

`concat` で、`sts.amazonaws.com`（AWS の STS 向け）と、利用者の `openid_connect_audiences` をつなげます。`compact` で空の値を取り除き、`distinct` で同じ値の重複を消します。

結果として、既定の対象者は必ず含まれ、利用者が同じ値を書いても 1 つにまとまります。

### 2. 指紋は、既定の値と追加分を連結する

```hcl:line-numbers=524
  thumbprint_list = concat(local.oidc_root_ca_thumbprint, var.custom_oidc_thumbprints)
```

発行元の指紋も、モジュールが計算した既定の値と、利用者が渡した値を `concat` でつなげます。

### 3. 発行元の URL は、クラスターから取る

```hcl:line-numbers=525
  url             = aws_eks_cluster.this[0].identity[0].oidc[0].issuer
```

OIDC の発行元の URL は、作成したクラスターの情報から取ります。利用者は URL を書く必要がありません。

## ここがすごい
既定の値と利用者の追加分を、同じ「連結 → 整理」の型で扱っています。`distinct` と `compact` を通すことで、利用者が重複や空の値を混ぜても、AWS には整ったリストが届きます。

さらに、既定の対象者を先頭に必ず入れるという設計により、IRSA の基本の動きが、利用者の設定に左右されません。追加はできても、基本は消せない形になっています。

## まとめ
- 既定の値と追加分は、`concat` で連結すると、両方を合わせて扱えます。
- `distinct` と `compact` は、外から来た一覧を安全に整える定番の組み合わせです。
- 発行元の情報は、作成したリソースから取ると、利用者の入力を減らせます。
