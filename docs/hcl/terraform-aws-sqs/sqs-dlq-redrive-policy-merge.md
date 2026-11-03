---
title: "デッドレターキューの再配信設定を、既定値と重ねる"
description: "terraform-aws-sqs の DLQ 用 redrive ポリシー。既定の maxReceiveCount と利用者の設定を merge で重ね、後から書いた値を優先する。"
language: hcl
project: "terraform-aws-sqs"
repo: https://github.com/terraform-aws-modules/terraform-aws-sqs
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "a68b4d515f9ccc729fb8bf84c6760c6b91302ce0"
file: main.tf
lines: [138, 153]
format: 2
function: "resource \"aws_sqs_queue_redrive_policy\"（dlq）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
SQS のキューは、何度受け取っても処理に失敗するメッセージを、別のキー（デッドレターキュー、DLQ）へ移す設定を持てます。このリソースは、その移し先と「何回失敗したら移すか」を、既定値と利用者の設定を重ねて決めます。利用者は一部の値だけ書けば済みます。

## コード
```hcl:line-numbers=138
resource "aws_sqs_queue_redrive_policy" "dlq" {
  count = var.create && var.create_dlq ? 1 : 0

  region = var.region

  queue_url = aws_sqs_queue.this[0].url
  redrive_policy = jsonencode(
    merge(
      {
        deadLetterTargetArn = aws_sqs_queue.dlq[0].arn
        maxReceiveCount     = 5
      },
      var.redrive_policy
    )
  )
}
```

## 前提知識
- SQS（Simple Queue Service）: AWS のメッセージキューです。送る側と受け取る側を切り離して、メッセージを順に処理できます。
- デッドレターキュー（DLQ）: 処理に何度も失敗したメッセージを、別のキューへ退避させておく場所です。原因の調査に使えます。
- redrive ポリシー: 「どのキューへ、何回の受け取りで移すか」を JSON で書いた設定です。
- `jsonencode(...)`: HCL の値（マップなど）を JSON の文字列に変換します。AWS の設定は JSON で受け取るため、この変換が必要です。
- `merge(a, b)`: 複数のマップを 1 つにまとめる関数です。同じキーがあれば、後ろのマップの値が勝ちます。
- `count = 条件 ? 1 : 0`: 条件が真のときだけ 1 つ作る、という Terraform の定番の書き方です。

## 何をしているか
### 1. 作るかどうかを条件で決める

```hcl:line-numbers=139
  count = var.create && var.create_dlq ? 1 : 0
```

キュー本体を作り、かつ `create_dlq` が真のときだけ、この設定を作ります。`create_dlq` が偽のときは、利用者が `redrive_policy` を自分で渡す別のリソース（`count` の条件が `!var.create_dlq` の方）が使われます。どちらか一方だけが作られるので、設定が二重になりません。

### 2. 既定値に、利用者の値を重ねる

```hcl:line-numbers=144
  redrive_policy = jsonencode(
    merge(
      {
        deadLetterTargetArn = aws_sqs_queue.dlq[0].arn
        maxReceiveCount     = 5
      },
      var.redrive_policy
    )
  )
```

`merge` の最初のマップには、モジュールが決めた既定値が入ります。移し先は、このモジュールが作った DLQ の ARN です。`maxReceiveCount = 5` は、5 回受け取っても処理できなかったら移す、という既定値です。

2 つ目の `var.redrive_policy` は、利用者が渡した値です。`merge` は後ろのマップを優先するので、利用者が `maxReceiveCount` を書けば、既定の 5 はその値で置き換わります。書かなければ 5 のままです。

### 3. JSON にして、キューに付ける

`jsonencode` で、マップ全体を AWS が受け取る JSON 文字列にします。`queue_url = aws_sqs_queue.this[0].url` が、どのキューにこの設定を付けるかを決めます。利用者は JSON の書き方を覚えなくても、HCL のマップで同じ内容を指定できます。

## ここがすごい
既定値と利用者の値を `merge` で重ねる書き方は、「書かなくても動く、でも変えられる」という設計を、とても少ない行数で実現しています。利用者は `maxReceiveCount` だけを書けばよく、移し先の ARN を調べる必要はありません。

もし既定値を書かずに利用者に全部書かせると、設定の書き忘れが起きやすくなります。逆に、利用者の値を先に書いて既定値で上書きすると、利用者の指定が効かなくなります。`merge` の後ろを優先するという一つの決まりを使って、この 2 つの問題を同時に避けています。

## まとめ
- `merge(既定値, 利用者の値)` と書くと、利用者の指定だけが既定値を上書きします。
- `jsonencode` で HCL のマップを AWS の JSON に変換できます。
- `count` の条件で、2 つの似た設定のどちらか一方だけを作れます。
