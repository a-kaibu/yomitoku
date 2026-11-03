---
title: "設定が 1 つでもあれば website を作る anytrue"
description: "terraform-aws-s3-bucket の website。4 つの項目のどれかが null でなければ website を作る判定を、anytrue と try で 1 つの式にまとめる書き方。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [52, 57]
format: 2
function: "locals（has_website）"
difficulty: 2
tags: ["型システム", "イディオム"]
---

## ひとことで
`has_website` は、利用者が website の設定を 1 つでも書いたかどうかを判定する真偽値です。4 つの項目のどれかが `null` でなければ真になり、それによって website の設定を作るかどうかが決まります。

## コード
```hcl:line-numbers=52
  has_website = anytrue([
    try(var.website.index_document, null) != null,
    try(var.website.error_document, null) != null,
    try(var.website.redirect_all_requests_to, null) != null,
    try(var.website.routing_rules, null) != null,
  ])
```

## 前提知識
- `anytrue(リスト)`: リストの中に 1 つでも真があれば真を返します。`alltrue` の逆です。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。ここでは `website` が `null` でも、判定がエラーにならないようにしています。
- `!= null`: 値がないかどうかを確かめる式です。
- `var.website`: 利用者が渡す設定のオブジェクトです。
- 4 つの項目: `index_document`、`error_document`、`redirect_all_requests_to`、`routing_rules` です。

## 何をしているか
### 1. 1 つずつ、設定があるかを見る
```hcl:line-numbers=53
    try(var.website.index_document, null) != null,
    try(var.website.error_document, null) != null,
    try(var.website.redirect_all_requests_to, null) != null,
    try(var.website.routing_rules, null) != null,
```

各行は、`try(var.website.項目, null) != null` の形です。`var.website` 自体が `null` でも、`try` によって `null` が返るので、比較がエラーになりません。4 つの項目の、それぞれの判定が並んでいます。

### 2. どれか 1 つでも真なら作る
```hcl:line-numbers=52
  has_website = anytrue([
    try(var.website.index_document, null) != null,
    try(var.website.error_document, null) != null,
    try(var.website.redirect_all_requests_to, null) != null,
    try(var.website.routing_rules, null) != null,
  ])
```

`anytrue([...])` は、4 つのうち 1 つでも値があれば真を返します。すべて `null` のときだけ偽になり、website の設定は作られません。

## ここがすごい
すべての項目が `null` のオブジェクトと、オブジェクトそのものが無いことは、AWS の設定の上では同じ意味になります。このモジュールは、その同じ意味を、判定の式として明確に書いています。

また、`try` と `!= null` の組み合わせを、4 つの項目で同じ形にそろえているので、読み手は 1 行を理解すれば全部が分かります。

コードの近くには、判定が「属性の存在」だけを見て、中身は見ない、という説明のコメントもあります。ルールの転送先は作成後に決まる ARN のことが多く、中身を `try` や `coalesce` で調べると、判定が不安定になるからです。

## まとめ
- `anytrue` は、いくつかの条件のどれかが満たされるかを 1 行で判定します。
- `try` で囲むと、親のオブジェクトが無くても判定が安全になります。
- 同じ形の判定を並べると、読みやすさと保守性が上がります。

