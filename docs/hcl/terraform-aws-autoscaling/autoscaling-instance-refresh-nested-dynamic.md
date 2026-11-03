---
title: "入れ子の省略可能ブロックを、段ごとに dynamic で作る"
description: "terraform-aws-autoscaling のインスタンス更新。instance_refresh → preferences → alarm_specification の順に、値が無ければ作らない dynamic を重ねる。"
language: hcl
project: "terraform-aws-autoscaling"
repo: https://github.com/terraform-aws-modules/terraform-aws-autoscaling
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "2a249e91c798fdf85ab60c3b1592cc5e11805cc4"
file: main.tf
lines: [87, 100]
format: 2
function: "resource \"aws_autoscaling_group\"（dynamic \"instance_refresh\"・preferences・alarm_specification）"
difficulty: 3
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Auto Scaling グループは、インスタンスを新しい設定に置き換えるときの方法（インスタンス更新）を持ちます。その中には、さらに「一度に何台まで」「アラームが鳴ったら止める」といった、入れ子のブロックがあります。このコードは、その入れ子を 1 段ずつ `dynamic` で作り、途中の値が無ければ下の段も作らないようにしています。

## コード
```hcl:line-numbers=87
  dynamic "instance_refresh" {
    for_each = var.instance_refresh != null ? [var.instance_refresh] : []

    content {
      dynamic "preferences" {
        for_each = instance_refresh.value.preferences != null ? [instance_refresh.value.preferences] : []

        content {
          dynamic "alarm_specification" {
            for_each = preferences.value.alarm_specification != null ? [preferences.value.alarm_specification] : []

            content {
              alarms = alarm_specification.value.alarms
            }
```

## 前提知識
- インスタンス更新（instance refresh）: Auto Scaling グループの起動テンプレートを変えたとき、既存のインスタンスを少しずつ新しいものに入れ替える仕組みです。
- アラーム（CloudWatch Alarm）: 指標が閾値を超えたときに知らせる、監視の仕組みです。ここでは、アラームが鳴ったら更新を止めるために使います。
- `dynamic` ブロックの入れ子: `dynamic` の中に、さらに `dynamic` を書けます。内側では、外側の `dynamic` の名前（`instance_refresh.value` など）を参照します。
- `.value`: `dynamic` の中で、その段の値を指します。
- `null` の連鎖チェック: 上の段が `null` なら、下の段の `for_each` は空になるようにします。

## 何をしているか
### 1. 最上段は、instance_refresh が指定されたときだけ作る

```hcl:line-numbers=88
    for_each = var.instance_refresh != null ? [var.instance_refresh] : []
```

`instance_refresh` は利用者が渡すオブジェクトです。指定が無ければ、この段のブロックは作られず、下の段も評価されません。

### 2. preferences は、その中に値があるときだけ作る

```hcl:line-numbers=92
        for_each = instance_refresh.value.preferences != null ? [instance_refresh.value.preferences] : []
```

`instance_refresh.value` は、1 段上の値を指します。ここで、`preferences` が `null` でなければ、1 つだけ作ります。`instance_refresh.value.preferences` のように書くことで、上の段の値を参照できます。

### 3. アラームは、preferences の中の値から作る

```hcl:line-numbers=95
          dynamic "alarm_specification" {
            for_each = preferences.value.alarm_specification != null ? [preferences.value.alarm_specification] : []
```

同じ書き方を、さらにもう一段重ねています。`preferences.value` を見て、アラームの指定があるときだけ `alarm_specification` を作ります。

## ここがすごい
入れ子のブロックを、それぞれ「値が `null` なら作らない」という同じ形で書いているので、どこまで指定されているかが、どの段を見ても分かります。構造が深くなっても、読み方は 1 段分だけで済みます。

さらに、途中で `null` なら下の段も評価されないので、利用者は必要な段だけを書けます。`instance_refresh` だけを書けば、既定の挙動で更新が行われ、アラームまで指定したいときだけ、下の段を書けばよいのです。

## まとめ
- `dynamic` は、入れ子のブロックにも同じ形で使えます。
- 上の段が `null` なら、下の段は作らない、という規則にすると、読みやすくなります。
- 各段の `.value` を参照して、上の値から下の値を組み立てます。
