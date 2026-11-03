---
title: "リポジトリの種類で、ポリシーの文を切り替える"
description: "terraform-aws-ecr のリポジトリポリシー。パブリックかプライベートかの種類ごとに、dynamic の for_each で必要な文だけを作る。"
language: hcl
project: "terraform-aws-ecr"
repo: https://github.com/terraform-aws-modules/terraform-aws-ecr
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "f05e615fa452e813935986295e7770f8fa96948b"
file: main.tf
lines: [13, 14]
format: 2
function: "data \"aws_iam_policy_document\"（repository・dynamic \"statement\"）"
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
ECR には、誰でも取得できる「パブリック」と、アカウントの中だけで使う「プライベート」の 2 種類のリポジトリがあります。両者では、必要な権限の文が違います。このコードは、リポジトリの種類を見て、その種類で必要な文だけを `dynamic` で作ります。

## コード
```hcl:line-numbers=13
  dynamic "statement" {
    for_each = var.repository_type == "public" ? [1] : []
```

## 前提知識
- ECR プライベートリポジトリ: 特定の IAM ロールやアカウントだけがイメージを取得・登録できます。
- ECR パブリックリポジトリ: インターネットの誰でもイメージを取得できる形式です。
- IAM ポリシーの文（statement）: 1 つの許可のまとまりです。文の数や中身を、種類によって変えられます。
- `dynamic "statement"`: 条件が真のときだけ、文のブロックを 1 つ作ります。
- `[1]` と `[]`: 条件に応じてブロックを作る、または作らないための空のリストです。

## 何をしているか
### 1. パブリックのときだけ、文を作る

```hcl:line-numbers=13
  dynamic "statement" {
    for_each = var.repository_type == "public" ? [1] : []
```

`repository_type` が `"public"` のときだけ、この文を 1 つ作ります。値は `[1]` ですが、中身の数字は使いません。「作るかどうか」だけを表すための書き方です。

### 2. プライベートのときは、別の文を作る

同じ形の `dynamic "statement"` が、`repository_type == "private"` の条件で、もう 1 つ書かれています。種類ごとに、作る文の集合が変わります。

## ここがすごい
1 つのポリシーの中に、種類の違う文を並べ、条件で作る・作らないを切り替えています。利用者は `repository_type` の 1 つの値だけを書けば、適切な権限が付きます。

さらに、この `data` ブロックは、リポジトリを作るときだけ使われます（`count` で制御）。作らないのに、権限の計算だけが走ることはありません。作成の条件と、ポリシーの中身の条件を、役割ごとに分けているのがよいところです。

## まとめ
- `dynamic` と `[1] : []` で、種類ごとに文を作り分けられます。
- 1 つのポリシーを、条件で複数の形に変えられます。
- 作成の条件（`count`）と中身の条件（`dynamic`）を分けると、読みやすくなります。
