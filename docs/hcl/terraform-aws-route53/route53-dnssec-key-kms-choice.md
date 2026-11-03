---
title: "DNSSEC の鍵を、新しく作るか既存を使うかで切り替える"
description: "terraform-aws-route53 の DNSSEC 鍵の署名。鍵の名前は coalesce でゾーン名に補い、KMS 鍵は作成フラグで自作か既存かを選ぶ。"
language: hcl
project: "terraform-aws-route53"
repo: https://github.com/terraform-aws-modules/terraform-aws-route53
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "883f987d6bb328c09bd4dfc5a04024534b371d59"
file: main.tf
lines: [101, 106]
format: 2
function: "resource \"aws_route53_key_signing_key\"（this）"
difficulty: 3
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
DNSSEC は、DNS の答えが改ざんされていないかを、電子署名で確かめる仕組みです。Route 53 で DNSSEC を有効にするには、署名に使う鍵（KSK）を作り、その鍵を暗号化する KMS の鍵が必要です。このコードは、鍵の名前をゾーン名で補い、KMS の鍵をモジュールで作るか、利用者の既存のものを使うかを切り替えます。

## コード
```hcl:line-numbers=101
  count = var.create && var.enable_dnssec ? 1 : 0

  name                       = try(coalesce(var.dnssec_key_signing_key_name, local.zone_name), "")
  hosted_zone_id             = local.zone_id
  key_management_service_arn = var.create_dnssec_kms_key ? module.route53_dnssec_kms.key_arn : var.dnssec_kms_key_arn
}
```

## 前提知識
- DNSSEC: DNS の応答に電子署名を付け、受け取った側が偽物でないかを確かめられるようにする仕組みです。
- KSK（鍵署名鍵）: DNSSEC の署名の中心になる鍵です。Route 53 では、KMS の鍵で暗号化して管理します。
- KMS（鍵管理サービス）: 暗号鍵を安全に保管し、暗号化や署名に使わせるサービスです。
- `coalesce`: 空でない最初の値を返します。
- `try`: エラーのときに代わりの値を返します。
- 三項演算子: 条件に応じて、2 つの値のどちらかを選びます。

## 何をしているか
### 1. 有効なときだけ作る

```hcl:line-numbers=101
  count = var.create && var.enable_dnssec ? 1 : 0
```

モジュールを作り、かつ DNSSEC を有効にするときだけ、鍵の設定を 1 つ作ります。どちらか欠ければ、何も作られません。

### 2. 鍵の名前が無ければ、ゾーン名を使う

```hcl:line-numbers=103
  name                       = try(coalesce(var.dnssec_key_signing_key_name, local.zone_name), "")
```

利用者が `dnssec_key_signing_key_name` を指定していれば、その名前を使います。空なら、`local.zone_name` をゾーン名として使います。外側の `try` は、ゾーン名も取れないときに空文字を入れて、エラーを避けます。

### 3. KMS の鍵を、作るか既存のものにするか選ぶ

```hcl:line-numbers=105
  key_management_service_arn = var.create_dnssec_kms_key ? module.route53_dnssec_kms.key_arn : var.dnssec_kms_key_arn
```

`create_dnssec_kms_key` が真なら、このモジュールの中で作った KMS 鍵の ARN を使います。偽なら、利用者が `dnssec_kms_key_arn` で渡した ARN をそのまま使います。どちらの場合も、後ろの鍵のリソースは同じ属性を見るだけでよい形になっています。

## ここがすごい
鍵の名前とゾーンの情報を、利用者が書かなくても補えるようにしているので、最小限の入力で DNSSEC を始められます。`coalesce` の「空なら次」という規則が、そのまま既定値の仕組みになっています。

また、KMS の鍵を「作る」か「渡す」かの選択を、1 行の三項演算子に閉じ込めています。会社の方針で鍵を一元管理している利用者も、モジュールに任せたい利用者も、同じ変数名で切り替えられます。

## まとめ
- DNSSEC は、署名用の鍵と、それを守る KMS 鍵の 2 つで考えると分かりやすくなります。
- `coalesce` で、空の値の代わりを順に探せます。
- 作成のフラグと既存の ARN を並べると、「作る」と「使う」の切り替えを 1 行で書けます。
