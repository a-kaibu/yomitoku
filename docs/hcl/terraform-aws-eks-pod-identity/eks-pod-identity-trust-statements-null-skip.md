---
title: "信頼ポリシーの文を、指定が null のときは作らない"
description: "terraform-aws-eks-pod-identity の信頼ポリシー。trust_policy_statements が null なら空のリストを回し、文を一つも作らない。"
language: hcl
project: "terraform-aws-eks-pod-identity"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks-pod-identity
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "f72040b99272c264e0340f44758219e0808a52a2"
file: main.tf
lines: [51, 52]
format: 2
function: "data \"aws_iam_policy_document\"（dynamic \"statement\" の for_each）"
difficulty: 2
tags: ["セキュリティ", "防御的プログラミング"]
---

## ひとことで
Pod Identity の信頼ポリシーには、利用者が独自の文を追加できます。追加がない場合は、その文を作らずに、標準の文だけで政策を作ります。このコードは、指定が `null` のときに空のリストを回し、文を作らないようにしています。

## コード
```hcl:line-numbers=51
  dynamic "statement" {
    for_each = var.trust_policy_statements != null ? var.trust_policy_statements : []
```

## 前提知識
- 信頼ポリシー（assume role policy）: どのサービスやロールが、このロールを引き受けられるかを決める policy です。
- `aws_iam_policy_document`: policy を HCL で書くデータソースです。JSON に変換されます。
- `dynamic "statement"`: `for_each` の要素ごとに、文を一つずつ作ります。

## 何をしているか
### 1. 指定が無ければ、空のリストを回す

```hcl:line-numbers=52
    for_each = var.trust_policy_statements != null ? var.trust_policy_statements : []
```

`var.trust_policy_statements` が `null` なら、`[]` を回します。空なので、利用者の文は一つも作られません。

### 2. 指定があれば、文を一つずつ作る

指定があれば、その要素の数だけ `statement` を作ります。`sid`、`actions`、`effect` などを、そのまま写して使います。

## ここがすごい
利用者の文を、条件で囲まずに、`for_each` の入力を `null` か空のリストにするだけで切り替えています。標準の文と利用者の文を、同じ `data` の中で組み立てられる点も読みどころです。

## まとめ
- `null` の判定を `for_each` の入力に書くと、追加の文の有無を簡単に切り替えられます。
- `aws_iam_policy_document` の `dynamic "statement"` は、文の数を利用者の指定に合わせられます。
- 既定の文と利用者の文を分けて書くと、意図が伝わりやすくなります。
