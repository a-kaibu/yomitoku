---
title: "GovCloud では作らない、logging_config の dynamic ブロック"
description: "terraform-aws-lambda の logging_config。パーティションが aws のときだけブロックを作り、サービスが対応していない GovCloud では省く書き方。コメントで理由と関連 issue を残している。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [137, 148]
format: 2
function: "resource \"aws_lambda_function\"（dynamic \"logging_config\"）"
difficulty: 2
tags: ["設計パターン", "防御的プログラミング"]
---

## ひとことで
Lambda のログ設定（`logging_config`）は、通常の AWS では使えますが、GovCloud（米国政府向けのリージョン）では使えないことがあります。このブロックは、パーティションの名前が `aws` のときだけ、ログ設定を作ります。その理由は、コメントに書かれています。

## コード
::: code-group

```hcl:line-numbers=137 [日本語訳]
  dynamic "logging_config" {
    # GovCloud では利用できないので、ログの設定は作らない
    # 関連する issue は terraform-provider-aws の #34810 にある
    for_each = data.aws_partition.current.partition == "aws" ? [true] : []

    content {
      log_group             = var.logging_log_group
      log_format            = var.logging_log_format
      application_log_level = var.logging_log_format == "Text" ? null : var.logging_application_log_level
      system_log_level      = var.logging_log_format == "Text" ? null : var.logging_system_log_level
    }
  }
```

```hcl:line-numbers=137 [原文]
  dynamic "logging_config" {
    # Dont create logging config on gov cloud as it is not avaible.
    # See https://github.com/hashicorp/terraform-provider-aws/issues/34810
    for_each = data.aws_partition.current.partition == "aws" ? [true] : []

    content {
      log_group             = var.logging_log_group
      log_format            = var.logging_log_format
      application_log_level = var.logging_log_format == "Text" ? null : var.logging_application_log_level
      system_log_level      = var.logging_log_format == "Text" ? null : var.logging_system_log_level
    }
  }
```

:::

## 前提知識
- パーティション: AWS の区分です。通常の AWS は `aws`、GovCloud は `aws-us-gov` のような名前です。
- `data "aws_partition"`: 現在のパーティションを読み込むデータソースです（`data.aws_partition.current.partition`）。
- `logging_config`: Lambda のログの形式（テキストや JSON）と、ログのレベルを指定するブロックです。
- `dynamic` の `for_each`: 条件が真のときだけ、1 件のリストを渡します。
- `Text` のとき: ログ形式が `Text` の場合は、ログのレベルを指定しない形にしています。

## 何をしているか
### 1. パーティションで作るかを決める
```hcl:line-numbers=138
    # GovCloud では利用できないので、ログの設定は作らない
    # 関連する issue は terraform-provider-aws の #34810 にある
    for_each = data.aws_partition.current.partition == "aws" ? [true] : []
```

`data.aws_partition.current.partition == "aws"` が真のときだけ、`[true]` を渡します。コメントにあるように、GovCloud ではこの機能が使えないので、ブロックを作らないようにしています。

### 2. ログの設定を渡す
```hcl:line-numbers=143
      log_group             = var.logging_log_group
      log_format            = var.logging_log_format
      application_log_level = var.logging_log_format == "Text" ? null : var.logging_application_log_level
      system_log_level      = var.logging_log_format == "Text" ? null : var.logging_system_log_level
```

`log_group` と `log_format` は、変数からそのまま渡します。`application_log_level` と `system_log_level` は、ログ形式が `Text` のときだけ `null` にします。テキスト形式ではレベルの指定を書かないという、AWS の制約に合わせた分岐です。

## ここがすごい
利用できないリージョンを、コードの中で明示的に避けています。利用者が設定を変えなくても、同じモジュールを GovCloud で使えるようにする工夫です。

また、関連する issue の番号をコメントに残しているので、読み手は「なぜこの条件があるのか」を、後から確かめられます。コードの理由を、外部の情報へつなぐ書き方の良い例です。

## まとめ
- パーティションを条件にすると、地域によって使えない機能を避けられます。
- 制約の理由をコメントで残すと、将来の保守がしやすくなります。
- 形式によって値を `null` にする分岐は、AWS の制約に合わせる典型的な書き方です。

