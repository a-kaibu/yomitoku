---
title: "環境変数のブロックを、キーがあるときだけ作る"
description: "terraform-aws-lambda の aws_lambda_function。環境変数のマップが空かどうかを keys と length で調べ、空なら environment ブロックを作らない書き方。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [91, 96]
format: 2
function: "resource \"aws_lambda_function\"（dynamic \"environment\"）"
difficulty: 1
tags: ["イディオム", "API設計"]
---

## ひとことで
Lambda 関数の環境変数は、`environment` ブロックの中に書きます。環境変数が 1 つも無いときは、このブロックそのものを作りません。このモジュールは、マップのキーの数を数えて、0 のときは空のリストを、1 つ以上あるときは 1 件のリストを `for_each` に渡します。

## コード
```hcl:line-numbers=91
  dynamic "environment" {
    for_each = length(keys(var.environment_variables)) == 0 ? [] : [true]
    content {
      variables = var.environment_variables
    }
  }
```

## 前提知識
- 環境変数: Lambda 関数の中で、設定値を受け取るための名前と値の組です。
- `keys(マップ)`: マップのキーの一覧を返します。
- `length(一覧)`: 一覧の要素の数を返します。
- `[]` と `[true]`: 空のリストと、1 件だけのリストです。`dynamic` の `for_each` に渡すと、ブロックを 0 個または 1 個作れます。
- `environment.value`: 今の要素の値です。ここでは `true` の印で、中身は使っていません。

## 何をしているか
### 1. 環境変数の数で分ける
```hcl:line-numbers=92
    for_each = length(keys(var.environment_variables)) == 0 ? [] : [true]
```

`length(keys(var.environment_variables)) == 0 ? [] : [true]` は、環境変数が 1 つも無いときは空のリストを、あるときは 1 件のリストを返します。`[true]` の中身は使われず、「作る」という印として使われます。

### 2. ブロックの中身を作る
```hcl:line-numbers=93
    content {
      variables = var.environment_variables
    }
```

`variables = var.environment_variables` で、マップをそのまま渡します。このように、ブロックが作られるかどうかの判定と、中身の値の受け渡しを分けているので、読みやすくなっています。

## ここがすごい
`dynamic` の `for_each` に `[true]` を使う書き方は、「1 回だけ作る」を表す定番です。値の中身より、要素の数で条件を表すので、判定が 1 行で済みます。

また、環境変数が無いときに `environment` ブロックを省けるので、AWS 側の既定の動きに任せられます。空のブロックを書いてしまうと、利用者の意図しない設定が入ることがあるため、この書き方は安全です。

## まとめ
- `[]` と `[true]` を条件で切り替えると、ブロックを作るかどうかを表せます。
- `keys` と `length` で、マップが空かどうかを確かめられます。
- 判定と値の受け渡しを分けると、読み手が追いやすくなります。

