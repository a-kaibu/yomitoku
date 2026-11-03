---
title: "SNS の既定の権限文を、フラグで付け外しする"
description: "terraform-aws-sns のトピックポリシー。enable_default_topic_policy が真のときだけ、購読や発行などの既定の操作を許す文を作る。"
language: hcl
project: "terraform-aws-sns"
repo: https://github.com/terraform-aws-modules/terraform-aws-sns
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4538b7e208f5bbd6c9972f427f85c9bd735aedad"
file: main.tf
lines: [70, 80]
format: 2
function: "data \"aws_iam_policy_document\"（this・DefaultStatementID）"
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
SNS トピックには、誰が購読し、誰が発行し、誰が設定を変えられるかを決めるポリシーを付けられます。このモジュールには、その基本の許可をまとめた既定の文があります。このコードは、既定の文を付けるかどうかを、`enable_default_topic_policy` というフラグで切り替えます。

## コード
```hcl:line-numbers=70
  dynamic "statement" {
    for_each = var.enable_default_topic_policy ? [1] : []

    content {
      sid = "DefaultStatementID"
      actions = [
        "sns:Subscribe",
        "sns:SetTopicAttributes",
        "sns:RemovePermission",
        "sns:Publish",
        "sns:ListSubscriptionsByTopic",
```

## 前提知識
- SNS トピック: メッセージを発行し、購読者へ配る通知の先です。
- トピックポリシー: トピックに対する、誰が何をできるかを決める書類です。
- 既定の文（default statement）: AWS の SNS が、アカウント所有者に対して標準で持たせる典型的な許可の集まりです。
- `sns:Publish` / `sns:Subscribe`: メッセージを送る操作と、購読を登録する操作です。
- `dynamic` と `[1] : []`: フラグが真のときだけ文を 1 つ作る書き方です。

## 何をしているか
### 1. フラグが真のときだけ、文を作る

```hcl:line-numbers=70
  dynamic "statement" {
    for_each = var.enable_default_topic_policy ? [1] : []
```

`enable_default_topic_policy` が真なら、既定の文を 1 つ作ります。偽なら、この文は作られません。`[1]` は、ブロックを 1 回だけ作るための印です。

### 2. 文の名前と、許可する操作を並べる

```hcl:line-numbers=74
      sid = "DefaultStatementID"
      actions = [
        "sns:Subscribe",
        "sns:SetTopicAttributes",
        "sns:RemovePermission",
        "sns:Publish",
        "sns:ListSubscriptionsByTopic",
```

文の名前は `DefaultStatementID` です。許可する操作は、購読、属性の変更、権限の削除、発行、購読一覧の取得です。どれも、トピックを普通に運用するために必要な操作だけが並んでいます。

## ここがすごい
既定の文を、フラグ 1 つで付け外しできるようにしているので、利用者は、既定の権限を残すかどうかを簡単に決められます。ポリシーを完全に自分で書きたい利用者は、フラグを偽にして、別の文で書けます。

また、既定の操作を並べて文にしておくことで、「何ができるようになるのか」を読み手がすぐに分かります。権限の中身を、名前付きの文として見えるようにしているのは、後の保守にも役立ちます。

## まとめ
- 既定の権限を文にまとめ、フラグで付け外しすると、利用者の選択肢が広がります。
- 操作の一覧を文に並べると、どんな権限があるかを読み取りやすくなります。
- 文に名前（`sid`）を付けると、ポリシーの中で文を区別できます。
