---
title: "ライフサイクルの保持条件を、入れ子のブロックで省略できるようにする"
description: "terraform-aws-autoscaling の instance_lifecycle_policy。外側の設定が無ければブロックを作らず、保持条件も入れ子の dynamic で有無を決める。"
language: hcl
project: "terraform-aws-autoscaling"
repo: https://github.com/terraform-aws-modules/terraform-aws-autoscaling
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "2a249e91c798fdf85ab60c3b1592cc5e11805cc4"
file: main.tf
lines: [64, 76]
format: 2
function: "resource \"aws_autoscaling_group\"（入れ子の dynamic \"instance_lifecycle_policy\"）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
インスタンスのライフサイクルには、終了時の保持の条件（retention triggers）を任意で付けられます。外側の設定も、内側の条件も、どちらも省けるようになっています。このコードは、二段の `dynamic` で、外側と内側のブロックを別々に作るか決めています。

## コード
```hcl:line-numbers=64
  dynamic "instance_lifecycle_policy" {
    for_each = var.instance_lifecycle_policy != null ? [var.instance_lifecycle_policy] : []

    content {
      dynamic "retention_triggers" {
        for_each = instance_lifecycle_policy.value.retention_triggers != null ? [instance_lifecycle_policy.value.retention_triggers] : []

        content {
          terminate_hook_abandon = retention_triggers.value.terminate_hook_abandon
        }
      }
    }
  }
```

## 前提知識
- `dynamic` の入れ子: 外側のブロックの中に、さらに `dynamic` を置けます。内側の `for_each` は、外側の値を参照できます。
- `null` の判定: 値が無ければ、空のリストを回すことでブロックを作らないようにします。
- ライフサイクルの保持: 終了時に、インスタンスを消さずに残すかを決める設定です。

## 何をしているか
### 1. 外側の設定があるときだけ、ブロックを作る

```hcl:line-numbers=65
    for_each = var.instance_lifecycle_policy != null ? [var.instance_lifecycle_policy] : []
```

`var.instance_lifecycle_policy` が `null` でなければ、一要素のリストになります。無ければ、外側のブロックは作られません。

### 2. 内側の条件は、外側の値を使って判定する

```hcl:line-numbers=69
        for_each = instance_lifecycle_policy.value.retention_triggers != null ? [instance_lifecycle_policy.value.retention_triggers] : []
```

内側の `for_each` は、`instance_lifecycle_policy.value` を参照します。外側が無いときは、そもそも内側も作られないので、参照の値が無くても問題ありません。

## ここがすごい
入れ子の `dynamic` で、省略できる設定を段階ごとに表しています。外側を省けば内側も自動的に省かれるので、利用者は必要な段階だけを書けばよくなります。

## まとめ
- 入れ子の `dynamic` は、外側の値を使って内側の有無を決められます。
- 外側が無い場合は、内側の参照が評価されない形にすると安全です。
- 段階ごとに省略できる設計にすると、利用者の書く量を減らせます。
