---
title: "認証プロバイダーの名前を、キーの値で補う"
description: "terraform-aws-eks の identity provider 設定。for_each のキーを、identity_provider_config_name の既定値として coalesce で使う。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [933, 944]
format: 2
function: "resource \"aws_eks_identity_provider_config\"（this・oidc）"
difficulty: 2
tags: ["API設計", "データ構造"]
---

## ひとことで
EKS のクラスターには、外部の OIDC の認証を追加できます。このとき、複数の認証の設定を、名前をキーにしたマップで渡せます。このコードは、認証の設定に名前を書かなかったら、マップのキーをそのまま名前として使います。利用者は、名前を 2 回書かずに済みます。

## コード
```hcl:line-numbers=933
resource "aws_eks_identity_provider_config" "this" {
  for_each = var.identity_providers != null && local.create && !local.create_outposts_local_cluster ? var.identity_providers : {}

  region = var.region

  cluster_name = aws_eks_cluster.this[0].id

  oidc {
    client_id                     = each.value.client_id
    groups_claim                  = each.value.groups_claim
    groups_prefix                 = each.value.groups_prefix
    identity_provider_config_name = coalesce(each.value.identity_provider_config_name, each.key)
```

## 前提知識
- identity provider config: EKS に、外部の OIDC 認証の情報を登録する設定です。登録したあと、そのユーザーの名前や所属グループを、Kubernetes の権限と結び付けられます。
- `for_each` にマップ: キーごとに 1 つのリソースを作ります。`each.key` がキー、`each.value` が値です。
- `coalesce(A, B)`: 空でない最初の値を返します。
- `groups_claim` や `username_claim`: トークンの中で、グループ名やユーザー名が入っている項目の名前です。
- `required_claims`: トークンに、この項目と値の組が無いと拒否する条件です。

## 何をしているか
### 1. 有効なときだけ、マップの要素を作る

```hcl:line-numbers=934
  for_each = var.identity_providers != null && local.create && !local.create_outposts_local_cluster ? var.identity_providers : {}
```

`identity_providers` が渡され、クラスターを作る状態で、Outposts のローカルクラスターではないときだけ、要素を作ります。どれかが偽なら、空のマップになります。

### 2. 名前は、指定が無ければキーを使う

```hcl:line-numbers=944
    identity_provider_config_name = coalesce(each.value.identity_provider_config_name, each.key)
```

利用者が `identity_provider_config_name` を書いていれば、それを使います。書いていなければ、マップのキーを名前にします。キーを `okta` と書けば、名前も `okta` になります。

### 3. 他の項目は、そのまま渡す

`client_id`、`issuer_url`、`groups_claim` などは、利用者の値をそのまま `oidc` ブロックに入れています。モジュールは、項目の意味を変えずに、AWS に渡すだけです。

## ここがすごい
マップのキーは、そのまま識別子として使えるので、利用者は名前を一度書けば済みます。さらに、名前を明示したいときは、`identity_provider_config_name` で上書きできます。既定と上書きが 1 行に収まっています。

また、キーを既定の名前にすることで、同じクラスターに複数の認証を並べても、名前が衝突しません。マップのキーの一意性が、そのまま名前の一意性になります。

## まとめ
- マップのキーを既定値に使うと、名前の書き忘れを防げます。
- `coalesce` は、指定が無いときだけ既定の値を使う、と読めます。
- 複数の設定を名前で並べると、キーが識別子になるので、扱いやすくなります。
