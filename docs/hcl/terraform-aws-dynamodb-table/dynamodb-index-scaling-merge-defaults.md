---
title: "インデックスごとの設定を、既定値に重ねて使う"
description: "terraform-aws-dynamodb-table のインデックス用スケーリング。merge で既定値の上に各インデックスの値を重ね、キーごとに足りない項目を補う。"
language: hcl
project: "terraform-aws-dynamodb-table"
repo: https://github.com/terraform-aws-modules/terraform-aws-dynamodb-table
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b6cc515760466a455ff0acb97b16151fdca4511e"
file: autoscaling.tf
lines: [85, 87]
format: 2
function: "resource \"aws_appautoscaling_policy\"（index の target_tracking_scaling_policy_configuration）"
difficulty: 2
tags: ["データ構造", "API設計"]
---

## ひとことで
インデックスの Auto Scaling には、クールダウン（連続して増減しないための待ち時間）や目標値といった設定があります。すべてのインデックスで同じ値を使うことも、インデックスごとに変えることもできます。このコードは、既定の値の上に、各インデックスの値を `merge` で重ねて、足りない項目を補っています。

## コード
```hcl:line-numbers=85
    scale_in_cooldown  = merge(var.autoscaling_defaults, each.value)["scale_in_cooldown"]
    scale_out_cooldown = merge(var.autoscaling_defaults, each.value)["scale_out_cooldown"]
    target_value       = merge(var.autoscaling_defaults, each.value)["target_value"]
```

## 前提知識
- クールダウン: 1 回スケールした後、次のスケールまでに置く待ち時間です。急な増減を防ぎます。
- 目標値（target_value）: 使用率をどの程度に保つかを表す数字です。
- `merge(A, B)`: 2 つのマップを 1 つにまとめる関数です。同じキーがあれば、後ろの B が優先されます。
- `["キー"]`: マップの値を、キーの文字列で取り出す書き方です。
- `each.value`: `for_each` で回しているとき、その要素の値を指します。

## 何をしているか
### 1. 既定値に、インデックスの値を重ねる

```hcl:line-numbers=85
    scale_in_cooldown  = merge(var.autoscaling_defaults, each.value)["scale_in_cooldown"]
```

`merge(var.autoscaling_defaults, each.value)` は、既定値のマップと、このインデックスの設定を 1 つにまとめます。後ろの `each.value` が優先されるので、インデックスで指定された値があればそれを使い、無ければ既定値を使います。最後の `["scale_in_cooldown"]` で、その 1 つの項目を取り出します。

### 2. 同じ書き方で、他の項目も取り出す

```hcl:line-numbers=86
    scale_out_cooldown = merge(var.autoscaling_defaults, each.value)["scale_out_cooldown"]
    target_value       = merge(var.autoscaling_defaults, each.value)["target_value"]
```

増やすときの待ち時間と、目標値も、同じ形で補っています。`merge` を項目ごとに書いているので、どの項目が既定値から来るのかを、行ごとに追えます。

## ここがすごい
既定値と個別の値の優先関係を、`merge` の順番だけで表しています。利用者は、インデックスのうち一部の項目だけを書けば済みます。書かなかった項目は、既定値が自動で入ります。

同じ `merge` を項目ごとに書くのは、少し冗長に見えます。しかし、ひとつの式が 1 つの項目だけに責任を持つので、後で項目を増やしたり、一つだけ別の計算に変えたりするのが簡単です。

## まとめ
- `merge(既定値, 個別の値)` の順番で、後ろが勝つ優先関係を表せます。
- 既定値の仕組みを使うと、利用者は変えたい項目だけを書けます。
- 項目ごとに 1 行で取り出すと、どこから来た値かを追いやすくなります。
