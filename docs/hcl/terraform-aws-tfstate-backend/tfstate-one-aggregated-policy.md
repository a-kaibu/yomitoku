---
title: "one() で「0 個か 1 個」のデータを安全に取り出す"
description: "terraform-aws-tfstate-backend が、count で作られた IAM ポリシーの JSON を one() で取り出し、そのまま別のポリシーに渡す書き方。"
language: hcl
project: "terraform-aws-tfstate-backend"
repo: https://github.com/cloudposse/terraform-aws-tfstate-backend
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "13267a3853954b2e00522467ddf2fa9ffe73e062"
file: main.tf
lines: [60, 65]
format: 2
function: "data \"aws_iam_policy_document\"（aggregated_policy）"
difficulty: 2
tags: ["型システム", "防御的プログラミング"]
---

## ひとことで
Terraform で `count` を使うと、リソースやデータは 0 個か 1 個のリストとして扱われます。このブロックは、その「0 個か 1 個」の結果を `one()` で取り出し、ほかのポリシーのソースとして渡しています。`count` が 0 のときも、エラーにならずに空として扱えるようにするためです。

## コード
```hcl:line-numbers=60
data "aws_iam_policy_document" "aggregated_policy" {
  count = local.enabled ? 1 : 0

  source_policy_documents   = [one(data.aws_iam_policy_document.bucket_policy[*].json)]
  override_policy_documents = var.source_policy_documents
}
```

## 前提知識
- `data` ブロック: 既存の情報を読み込むためのブロックです。`data "種類" "名前"` の形で書きます。
- `aws_iam_policy_document`: IAM のポリシーの JSON を、HCL の書き方で組み立てるデータソースです。`.json` 属性で完成した JSON を取り出せます。
- `count = 条件 ? 1 : 0`: 条件が真なら 1 個、偽なら 0 個のリソースやデータを作ります。
- `[*]` の書き方（スプラット式）: `data.X.name[*].json` のように書くと、`count` で作られた全要素の属性をリストで取り出せます。
- `one(リスト)`: リストが空なら `null`、要素が 1 つならその要素、2 つ以上ならエラーを返す関数です。
- `source_policy_documents` と `override_policy_documents`: ポリシーの元になる JSON を受け取る引数です。

## 何をしているか
### 1. 0 個か 1 個かの結果を取り出す
```hcl:line-numbers=63
  source_policy_documents   = [one(data.aws_iam_policy_document.bucket_policy[*].json)]
```

`one(data.aws_iam_policy_document.bucket_policy[*].json)` は、`bucket_policy` が作られていれば 1 個の JSON を、作られていなければ `null` を返します。`count` の値が 0 か 1 しかないので、2 個以上になることはありません。もし将来 `count` の作り方を変えて 2 個以上になれば、`one()` がエラーで知らせてくれます。

### 2. 取り出した JSON を別のポリシーに渡す
```hcl:line-numbers=63
  source_policy_documents   = [one(data.aws_iam_policy_document.bucket_policy[*].json)]
  override_policy_documents = var.source_policy_documents
```

`source_policy_documents` には、`one()` の結果を 1 要素のリストとして渡しています。`override_policy_documents` には、利用者が渡した `var.source_policy_documents` をそのまま渡します。元のポリシーを基にして、利用者の指定で上書きできる、という 2 段階の構造です。

## ここがすごい
`one()` を使うと、「作られていないときは `null`」「作られているときは 1 個」という規則が、式の中で表せます。`[0]` の添字で直接取り出す書き方と比べて、`count` が 0 のときにエラーで止まりません。

また、`source` と `override` の 2 つの引数を分けたことで、モジュールの中で決めた既定のポリシーと、利用者が追加するポリシーを、混ぜずに組み立てられます。`one()` の結果を `source` に渡す、という形がこの分担を支えています。

## まとめ
- `count` で作られた結果は、`[*]` でリストとして取り出せます。
- `one()` は、0 個なら `null`、1 個ならその要素を返すので、`count` と組み合わせて使えます。
- 元のポリシーと利用者の上書きを、引数で分けると、組み立ての順番が読みやすくなります。

