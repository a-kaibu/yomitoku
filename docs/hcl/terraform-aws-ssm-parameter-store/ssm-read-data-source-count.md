---
title: "読み取る SSM パラメータの数だけ、データソースを作る"
description: "terraform-aws-ssm-parameter-store の data \"aws_ssm_parameter\"。読み取る名前の一覧の長さを count にして、一つずつ名前を取り出す。"
language: hcl
project: "terraform-aws-ssm-parameter-store"
repo: https://github.com/cloudposse/terraform-aws-ssm-parameter-store
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "27001b2644d69f2e33c35fb09999f98517d5381d"
file: main.tf
lines: [8, 11]
format: 2
function: "data \"aws_ssm_parameter\" \"read\"（count と element）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
SSM パラメータストアには、値を読むだけのデータソースがあります。このモジュールは、読み取る名前の一覧を用意して、その数だけデータソースを作ります。一覧が空なら、読み取りは一つも行われません。

## コード
```hcl:line-numbers=8
data "aws_ssm_parameter" "read" {
  count = length(local.parameter_read)
  name  = element(local.parameter_read, count.index)
}
```

## 前提知識
- データソース: 既存の資源の情報を読むブロックです。作成はしません。
- `count`: 数を指定して、同じブロックを複数作ります。`0` なら、一つも作られません。
- `element(リスト, 番号)`: リストから、指定の位置の値を取り出します。

## 何をしているか
### 1. 件数を、読み取る名前の数にする

```hcl:line-numbers=9
  count = length(local.parameter_read)
```

`local.parameter_read` の長さだけ、データソースを作ります。名前が三つあれば、三つ作られます。

### 2. 番号に対応する名前を、一つずつ使う

```hcl:line-numbers=10
  name  = element(local.parameter_read, count.index)
```

`element` が、番号に対応する名前を取り出します。`count.index` の番号が、リストの位置と一致します。

## ここがすごい
データソースの数を、リストの長さだけで決めています。利用者が読みたいパラメータを増やしても、ブロックを書き足す必要はありません。

## まとめ
- `count` をリストの長さにすると、一覧に合わせて資源を増やせます。
- `element` と `count.index` の組み合わせは、番号ごとに値を取り出す定番の書き方です。
- データソースは、作成の処理を伴わないので、読み取りだけを増やせます。
