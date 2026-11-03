---
title: "検証用のドメインを、ワイルドカードを外して重複なく並べる"
description: "terraform-aws-acm の validation_domains。検証のオプションを for 式で回し、先頭の \"*.\" を取り除き、distinct で重複を消す。"
language: hcl
project: "terraform-aws-acm"
repo: https://github.com/terraform-aws-modules/terraform-aws-acm
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "d461daf01f5d11bf116b82cdd9680a29772eb8f7"
file: main.tf
lines: [12, 16]
format: 2
function: "locals（validation_domains の distinct と for 式）"
difficulty: 3
tags: ["データ構造", "防御的プログラミング"]
---

## ひとことで
ACM で証明書を発行するときは、ドメインごとに検証の情報が必要です。ワイルドカードの証明書では、`*.example.com` と `example.com` の検証が同じレコードになることがあります。このコードは、ワイルドカードの `*.` を外し、同じドメインを一つにまとめています。

## コード
```hcl:line-numbers=12
  validation_domains = local.create_certificate || local.create_route53_records_only ? distinct(
    [for k, v in try(aws_acm_certificate.this[0].domain_validation_options, var.acm_certificate_domain_validation_options) : merge(
      tomap(v), { domain_name = replace(v.domain_name, "*.", "") }
    )]
  ) : []
```

## 前提知識
- ドメインの検証: 証明書を発行するとき、AWS はドメインの所有を DNS などで確かめます。その情報が `domain_validation_options` です。
- `try(式, 代わりの値)`: 作られていれば証明書の検証情報を、無ければ利用者の指定を使います。
- `distinct(リスト)`: 同じ要素を一つにまとめます。

## 何をしているか
### 1. 検証情報を一つずつ回し、ワイルドカードを外す

```hcl:line-numbers=13
    [for k, v in try(aws_acm_certificate.this[0].domain_validation_options, var.acm_certificate_domain_validation_options) : merge(
      tomap(v), { domain_name = replace(v.domain_name, "*.", "") }
    )]
```

`for` 式が検証情報を回し、`replace` で `*.` を空文字にします。`*.example.com` が `example.com` になります。

### 2. 同じドメインを一つにまとめる

```hcl:line-numbers=12
  validation_domains = local.create_certificate || local.create_route53_records_only ? distinct(
```

`distinct` が、同じドメインの重複を取り除きます。作成するときだけ、この一覧を使います。作らない場合は、空のリストになります。

## ここがすごい
ワイルドカードの扱いを、検証の一覧を作る段階で吸収しています。利用者が `*.` を気にせず書けるので、同じドメインの検証レコードが二つできることを防げます。

## まとめ
- `replace` を `for` 式の中で使うと、一覧の全要素に同じ整形ができます。
- `distinct` は、重複する検証を減らす定番の道具です。
- 作成と参照の両方に対応するには、`try` で値の出どころを切り替えると安全です。
