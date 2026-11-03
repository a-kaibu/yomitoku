---
title: "ポリシー名は、利用者の名前か、接頭辞付きの既定名にする"
description: "terraform-aws-eks-pod-identity の App Mesh ポリシー名。利用者が名前を渡せばそれを、無ければ policy_name_prefix を付けた既定の名前を coalesce で使う。"
language: hcl
project: "terraform-aws-eks-pod-identity"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks-pod-identity
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "f72040b99272c264e0340f44758219e0808a52a2"
file: aws_appmesh.tf
lines: [101, 103]
format: 2
function: "locals（appmesh_controller_policy_name）"
difficulty: 1
tags: ["API設計", "セキュリティ"]
---

## ひとことで
EKS の Pod Identity は、Kubernetes の Pod に IAM のロールを割り当てる仕組みです。AWS App Mesh のコントローラーにも、そのためのポリシーを作ります。ポリシーには名前が必要ですが、同じ AWS アカウントに複数のクラスターを作ると、名前がぶつかることがあります。このコードは、利用者が名前を指定しなければ、接頭辞を付けた既定の名前を使います。

## コード
```hcl:line-numbers=101
locals {
  appmesh_controller_policy_name = coalesce(var.appmesh_controller_policy_name, "${var.policy_name_prefix}AppMeshController")
}
```

## 前提知識
- EKS Pod Identity: Pod に IAM ロールを直接結び付ける仕組みです。
- IAM ポリシーの名前: アカウントの中で一意である必要があります。同じ名前は 2 つ作れません。
- App Mesh: サービス間の通信を管理する AWS のサービスです。その Controller が、AWS の API を呼ぶための権限を必要とします。
- `coalesce(A, B)`: 空でない最初の値を返します。
- `"${...}"`: 変数の値を、文字列の中に埋め込みます。
- `policy_name_prefix`: 名前の前に付ける文字列です。複数の環境を区別できます。

## 何をしているか
### 1. 利用者の名前を、最優先で使う

```hcl:line-numbers=102
  appmesh_controller_policy_name = coalesce(var.appmesh_controller_policy_name, "${var.policy_name_prefix}AppMeshController")
```

利用者が `appmesh_controller_policy_name` を指定していれば、その名前を使います。空なら、2 番目の候補の文字列を使います。

### 2. 既定の名前は、接頭辞と役割名を組み合わせる

`"${var.policy_name_prefix}AppMeshController"` は、接頭辞の後ろに `AppMeshController` をつなげた文字列です。接頭辞を環境名（例: `prod-`）にしておけば、別のクラスターのポリシーと名前がぶつかりません。

## ここがすごい
既定の名前を、接頭辞と役割名に分けて作っているので、同じモジュールを複数の環境で使っても、名前の衝突を防げます。利用者は接頭辞を 1 つ決めるだけで、すべてのポリシーの名前を整えられます。

また、個別の名前は `coalesce` で最優先になっています。既存のポリシーを使いたい利用者は、名前を明示すれば、接頭辞の仕組みを無視できます。既定の仕組みと、上書きの仕組みが 1 行に収まっています。

## まとめ
- `coalesce(個別の指定, 既定の組み立て)` で、名前の上書きと既定を両立できます。
- 接頭辞を付けると、同じアカウントの中での名前の衝突を避けられます。
- 文字列の埋め込みで、既定の名前を読みやすく組み立てられます。
