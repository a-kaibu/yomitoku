---
title: "重み付きの転送を、入れ子の dynamic で表す"
description: "terraform-aws-alb のリスナー。複数のターゲットグループへ重みを付けて振り分ける forward と、その中の target_group と stickiness を、入れ子の dynamic で作る書き方。"
language: hcl
project: "terraform-aws-alb"
repo: https://github.com/terraform-aws-modules/terraform-aws-alb
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "6c6e48c10d450d01cf6715346e926df0b858efc2"
file: main.tf
lines: [224, 251]
format: 2
function: "resource \"aws_lb_listener\"（dynamic \"default_action\"・weighted_forward）"
difficulty: 3
tags: ["メタプログラミング", "API設計"]
---

## ひとことで
リスナーの動作の 1 つに、複数のターゲットグループへ重みを付けて振り分ける「重み付きの転送」があります。このブロックは、その設定を入れ子の `dynamic` で作ります。ターゲットグループの一覧と、スティッキネス（同じ利用者を同じ先へ送る設定）が、どちらも任意です。

## コード
```hcl:line-numbers=224
  dynamic "default_action" {
    for_each = each.value.weighted_forward != null ? [each.value.weighted_forward] : []

    content {
      forward {
        dynamic "target_group" {
          for_each = default_action.value.target_groups != null ? default_action.value.target_groups : []

          content {
            arn    = try(aws_lb_target_group.this[target_group.value.target_group_key].arn, target_group.value.target_group_arn)
            weight = target_group.value.weight
          }
        }

        dynamic "stickiness" {
          for_each = default_action.value.stickiness != null ? [default_action.value.stickiness] : []

          content {
            duration = stickiness.value.duration
            enabled  = stickiness.value.enabled
          }
        }
      }

      order = each.value.order
      type  = "forward"
    }
  }
```

## 前提知識
- 重み付きの転送: 複数のターゲットグループに、割合（重み）を付けて振り分けます。重みの比で、リクエストの数が分かれます。
- スティッキネス: 同じ利用者からのリクエストを、同じターゲットグループへ送り続ける設定です。
- `dynamic` の入れ子: 外側の `content` の中に、内側の `dynamic` を書けます。
- `default_action.value`: 外側の `dynamic` の今の要素です。内側の `dynamic` からは、その値を参照します。
- `target_group.value`: 内側の `dynamic` の今の要素で、1 つのターゲットグループの設定です。

## 何をしているか
### 1. 重み付きの転送を作るかを決める
```hcl:line-numbers=225
    for_each = each.value.weighted_forward != null ? [each.value.weighted_forward] : []

```

`each.value.weighted_forward` が `null` でなければ、1 件の `default_action` を作ります。単純な `forward` と違い、ここでは `forward` の中に、さらに複数の `target_group` を入れます。

### 2. ターゲットグループごとに重みを付ける
```hcl:line-numbers=229
        dynamic "target_group" {
          for_each = default_action.value.target_groups != null ? default_action.value.target_groups : []

          content {
            arn    = try(aws_lb_target_group.this[target_group.value.target_group_key].arn, target_group.value.target_group_arn)
            weight = target_group.value.weight
          }
        }
```

内側の `dynamic "target_group"` は、`target_groups` の一覧の数だけ `target_group` ブロックを作ります。各ブロックでは、キーで引いたターゲットグループの ARN と、`weight` を指定します。ARN は、alb-default-action-forward-ref の記事で見た `try` の書き方で、キーか ARN のどちらかから選ばれます。

### 3. スティッキネスを任意で付ける
```hcl:line-numbers=238
        dynamic "stickiness" {
          for_each = default_action.value.stickiness != null ? [default_action.value.stickiness] : []

          content {
            duration = stickiness.value.duration
            enabled  = stickiness.value.enabled
          }
        }
```

`stickiness` は、値があるときだけ作られる内側の `dynamic` です。`duration` と `enabled` を渡して、同じ利用者を同じ先へ送る期間を決めます。値が無ければ、この設定そのものが書かれません。

## ここがすごい
重み付きの転送は、「ターゲットグループの数」「スティッキネスの有無」という 2 つの任意の要素を持ちます。入れ子の `dynamic` を使うと、この 2 つの有無を、ブロックの有無としてそのまま表せます。利用者は、必要な要素だけを書けばよくなります。

また、内側の `dynamic` が外側の値を参照する形は、リソースの中の階層を、そのまま HCL の入れ子に写しています。階層の深さが増えても、この書き方を繰り返せます。

## まとめ
- 入れ子の `dynamic` で、階層のある任意の設定を表せます。
- 内側の `dynamic` からは、外側の `value` を参照します。
- 任意の要素を、ブロックの有無として表すと、利用者の記述が短くなります。

