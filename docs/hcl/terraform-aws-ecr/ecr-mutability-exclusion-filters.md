---
title: "タグを変えさせない例外を、フィルタの一覧で作る"
description: "terraform-aws-ecr の image_tag_mutability_exclusion_filter。null なら空のリストを回し、指定があれば各フィルタを dynamic のブロックにする。"
language: hcl
project: "terraform-aws-ecr"
repo: https://github.com/terraform-aws-modules/terraform-aws-ecr
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "f05e615fa452e813935986295e7770f8fa96948b"
file: main.tf
lines: [194, 200]
format: 2
function: "resource \"aws_ecr_repository\"（dynamic \"image_tag_mutability_exclusion_filter\"）"
difficulty: 2
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
ECR のリポジトリには、イメージのタグを上書きできないように固定する設定があります。ただし、特定のタグだけは例外として上書きを許したい場合があります。このコードは、その例外のフィルタの一覧を受け取り、指定があるときだけ `dynamic` でブロックを作ります。

## コード
```hcl:line-numbers=194
  dynamic "image_tag_mutability_exclusion_filter" {
    for_each = var.repository_image_tag_mutability_exclusion_filter != null ? var.repository_image_tag_mutability_exclusion_filter : []
    content {
      filter      = image_tag_mutability_exclusion_filter.value.filter
      filter_type = image_tag_mutability_exclusion_filter.value.filter_type
    }
  }
```

## 前提知識
- イメージタグの可変性（image_tag_mutability）: `IMMUTABLE` なら、同じタグへの上書きを禁止します。`MUTABLE` なら、上書きを許します。
- 例外フィルタ（exclusion filter）: 全体は `IMMUTABLE` にしたまま、特定のタグのパターンだけを可変にする仕組みです。
- `filter` と `filter_type`: どのタグを対象にするかのパターンと、その種類（ワイルドカードなど）です。
- `dynamic` ブロック: 一覧の要素の数だけブロックを作ります。
- `null` と `[]`: 指定が無いときに、空のリストを使って、ブロックを作らないための書き方です。

## 何をしているか
### 1. 指定が無いときは、空のリストを回す

```hcl:line-numbers=195
    for_each = var.repository_image_tag_mutability_exclusion_filter != null ? var.repository_image_tag_mutability_exclusion_filter : []
```

フィルタの一覧が `null` なら、空のリストを回すので、ブロックは 1 つも作られません。一覧があれば、その要素の数だけブロックを作ります。

### 2. 各フィルタを、そのまま渡す

```hcl:line-numbers=197
      filter      = image_tag_mutability_exclusion_filter.value.filter
      filter_type = image_tag_mutability_exclusion_filter.value.filter_type
```

`image_tag_mutability_exclusion_filter.value` は、一覧の 1 つの要素です。`filter` と `filter_type` の 2 つを、そのまま AWS に渡します。モジュールは、パターンの意味を解釈していません。

## ここがすごい
「`null` のときは空のリストに置き換える」という一手間で、`dynamic` の書き方をそろえています。指定が無いときも、有るときも、同じ `for_each` の形で書けます。

また、例外のパターンを一覧で受け取るので、利用者は必要なだけ例外を足せます。全体は固定したまま、例外だけを増やせる、という安全な運用の形を、データの形で表しています。

## まとめ
- 省略可能な一覧は、`null` のときに `[]` を使うと、ブロックを作らずに済みます。
- 例外は一覧で受け取ると、全体の固定と、部分的な例外を両立できます。
- 一覧の中身をそのまま渡すと、モジュールが AWS の仕様を隠さずに済みます。
