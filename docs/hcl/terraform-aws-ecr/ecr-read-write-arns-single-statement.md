---
title: "読み書き用の ARN の一覧を、1 つの文として渡す"
description: "terraform-aws-ecr の読み書き権限。ARN の一覧を for_each に 1 要素のリストとして包み、一覧全体で 1 つの dynamic 文を作る。"
language: hcl
project: "terraform-aws-ecr"
repo: https://github.com/terraform-aws-modules/terraform-aws-ecr
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "f05e615fa452e813935986295e7770f8fa96948b"
file: main.tf
lines: [90, 91]
format: 2
function: "data \"aws_iam_policy_document\"（repository・dynamic \"statement\" の read-write）"
difficulty: 3
tags: ["セキュリティ", "データ構造"]
---

## ひとことで
ECR のプライベートリポジトリには、特定のロールに読み書きを許す権限を付けられます。その ARN（ロールの識別子）は、利用者が一覧で渡します。このコードは、その一覧を `for_each` に、要素 1 つのリストとして渡し、一覧全体で 1 つの文を作ります。

## コード
```hcl:line-numbers=90
  dynamic "statement" {
    for_each = length(var.repository_read_write_access_arns) > 0 && var.repository_type == "private" ? [var.repository_read_write_access_arns] : []
```

## 前提知識
- IAM ロールの ARN: `arn:aws:iam::123456789012:role/...` の形の、ロールを指す文字列です。
- 読み書きの権限: イメージを取得（pull）し、登録（push）する権限です。
- `for_each` の値: リストを渡すと、要素の数だけブロックを作ります。マップや集合を渡すこともできます。
- `[リスト]`: リストをさらに 1 つの要素として包んだものです。`for_each` は要素が 1 つなので、ブロックは 1 回だけ作られます。
- `length(...) > 0`: 一覧が空でないかを確かめる書き方です。

## 何をしているか
### 1. 一覧が空でなく、種類が private のときだけ作る

```hcl:line-numbers=91
    for_each = length(var.repository_read_write_access_arns) > 0 && var.repository_type == "private" ? [var.repository_read_write_access_arns] : []
```

一覧が空でなく、リポジトリが private のときだけ、文を 1 つ作ります。`[var.repository_read_write_access_arns]` は、一覧そのものを 1 要素として包んでいます。そのため、一覧の中身の数に関係なく、文は 1 つだけ作られます。

### 2. 中では、一覧を 1 つの principals にまとめる

このブロックの中では、`statement.value` が一覧全体を指します。そのため、ARN の一覧を `identifiers` に 1 回で渡せます。ARN の数だけ文を作ると、同じ許可が何度も書かれてしまいますが、この書き方ならポリシーがすっきりします。

## ここがすごい
`for_each` に、要素 1 つのリストとして一覧を包むという技は、「一覧を 1 単位として扱いたい」ときに役立ちます。ARN を 1 つずつ文にすると、文の数が増えて読みにくくなります。一覧をまとめて 1 文にすることで、ポリシーの形が安定します。

さらに、読み取りの権限とは別の文として分けているのも大切です。読み書きを持つ主体は、読み取りだけの主体より強い権限を持つので、文を分けておくと、どの主体がどの権限を持つかが明確になります。

## まとめ
- `for_each` に `[一覧]` を渡すと、一覧全体を 1 つのブロックとして扱えます。
- 一覧の要素ごとに文を作るより、まとめた方がポリシーが読みやすくなります。
- 権限の強さが違う主体は、文を分けると管理しやすくなります。
