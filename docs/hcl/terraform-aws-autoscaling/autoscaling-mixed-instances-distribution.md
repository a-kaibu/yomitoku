---
title: "複数のインスタンスの種類を、料金の比率で混ぜて起動する"
description: "terraform-aws-autoscaling の mixed_instances_policy。instances_distribution が指定されたときだけ、オンデマンドとスポットの配分の設定を 1 つ作る。"
language: hcl
project: "terraform-aws-autoscaling"
repo: https://github.com/terraform-aws-modules/terraform-aws-autoscaling
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "2a249e91c798fdf85ab60c3b1592cc5e11805cc4"
file: main.tf
lines: [137, 152]
format: 2
function: "resource \"aws_autoscaling_group\"（dynamic \"mixed_instances_policy\"・instances_distribution）"
difficulty: 3
tags: ["API設計", "数値計算"]
---

## ひとことで
Auto Scaling グループは、1 種類のインスタンスだけでなく、複数の種類を組み合わせて起動できます。このとき、通常料金の「オンデマンド」と、安いが途中で止められることがある「スポット」を、どの割合で使うかを決められます。このコードは、その配分の設定を `dynamic` で、指定があるときだけ作ります。

## コード
```hcl:line-numbers=137
  dynamic "mixed_instances_policy" {
    for_each = var.use_mixed_instances_policy ? [var.mixed_instances_policy] : []

    content {
      dynamic "instances_distribution" {
        for_each = mixed_instances_policy.value.instances_distribution != null ? [mixed_instances_policy.value.instances_distribution] : []

        content {
          on_demand_allocation_strategy            = instances_distribution.value.on_demand_allocation_strategy
          on_demand_base_capacity                  = instances_distribution.value.on_demand_base_capacity
          on_demand_percentage_above_base_capacity = instances_distribution.value.on_demand_percentage_above_base_capacity
          spot_allocation_strategy                 = instances_distribution.value.spot_allocation_strategy
          spot_instance_pools                      = instances_distribution.value.spot_instance_pools
          spot_max_price                           = instances_distribution.value.spot_max_price
        }
      }
```

## 前提知識
- オンデマンド: 使った分だけ払う、通常の料金のインスタンスです。止められることはありません。
- スポットインスタンス: 空いている資源を安く借りるインスタンスです。価格が上がると止められることがあります。
- 混合インスタンス（mixed instances）: 複数の種類や購入方式を、1 つの Auto Scaling グループの中で使う設定です。
- 基本容量（base capacity）: 必ずオンデマンドで用意する台数です。
- `dynamic` の入れ子: 外側のブロックの値を、内側の `for_each` で参照します。

## 何をしているか
### 1. 混合の設定があるときだけ、ブロックを作る

```hcl:line-numbers=138
    for_each = var.use_mixed_instances_policy ? [var.mixed_instances_policy] : []
```

`use_mixed_instances_policy` が真のときだけ、混合のブロックを作ります。偽なら、このブロックは作られず、代わりに通常の起動テンプレートの設定が使われます。

### 2. 配分の設定を、入れ子で作る

```hcl:line-numbers=142
        for_each = mixed_instances_policy.value.instances_distribution != null ? [mixed_instances_policy.value.instances_distribution] : []
```

`instances_distribution` は、配分の方針を書くブロックです。指定があるときだけ、このブロックを作ります。外側の `mixed_instances_policy.value` を見ることで、入れ子の段に値を渡しています。

### 3. 配分の値を、そのまま渡す

```hcl:line-numbers=146
          on_demand_base_capacity                  = instances_distribution.value.on_demand_base_capacity
          on_demand_percentage_above_base_capacity = instances_distribution.value.on_demand_percentage_above_base_capacity
          spot_allocation_strategy                 = instances_distribution.value.spot_allocation_strategy
          spot_instance_pools                      = instances_distribution.value.spot_instance_pools
```

基本容量（最低限オンデマンドで持つ台数）と、基本容量を超えた分のオンデマンドの割合、スポットの割り当て方法などを、利用者の値のまま渡します。数値の意味は AWS が決めるので、モジュールは計算をしていません。

## ここがすごい
「料金を下げつつ、可用性も守る」という判断を、利用者が数値で書けるようにしています。基本容量をオンデマンドで確保し、残りをスポットで混ぜる、という構成を、モジュールは `dynamic` の 2 段で表しています。

また、`use_mixed_instances_policy` のフラグで、通常の起動テンプレートと混合の設定を切り替えています。どちらの場合も、同じ Auto Scaling グループの中に置かれるので、利用者は構成の違いを 1 つのフラグで選べます。

## まとめ
- 通常の料金と安い料金を混ぜるには、基本容量と割合の 2 つを決めます。
- フラグと `dynamic` を組み合わせると、混合の設定を必要なときだけ作れます。
- 入れ子のブロックは、外側の `.value` を使って、段ごとに条件を書けます。
