---
title: "購読先の一覧を、条件付きの for 式で作り直す"
description: "terraform-aws-sns の購読設定。マップの要素を for 式で回し、作成フラグが真のときだけ aws_sns_topic_subscription を作る。"
language: hcl
project: "terraform-aws-sns"
repo: https://github.com/terraform-aws-modules/terraform-aws-sns
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4538b7e208f5bbd6c9972f427f85c9bd735aedad"
file: main.tf
lines: [157, 170]
format: 2
function: "resource \"aws_sns_topic_subscription\"（this）"
difficulty: 2
tags: ["データ構造", "API設計"]
---

## ひとことで
SNS のトピックには、メッセージを受け取る購読先（メール、SQS、Lambda など）を複数つなげられます。このモジュールでは、購読先の一覧をマップで受け取り、各要素から購読を 1 つずつ作ります。その際、`for` 式で「作成フラグが真のときだけ」の要素を選んでいます。

## コード
```hcl:line-numbers=157
resource "aws_sns_topic_subscription" "this" {
  for_each = { for k, v in var.subscriptions : k => v if var.create && var.create_subscription }

  region = var.region

  confirmation_timeout_in_minutes = each.value.confirmation_timeout_in_minutes
  delivery_policy                 = each.value.delivery_policy
  endpoint                        = each.value.endpoint
  endpoint_auto_confirms          = each.value.endpoint_auto_confirms
  filter_policy                   = each.value.filter_policy
  filter_policy_scope             = each.value.filter_policy_scope
  protocol                        = each.value.protocol
  raw_message_delivery            = each.value.raw_message_delivery
  redrive_policy                  = each.value.redrive_policy
```

## 前提知識
- 購読（subscription）: トピックに届いたメッセージを、どの先へ送るかを決める設定です。`protocol`（sqs や email など）と `endpoint`（送り先）の組で表します。
- `for_each`: マップの要素ごとに 1 つずつリソースを作る書き方です。`each.key` と `each.value` で、その要素の情報を使えます。
- `for` 式: `{ for k, v in 集まり : k => v if 条件 }` の形で、集まりから条件に合う要素だけを選んで、新しいマップを作ります。
- `filter_policy`: 購読先が、届いたメッセージのうち必要なものだけを受け取るための条件です。

## 何をしているか
### 1. 条件に合う購読だけを選ぶ

```hcl:line-numbers=158
  for_each = { for k, v in var.subscriptions : k => v if var.create && var.create_subscription }
```

`var.subscriptions` の各要素 `k => v` を見て、`if` の条件が真のものだけを残します。条件は、モジュール全体の `create` と、購読だけの `create_subscription` の 2 つです。どちらかが偽なら、マップが空になり、購読は 1 つも作られません。

`for` 式の結果は、キーが同じままで値だけ選ばれたマップです。そのため、`for_each` の中で、利用者が付けた名前（キー）をそのまま使えます。

### 2. 各購読の値を、each.value から読む

```hcl:line-numbers=162
  confirmation_timeout_in_minutes = each.value.confirmation_timeout_in_minutes
  delivery_policy                 = each.value.delivery_policy
  endpoint                        = each.value.endpoint
```

`each.value` は、利用者が書いた購読の設定そのものです。モジュールは、値を加工せずに、そのまま購読のリソースに渡しています。これにより、AWS が持つ細かな設定（再配信のポリシーや、フィルタなど）を、利用者がすべて使えます。

### 3. 作成フラグを、リソースの中ではなく式で止める

`count` ではなく `for_each` の中の `if` で作成を止めています。こうすると、キーごとの購読が 1 つも無いのか、フラグで全部止まっているのかを、同じ式で一度に判断できます。

## ここがすごい
マップのキーを購読の識別子にすると、利用者が購読を追加・削除しても、他の購読が作り直されません。たとえば、リストの 2 番目を消すと、3 番目以降の番号がずれて、すべての購読が作り直しになってしまいます。キーで管理すると、この問題を避けられます。

また、作成フラグを `for` 式の `if` にまとめているのも、よくできた書き方です。フラグが偽のときは、各リソースを 1 つずつ止めるのではなく、一覧そのものを空にできます。読み手は、1 か所だけ見れば作成の条件が分かります。

## まとめ
- マップを `for_each` に渡すと、キーごとに安定したリソースを作れます。
- `for` 式の `if` で、リソースを作る条件を一覧の段階で絞り込めます。
- `each.value` をそのまま渡すと、利用者が AWS の細かな設定を使えます。
