---
title: "ドメインごとの Route 53 ゾーンを、マップから探す"
description: "terraform-aws-acm の検証レコード。ドメイン名をキーにした zones のマップを lookup で引き、見つからなければ既定のゾーン ID を使う。"
language: hcl
project: "terraform-aws-acm"
repo: https://github.com/terraform-aws-modules/terraform-aws-acm
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "d461daf01f5d11bf116b82cdd9680a29772eb8f7"
file: main.tf
lines: [54, 57]
format: 2
function: "resource \"aws_route53_record\"（validation）"
difficulty: 2
tags: ["ネットワーク", "データ構造"]
---

## ひとことで
証明書の検証レコードは、そのドメインを管理している Route 53 のゾーンに作る必要があります。複数のドメインがそれぞれ別のゾーンにあるときは、どのドメインがどのゾーンかを、利用者が教えなければなりません。このコードは、ドメイン名をキーにした `zones` のマップを `lookup` で引き、見つからなければ既定のゾーン ID を使います。

## コード
```hcl:line-numbers=54
  zone_id = lookup(var.zones, element(local.validation_domains, count.index)["domain_name"], var.zone_id)
  name    = element(local.validation_domains, count.index)["resource_record_name"]
  type    = element(local.validation_domains, count.index)["resource_record_type"]
  ttl     = var.dns_ttl
```

## 前提知識
- Route 53 のゾーン（ホストゾーン）: DNS のレコードを管理する単位です。ドメインごとに 1 つ持つことが多いです。
- 検証レコード: ACM が DNS 検証のために求める、決まった名前と値の CNAME レコードです。
- `lookup(マップ, キー, 既定値)`: マップにキーがあればその値を、無ければ既定値を返します。
- `element(リスト, 番号)`: リストの指定した番号の要素を取り出します。
- `count.index`: `count` で作ったリソースの、0 から始まる番号です。
- `ttl`: DNS の応答を、キャッシュしてよい秒数です。

## 何をしているか
### 1. ゾーン ID を、ドメイン名から探す

```hcl:line-numbers=54
  zone_id = lookup(var.zones, element(local.validation_domains, count.index)["domain_name"], var.zone_id)
```

`element(local.validation_domains, count.index)` で、今作っている検証項目を 1 つ取り出し、その `domain_name` をキーにして `var.zones` を引きます。見つかれば、そのドメイン用のゾーン ID を使います。見つからなければ、既定の `var.zone_id` を使います。

### 2. レコードの名前と種類は、検証項目から取る

```hcl:line-numbers=55
  name    = element(local.validation_domains, count.index)["resource_record_name"]
  type    = element(local.validation_domains, count.index)["resource_record_type"]
```

レコードの名前と種類は、ACM が返した検証項目から取ります。利用者は、これらを自分で書く必要がありません。

### 3. TTL は利用者の値

```hcl:line-numbers=57
  ttl     = var.dns_ttl
```

TTL は、利用者が `dns_ttl` で決めた値をそのまま使います。

## ここがすごい
「マップで探し、無ければ既定」という形は、複数ゾーンと単一ゾーンの両方を同じ書き方で扱えます。ドメインが 1 つだけの利用者は `zone_id` を渡すだけでよく、複数の利用者は `zones` で分けられます。

さらに、`element` と `count.index` で、検証項目を 1 つずつ対応させています。ドメインの数だけレコードが作られ、それぞれが自分のゾーンを探すという、単純で読みやすい仕組みです。

## まとめ
- `lookup` の既定値で、マップにないキーを安全に扱えます。
- `count.index` と `element` の組み合わせで、リストの要素を 1 つずつ対応させられます。
- 1 つのゾーンのときも複数のゾーンのときも、同じ式で動くようにできます。
