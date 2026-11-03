---
title: "SNS トピックの ARN を、作成済みか名前からかで決める"
description: "terraform-aws-notify-slack の sns_topic_arn。作成した資源を優先し、無ければ名前から ARN を組み立て、最後は空文字にする。"
language: hcl
project: "terraform-aws-notify-slack"
repo: https://github.com/terraform-aws-modules/terraform-aws-notify-slack
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "a7765ac0a547f95c8aa48459f84077be8562c0f7"
file: main.tf
lines: [8, 12]
format: 2
function: "locals（sns_topic_arn の try による候補）"
difficulty: 2
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
通知の送り先になる SNS トピックは、このモジュールで作ることも、既存のものを使うこともできます。このコードは、トピックの ARN を、作成したものか名前から組み立てたものかの順番で選びます。`try` は、候補を左から順に試す仕組みです。

## コード
```hcl:line-numbers=8
  sns_topic_arn = try(
    aws_sns_topic.this[0].arn,
    "arn:${data.aws_partition.current.partition}:sns:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:${var.sns_topic_name}",
    ""
  )
```

## 前提知識
- ARN: AWS の資源を一意に指す名前です。`arn:パーティション:サービス:リージョン:アカウント:名前` の形をしています。
- `try(候補1, 候補2, ...)`: 先頭の式から順に評価し、最初にエラーにならなかった値を返します。
- `data.aws_partition` などのデータソース: 実行中の AWS の情報（パーティションやアカウント番号）を読みます。

## 何をしているか
### 1. 作成したトピックを最優先にする

```hcl:line-numbers=9
    aws_sns_topic.this[0].arn,
```

このモジュールでトピックを作っていれば、その ARN を使います。作っていなければ、この式はエラーになるので、次の候補に進みます。

### 2. 名前から ARN を組み立てる

```hcl:line-numbers=10
    "arn:${data.aws_partition.current.partition}:sns:${data.aws_region.current.region}:${data.aws_caller_identity.current.account_id}:${var.sns_topic_name}",
```

既存のトピックを使うときは、パーティション、リージョン、アカウント番号、トピック名をつないで ARN を作ります。全部そろえば、既存の資源を参照せずに済みます。

### 3. 最後は空文字にする

最後の `""` は、どれも使えないときの保険です。エラーで止まらず、空の値が返ります。

## ここがすごい
作成する場合と既存を使う場合を、一つの式で切り替えています。`if` の分岐を書かず、候補を並べるだけで優先順位を表せるのが `try` の利点です。

## まとめ
- `try` の引数を並べると、候補の優先順位を表せます。
- 作成した資源の値を先頭に置くと、既存の名前より優先されます。
- 最後に安全な既定値を置くと、途中の失敗で止まりません。
