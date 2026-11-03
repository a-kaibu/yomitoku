---
title: "二重の入れ子のリストを、flatten で 1 本にそろえる"
description: "terraform-aws-acm の証明書検証。DNS レコードの fqdn の一覧と、利用者が渡した fqdn の一覧を flatten で 1 本のリストにして渡す。"
language: hcl
project: "terraform-aws-acm"
repo: https://github.com/terraform-aws-modules/terraform-aws-acm
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "d461daf01f5d11bf116b82cdd9680a29772eb8f7"
file: main.tf
lines: [71, 74]
format: 2
function: "resource \"aws_acm_certificate_validation\"（this）"
difficulty: 2
tags: ["データ構造", "API設計"]
---

## ひとことで
ACM の証明書を検証するリソースは、検証に使った DNS レコードの FQDN（完全なドメイン名）の一覧を必要とします。その一覧は、このモジュールが作った DNS レコードと、利用者が外で作った名前の 2 つから来ます。このコードは、2 つのリストを `flatten` で 1 本にまとめて渡しています。

## コード
```hcl:line-numbers=71
  certificate_arn = aws_acm_certificate.this[0].arn
  region          = var.region

  validation_record_fqdns = flatten([aws_route53_record.validation[*].fqdn, var.validation_record_fqdns])
```

## 前提知識
- ACM 証明書の検証: 証明書が本当にそのドメインのものかを、DNS か E メールで確かめる手続きです。DNS 検証では、決まったレコードが存在するかを AWS が見ます。
- FQDN: `www.example.com.` のように、ホスト名をすべて含んだドメイン名です。
- `[*]`（スプラット式）: リストのリソースから、同じ属性の値を全部取り出して、リストにします。`count` で作ったリソースに使います。
- `flatten`: 入れ子のリストを、1 段のリストにつなげる関数です。`[[a, b], [c]]` は `[a, b, c]` になります。
- `count` が 0 のとき: `aws_route53_record.validation[*]` は空のリストになります。

## 何をしているか
### 1. 証明書の ARN を渡す

```hcl:line-numbers=71
  certificate_arn = aws_acm_certificate.this[0].arn
```

検証の対象は、このモジュールで作った証明書です。`[0]` は `count` で作った 1 つ目のリソースを指します。

### 2. 2 つのリストを、ひとつにまとめる

```hcl:line-numbers=74
  validation_record_fqdns = flatten([aws_route53_record.validation[*].fqdn, var.validation_record_fqdns])
```

`aws_route53_record.validation[*].fqdn` は、このモジュールが作った検証レコードの FQDN のリストです。`var.validation_record_fqdns` は、利用者が別の場所で作ったレコードの FQDN のリストです。どちらもリストなので、そのまま並べると「リストのリスト」になります。`flatten` が外側の括弧を取り去り、1 つのリストにします。

どちらかが空でも、もう一方だけで正しいリストになります。レコードをこのモジュールで作らない場合は、`[*]` が空になり、利用者の一覧だけが残ります。

## ここがすごい
「作ったもの」と「利用者が渡したもの」を、同じ変数で扱えるように揃えているところがよいです。後ろの検証リソースは、どこから FQDN が来たかを気にする必要がありません。

さらに、`[*]` は `count` が 0 のときに、エラーを出さずに空のリストを返します。ドメインの検証を外部のレコードだけで行う利用者にとって、この書き方は自然です。

## まとめ
- `flatten` は、入れ子のリストを 1 段にまとめます。リストを結合するときの定番です。
- `[*]` は、`count` で作ったリソースから属性を集めるときに使います。
- 作成元が違う値も、同じ形のリストにそろえると、後ろのリソースが一度に扱えます。
