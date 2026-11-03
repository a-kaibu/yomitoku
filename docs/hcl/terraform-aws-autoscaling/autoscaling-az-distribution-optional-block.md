---
title: "AZ の配分の設定を、指定があるときだけブロックにする"
description: "terraform-aws-autoscaling の availability_zone_distribution。変数が null でなければ一つだけブロックを作り、無ければ作らない。"
language: hcl
project: "terraform-aws-autoscaling"
repo: https://github.com/terraform-aws-modules/terraform-aws-autoscaling
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "2a249e91c798fdf85ab60c3b1592cc5e11805cc4"
file: main.tf
lines: [28, 33]
format: 2
function: "resource \"aws_autoscaling_group\"（dynamic \"availability_zone_distribution\"）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Auto Scaling グループには、AZ にインスタンスを配分する方法を指定できます。指定しない利用者も多いので、その場合はブロックを作らないようにします。このコードは、変数が `null` でなければ一つのブロックを、`null` なら何も作らない書き方をしています。

## コード
```hcl:line-numbers=28
  dynamic "availability_zone_distribution" {
    for_each = var.availability_zone_distribution != null ? [var.availability_zone_distribution] : []

    content {
      capacity_distribution_strategy = availability_zone_distribution.value.capacity_distribution_strategy
    }
```

## 前提知識
- `dynamic` ブロック: `for_each` の要素の数だけ、ブロックを作ります。
- `[値]` と `[]`: 一要素のリストと空のリストです。`for_each` に渡すと、ブロックが一つか零かを決められます。
- `capacity_distribution_strategy`: AZ 間で容量をどう配分するかを決める設定です。

## 何をしているか
### 1. 指定があれば、一要素のリストを作る

```hcl:line-numbers=29
    for_each = var.availability_zone_distribution != null ? [var.availability_zone_distribution] : []
```

`var.availability_zone_distribution` が `null` でなければ、その値を一つだけ含むリストになります。

### 2. ブロックの中で、配分の戦略を写す

```hcl:line-numbers=31
    content {
      capacity_distribution_strategy = availability_zone_distribution.value.capacity_distribution_strategy
    }
```

`content` の中で、戦略の値を属性に写します。リストの要素は一つなので、ブロックも一つだけ作られます。

## ここがすごい
「指定があるか」を、ブロックの有無という形で表しています。`if` で属性そのものを書き分けるのではなく、ブロックを作るかどうかを決めるので、指定しない場合は設定が丸ごと省かれます。

## まとめ
- 指定の有無でブロックを作るかを決めると、省略時の挙動が明確になります。
- `[値]` を `for_each` に渡すと、一つだけブロックを作れます。
- ブロック全体を省けるように書くと、資源の既定値に影響を与えません。
