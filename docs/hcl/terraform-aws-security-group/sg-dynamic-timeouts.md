---
title: "値があるときだけブロックを作る dynamic ブロック"
description: "terraform-aws-security-group が、timeouts 変数が null のときはブロックを作らず、値があるときだけ作る dynamic ブロックの書き方。"
language: hcl
project: "terraform-aws-security-group"
repo: https://github.com/terraform-aws-modules/terraform-aws-security-group
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3c1b2e8beff9671960f874f5569d77c803b0127"
file: main.tf
lines: [22, 29]
format: 2
function: "resource \"aws_security_group\"（dynamic \"timeouts\"）"
difficulty: 2
tags: ["イディオム", "API設計"]
---

## ひとことで
`dynamic` ブロックは、リソースの中に書くブロック（ネストした設定）を、条件や数に応じて作ったり作らなかったりするための仕組みです。ここでは、利用者が `timeouts` 変数を指定したときだけ `timeouts` ブロックを作り、指定がなければ何も作りません。

## コード
```hcl:line-numbers=22
  dynamic "timeouts" {
    for_each = var.timeouts != null ? [var.timeouts] : []

    content {
      create = timeouts.value.create
      delete = timeouts.value.delete
    }
  }
```

## 前提知識
- リソースブロック: `resource "種類" "名前" { ... }` の形で、作るリソースを宣言します。`aws_security_group` は AWS のセキュリティグループです。
- ネストしたブロック: `timeouts { ... }` のように、リソースの中にさらに書く設定のまとまりです。普通に書くと必ず 1 回書かれます。
- `dynamic "名前" { for_each = ... content { ... } }`: `for_each` の要素の数だけ、`content` の中身を持つブロックを作ります。
- `for_each` の値が空のリストなら、ブロックは 1 つも作られません。
- `timeouts.value`: `dynamic` ブロックの中で、今の要素を参照する名前です。ここでは `timeouts` という名前にしています。
- 三項演算子 `条件 ? [値] : []`: 値が 1 つだけのリストか、空のリストかを切り替える書き方です。

## 何をしているか
### 1. 値があるかどうかでリストの形を変える
```hcl:line-numbers=23
    for_each = var.timeouts != null ? [var.timeouts] : []
```

`for_each = var.timeouts != null ? [var.timeouts] : []` は、利用者が値を渡したら「要素 1 つのリスト」、渡さなければ「空のリスト」を作ります。`dynamic` ブロックは、この要素の数だけ `content` を作るので、結果として `timeouts` ブロックの有無が決まります。

### 2. ブロックの中身を組み立てる
```hcl:line-numbers=25
    content {
      create = timeouts.value.create
      delete = timeouts.value.delete
    }
```

`content` の中では、`timeouts.value.create` と `timeouts.value.delete` を参照して、2 つの値を `aws_security_group` の `timeouts` に入れています。`timeouts.value` は、`for_each` の 1 つの要素を指します。この場合は利用者が渡したオブジェクトそのものです。

## ここがすごい
`timeouts` ブロックを `dynamic` にしない書き方だと、利用者が指定しなくても `timeouts` を書くか、`null` を入れるための特別な分岐が必要になります。このモジュールは、「要素が 1 つか 0 個か」という形で条件を表すので、ブロック自体を省略できます。

また、`timeouts` の中身は `variables.tf` の `optional()` によって、`create` と `delete` のどちらも省略できるように作られています（別の記事で扱います）。ブロックを作るかどうかと、その中の値を省略できるかどうかを、別々の仕組みで決めている点が設計の良いところです。

## まとめ
- `dynamic` ブロックは、条件に応じてネストしたブロックを作る仕組みです。
- 空のリストを `for_each` に渡すと、ブロックは 1 つも作られません。
- 「値が 1 つのリスト」と「空のリスト」で条件を表すと、省略可能な設定を素直に書けます。

