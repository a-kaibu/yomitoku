---
title: "地域の制限は、必ず 1 つ作って中の制限を入れ子にする"
description: "terraform-aws-cloudfront の restrictions。for_each に [var.restrictions] を渡して親を必ず 1 つ作り、その中で geo_restriction を入れ子の dynamic で作る。"
language: hcl
project: "terraform-aws-cloudfront"
repo: https://github.com/terraform-aws-modules/terraform-aws-cloudfront
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "5b9a0a480220b84f29f02d84ff71dd5340953f68"
file: main.tf
lines: [284, 297]
format: 2
function: "resource \"aws_cloudfront_distribution\"（dynamic \"restrictions\"・geo_restriction）"
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
CloudFront（配信ネットワーク）には、特定の国や地域からのアクセスを許可・拒否する設定があります。その設定は「restrictions」という親のブロックの中に、「geo_restriction」という子のブロックとして書かれます。このコードは、親を必ず 1 つ作り、その中に地域の制限を入れ子の `dynamic` で作ります。

## コード
```hcl:line-numbers=284
  dynamic "restrictions" {
    for_each = [var.restrictions]

    content {
      dynamic "geo_restriction" {
        for_each = [restrictions.value.geo_restriction]

        content {
          restriction_type = geo_restriction.value.restriction_type
          locations        = geo_restriction.value.locations
        }
      }
    }
  }
```

## 前提知識
- CloudFront ディストリビューション: コンテンツを世界中のエッジから配信する、AWS の CDN の設定単位です。
- 地域の制限（geo restriction）: 国や地域のリストを使って、アクセスを許可（whitelist）または拒否（blacklist）する設定です。
- `restriction_type`: `whitelist` か `blacklist` のどちらかです。
- `locations`: 国コードのリストです。
- `[値]` を `for_each` に渡すと: 要素が 1 つのリストになり、ブロックは必ず 1 回だけ作られます。

## 何をしているか
### 1. 親のブロックを、必ず 1 つ作る

```hcl:line-numbers=285
    for_each = [var.restrictions]
```

`var.restrictions` を 1 要素のリストに包んでいます。`restrictions` のブロックは、CloudFront の設定の中で必ず 1 つ必要ですが、`dynamic` の形で書けるように、この包み方をしています。値が `null` でも、ブロックは 1 つ作られます。

### 2. 子の地域制限を、入れ子で作る

```hcl:line-numbers=288
      dynamic "geo_restriction" {
        for_each = [restrictions.value.geo_restriction]
```

親の `restrictions.value` の中の `geo_restriction` を、同じ 1 要素のリストで包み、子のブロックを作ります。親と子の両方で `.value` を使うことで、外側の値を内側から参照できます。

### 3. 種類と国のリストを渡す

```hcl:line-numbers=292
          restriction_type = geo_restriction.value.restriction_type
          locations        = geo_restriction.value.locations
```

許可か拒否か（`restriction_type`）と、国のリスト（`locations`）をそのまま渡します。どの国を対象にするかは、利用者が決めます。

## ここがすごい
必ず 1 つ必要なブロックを、`for_each` で 1 要素のリストにして扱う書き方は、「作るかどうか」の判定を書かずに済みます。この書き方を使うと、親は常に 1 つ、子は中の値次第、という構造が一目で読めます。

また、子の地域制限も同じ書き方で、親の値から取り出しています。親子で同じ形の `dynamic` が続くので、読み手は 1 つの型を理解すれば、入れ子全体が読めます。

## まとめ
- 必ず 1 つのブロックも、`for_each = [値]` の形にそろえると、書き方を統一できます。
- 入れ子の `dynamic` では、外側の `.value` を使って子の値を取り出します。
- 種類（許可・拒否）と対象（国のリスト）を分けて渡すと、設定の意味が分かりやすくなります。
