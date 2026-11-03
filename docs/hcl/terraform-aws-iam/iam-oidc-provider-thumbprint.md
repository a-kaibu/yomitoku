---
title: "OIDC の証明書の指紋を、tls データソースで自動的に取る"
description: "terraform-aws-iam の iam-oidc-provider。tls_certificate データソースで発行者の証明書チェーンを読み、thumbprint_list に指紋をそのまま渡す書き方。"
language: hcl
project: "terraform-aws-iam"
repo: https://github.com/terraform-aws-modules/terraform-aws-iam
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "da8e6a8673933ee651f0f0fe611d5ac6b9f9bcb9"
file: modules/iam-oidc-provider/main.tf
lines: [13, 24]
format: 2
function: "resource \"aws_iam_openid_connect_provider\""
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
OIDC プロバイダーを IAM に登録するには、発行者の証明書の指紋（thumbprint）が必要です。このモジュールは、`tls_certificate` というデータソースで発行者の URL から証明書を読み込み、その指紋を自動で取り出して渡します。利用者は、指紋を手で調べて書く必要がありません。

## コード
```hcl:line-numbers=13
data "tls_certificate" "this" {
  count = var.create ? 1 : 0

  url = var.url
}

resource "aws_iam_openid_connect_provider" "this" {
  count = var.create ? 1 : 0

  url             = var.url
  client_id_list  = coalescelist(var.client_id_list, ["sts.${local.dns_suffix}"])
  thumbprint_list = data.tls_certificate.this[0].certificates[*].sha1_fingerprint
```

## 前提知識
- OIDC（OpenID Connect）: ログインや認証の情報を、外部の発行者（GitHub、Kubernetes など）から受け取る仕組みです。
- 証明書の指紋（thumbprint）: 証明書の内容から作られる短い値です。改ざんの確認に使われます。
- `data "tls_certificate"`: 指定した URL の TLS 証明書チェーンを読み込むデータソースです。
- `certificates[*].sha1_fingerprint`: 証明書チェーンの各証明書の SHA-1 の指紋を、リストで取り出す書き方です。
- `coalescelist(リストA, リストB)`: 最初に空でないリストを返します。ここでは、利用者が指定しなければ既定の値を使います。
- `"sts.${local.dns_suffix}"`: STS（AWS の一時認証の仕組み）の宛先を、パーティションの DNS サフィックスから作ります。

## 何をしているか
### 1. 発行者の証明書を読み込む
```hcl:line-numbers=13
data "tls_certificate" "this" {
  count = var.create ? 1 : 0

  url = var.url
}
```

`data "tls_certificate" "this"` は、`var.url` の証明書チェーンを読み込みます。`count` によって、モジュールを作るときだけ読みます。読み込みはネットワーク越しに行われるため、作らない場合は実行されないようになっています。

### 2. 指紋を一覧にして渡す
```hcl:line-numbers=22
  url             = var.url
  client_id_list  = coalescelist(var.client_id_list, ["sts.${local.dns_suffix}"])
  thumbprint_list = data.tls_certificate.this[0].certificates[*].sha1_fingerprint
```

`thumbprint_list = data.tls_certificate.this[0].certificates[*].sha1_fingerprint` は、証明書チェーンに含まれる全部の証明書の指紋を、リストで渡します。利用者は、どの証明書を使うかを選ばなくても、チェーン全体の指紋が登録されます。

### 3. 宛先の既定値を決める
```hcl:line-numbers=23
  client_id_list  = coalescelist(var.client_id_list, ["sts.${local.dns_suffix}"])
```

`client_id_list` は、利用者が指定しなければ `sts.<DNS サフィックス>` を使います。`coalescelist` で既定の一覧を補っているので、よく使われる構成では設定を省略できます。

## ここがすごい
指紋を手で調べて書くと、証明書の更新のたびに設定を直す必要があります。このモジュールは、読み込みを毎回行うので、証明書が更新された後の `plan` で、新しい指紋を自動的に反映できます。

また、チェーンのすべての指紋を渡すことで、証明書の一部だけが変わっても、登録が壊れにくくなります。読み込みの結果をそのまま使うという単純な形に、安全性を寄せています。

## まとめ
- `tls_certificate` データソースで、証明書の指紋を自動で取得できます。
- `[*]` を使うと、証明書チェーンの全部の指紋をリストで渡せます。
- 既定の値を `coalescelist` で補うと、よく使う設定を省略できます。

