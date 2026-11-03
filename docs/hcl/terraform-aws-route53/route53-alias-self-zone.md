---
title: "「self」と書くだけで、同じゾーンを指す ALIAS レコード"
description: "terraform-aws-route53 のレコード作成。ALIAS の zone_id に \"self\" と書くと、このモジュールが管理するゾーンの ID に置き換わる。"
language: hcl
project: "terraform-aws-route53"
repo: https://github.com/terraform-aws-modules/terraform-aws-route53
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "883f987d6bb328c09bd4dfc5a04024534b371d59"
file: main.tf
lines: [143, 156]
format: 2
function: "resource \"aws_route53_record\"（this・dynamic \"alias\"）"
difficulty: 2
tags: ["API設計", "ネットワーク"]
---

## ひとことで
Route 53 の ALIAS レコードは、ELB や CloudFront などの AWS のリソースに、ドメイン名を向けるための仕組みです。その向け先を示す「ホストゾーン ID」は、同じモジュールで作ったゾーンを指したいことが多いです。このコードは、利用者が `"self"` と書くと、モジュールが管理しているゾーンの ID に自動で置き換えます。

## コード
```hcl:line-numbers=143
resource "aws_route53_record" "this" {
  for_each = { for k, v in var.records : k => v if var.create }

  dynamic "alias" {
    for_each = each.value.alias != null ? [each.value.alias] : []

    content {
      evaluate_target_health = each.value.alias.evaluate_target_health
      name                   = each.value.alias.name
      zone_id                = each.value.alias.zone_id == "self" ? local.zone_id : each.value.alias.zone_id
    }
  }

  allow_overwrite = each.value.allow_overwrite
```

## 前提知識
- Route 53: AWS の DNS サービスです。ドメイン名を IP アドレスや別のドメインに結び付けるレコードを管理します。
- ALIAS レコード: 向け先が AWS のリソースのときに使う、Route 53 独自のレコードです。`name` に向け先の DNS 名、`zone_id` にその向け先のホストゾーン ID を書きます。
- `for_each` と `if`: `{ for k, v in 集まり : k => v if 条件 }` の形で、条件に合う要素だけでリソースを作ります。
- `dynamic` ブロックの `alias`: `alias` を使うときだけ、1 つ作ります。
- 三項演算子 `条件 ? A : B`: 条件に応じて値を選びます。

## 何をしているか
### 1. 作成フラグが真のときだけ、レコードを作る

```hcl:line-numbers=144
  for_each = { for k, v in var.records : k => v if var.create }
```

`var.records` は、レコードの名前をキーにしたマップです。`create` が偽なら空になり、レコードは作られません。キーがそのままリソースの識別子になるので、レコードを追加しても、他のレコードが作り直されることはありません。

### 2. alias があれば、そのブロックを作る

```hcl:line-numbers=146
  dynamic "alias" {
    for_each = each.value.alias != null ? [each.value.alias] : []
```

`alias` が `null` でなければ、1 回だけブロックを作ります。ALIAS でないレコード（A や CNAME など）では、`null` なのでブロック自体が作られません。

### 3. "self" を、このゾーンの ID に置き換える

```hcl:line-numbers=152
      zone_id                = each.value.alias.zone_id == "self" ? local.zone_id : each.value.alias.zone_id
```

利用者が `zone_id = "self"` と書いた場合は、`local.zone_id` を使います。`local.zone_id` は、このモジュールが作った、または参照したホストゾーンの ID です。そのほかの文字列なら、利用者が書いた ID をそのまま使います。

## ここがすごい
ゾーン ID は、作成して初めて分かる値です。利用者が ALIAS を書くときに、ゾーンの ID を知らないことは普通にあります。`"self"` という合言葉を用意すると、ゾーンを作るのと同時に、同じ構成の中のレコードが正しい ID を指せます。

また、`evaluate_target_health` や `allow_overwrite` のように、利用者が書く値をそのまま渡している点も大切です。特別扱いするのは `zone_id` だけなので、読み手は「ここだけ変わる」と分かります。

## まとめ
- `for_each` と `if` で、作成フラグを一覧の段階で絞れます。
- `dynamic` で、ALIAS のように任意で必要なブロックだけを作れます。
- `"self"` のような合言葉を 1 つ決めると、作成前の値を利用者が知らなくても参照できます。
