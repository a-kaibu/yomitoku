---
title: "ポリシー文の Sid を、マップのキー名で補う"
description: "terraform-aws-sns のトピックポリシー。Sid を省略するとマップのキー名が使われ、resources を省略するとトピック自身の ARN を指す。"
language: hcl
project: "terraform-aws-sns"
repo: https://github.com/terraform-aws-modules/terraform-aws-sns
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4538b7e208f5bbd6c9972f427f85c9bd735aedad"
file: main.tf
lines: [101, 120]
format: 2
function: "data \"aws_iam_policy_document\"（dynamic \"statement\"）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
SNS トピックへのアクセスを決める IAM ポリシーは、利用者が書いた「文（statement）」の一覧から組み立てられます。このコードは、文の名前（Sid）を省略できるようにして、省略時はマップのキー名を使います。さらに対象のリソースを省略すると、トピック自身を指すように自動で補います。

## コード
::: code-group

```hcl:line-numbers=101 [日本語訳]
  dynamic "statement" {
    for_each = var.topic_policy_statements != null ? var.topic_policy_statements : {}

    content {
      sid         = try(coalesce(statement.value.sid, statement.key))
      actions     = statement.value.actions
      not_actions = statement.value.not_actions
      effect      = statement.value.effect
      # これにより「鶏が先か卵が先か」の問題を避けられ、トピック自身を参照できます。
      resources     = statement.value.resources != null ? statement.value.resources : [aws_sns_topic.this[0].arn]
      not_resources = statement.value.not_resources

      dynamic "principals" {
        for_each = statement.value.principals != null ? statement.value.principals : []

        content {
          type        = principals.value.type
          identifiers = principals.value.identifiers
        }
      }
```

```hcl:line-numbers=101 [原文]
  dynamic "statement" {
    for_each = var.topic_policy_statements != null ? var.topic_policy_statements : {}

    content {
      sid         = try(coalesce(statement.value.sid, statement.key))
      actions     = statement.value.actions
      not_actions = statement.value.not_actions
      effect      = statement.value.effect
      # This avoids the chicken vs the egg scenario since its embedded and can reference the topic
      resources     = statement.value.resources != null ? statement.value.resources : [aws_sns_topic.this[0].arn]
      not_resources = statement.value.not_resources

      dynamic "principals" {
        for_each = statement.value.principals != null ? statement.value.principals : []

        content {
          type        = principals.value.type
          identifiers = principals.value.identifiers
        }
      }
```

:::

## 前提知識
- SNS（Simple Notification Service）: AWS の通知サービスです。トピックに送られたメッセージを、登録された購読先へ配ります。
- IAM ポリシー: 「誰が」「どの資源に」「何をしてよいか」を書く許可の書類です。Terraform では `data "aws_iam_policy_document"` で、HCL の書き方から JSON を作れます。
- `dynamic` ブロック: 同じ形の設定ブロックを、`for_each` の値の数だけ繰り返して作る書き方です。
- Map（マップ）: 「キー → 値」の組の集まりです。`for_each` に渡すと、キーごとに 1 回ずつ処理されます。
- `coalesce(a, b)`: 空でない最初の値を返します。`try(...)` は、中の式がエラーになったときに代わりの値を使うための関数です。
- `null`: 「値が無い」ことを表します。`!= null ? ... : ...` は、値があるかどうかで分岐する書き方です。

## 何をしているか
### 1. 文の一覧を for_each で回す

```hcl:line-numbers=101
  dynamic "statement" {
    for_each = var.topic_policy_statements != null ? var.topic_policy_statements : {}
```

利用者は `topic_policy_statements` に、文の一覧をマップで渡します。値が `null` のときは空のマップ `{}` を使うので、ブロックは 1 つも作られません。`for_each` の後ろで、`statement.key` と `statement.value` が使えるようになります。

### 2. Sid を、省略されたらキー名にする

```hcl:line-numbers=105
      sid         = try(coalesce(statement.value.sid, statement.key))
```

例えば、利用者が `allow_publish = { actions = ["SNS:Publish"] ... }` と書いて `sid` を省略したとします。すると `statement.value.sid` は `null` なので、`coalesce` は次の候補の `statement.key`、つまり `allow_publish` を返します。利用者は Sid を毎回書かなくても、ポリシーの中で文を区別できます。

### 3. 対象を省略したら、トピック自身の ARN を使う

```hcl:line-numbers=110
      resources     = statement.value.resources != null ? statement.value.resources : [aws_sns_topic.this[0].arn]
```

`resources` が指定されていれば、それを使います。指定がなければ `aws_sns_topic.this[0].arn`、つまりこのトピック自身の ARN を入れます。このポリシーはトピックに付けられるので、対象には作成済みのトピックの ARN を使います。`[0]` は、`count` で作られた 1 つ目のリソースを指す書き方です。

### 4. 送信元の指定もブロックで繰り返す

```hcl:line-numbers=113
      dynamic "principals" {
        for_each = statement.value.principals != null ? statement.value.principals : []
```

`principals`（誰に許可するか）も、同じ `dynamic` の形で作ります。値が無いときは空のリストを使うので、何も作られません。文ごとに、必要な分だけ `principals` を並べられます。

## ここがすごい
マップのキーを Sid の既定値にするのは、小さな工夫ですが効果があります。利用者は文の名前を 2 回書く必要がなく、キーをそのまま名前として読めます。マップのキーは一意なので、キーを Sid に使えば、利用者が文の名前で迷うことも少なくなります。

また、`resources` の既定値をトピックの ARN にしているのも、よく考えられた設計です。ポリシーとトピックを同じ Terraform の中で作る場合、ポリシーに書く ARN は、トピックが作られた後でないと分かりません。既定値をリソースの参照にしておけば、利用者は ARN を調べる必要がなく、作成の順番も Terraform が自動で決めてくれます。

## まとめ
- `for_each` にマップを渡すと、キーと値の両方を使って設定を繰り返せます。
- `coalesce` で「指定があれば使い、無ければ代わりの値を使う」を 1 行で書けます。
- リソースの参照を既定値にすると、利用者が書く量を減らし、作成の順番も自動で決まります。
