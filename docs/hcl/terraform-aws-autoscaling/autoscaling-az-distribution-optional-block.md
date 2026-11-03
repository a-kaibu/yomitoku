---
title: "省略できるブロックを、1 要素のリストで作るか作らないか決める"
description: "terraform-aws-autoscaling の availability_zone_distribution。オブジェクトが null でなければ、1 要素のリストで dynamic ブロックを 1 回だけ作る。"
language: hcl
project: "terraform-aws-autoscaling"
repo: https://github.com/terraform-aws-modules/terraform-aws-autoscaling
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "2a249e91c798fdf85ab60c3b1592cc5e11805cc4"
file: main.tf
lines: [28, 34]
format: 2
function: "resource \"aws_autoscaling_group\"（dynamic \"availability_zone_distribution\"）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
Auto Scaling グループには、AZ（アベイラビリティゾーン）ごとの配分の方法を指定するブロックがあります。このブロックは、指定したときだけ付けたいものです。このコードは、利用者が値を渡したときだけ 1 つのブロックを作り、`null` のときは何も作らない書き方をしています。

## コード
```hcl:line-numbers=28
  dynamic "availability_zone_distribution" {
    for_each = var.availability_zone_distribution != null ? [var.availability_zone_distribution] : []

    content {
      capacity_distribution_strategy = availability_zone_distribution.value.capacity_distribution_strategy
    }
  }
```

## 前提知識
- AZ（アベイラビリティゾーン）: 同じリージョンの中で、電源やネットワークが独立した、データセンター群の単位です。
- `dynamic` ブロック: リソースの中の、繰り返しや省略が可能なブロックを、`for_each` で作る書き方です。
- `[値]`（1 要素のリスト）: 値を 1 つだけ持つリストです。`for_each` は、リストを渡しても、マップを渡しても使えます。
- `[]`（空のリスト）: 要素が 0 個のリストです。`for_each` に渡すと、ブロックは 1 つも作られません。
- `capacity_distribution_strategy`: AZ 間で、インスタンスをどのように配分するかの方針を表す値です。

## 何をしているか
### 1. 値が無いときは、ブロックを作らない

```hcl:line-numbers=29
    for_each = var.availability_zone_distribution != null ? [var.availability_zone_distribution] : []
```

利用者が `availability_zone_distribution` を書いていなければ、`null` が入ります。このとき `for_each` には空のリストが渡されるので、ブロックは作られません。書いていれば、1 要素のリストになるので、ブロックが 1 つ作られます。

### 2. 中では、値を `.value` から読む

```hcl:line-numbers=32
      capacity_distribution_strategy = availability_zone_distribution.value.capacity_distribution_strategy
```

`dynamic` の中では、`availability_zone_distribution.value` が、リストの要素、つまり利用者が書いたオブジェクトを指します。`.capacity_distribution_strategy` で、その中の項目を読み出します。

## ここがすごい
「ブロックを 1 つ作るか、作らないか」を、`for_each` のリストの長さだけで決めているのが巧みです。`count` を使うと、ブロックそのものは作れないので、この書き方が向いています。

また、利用者の値を 1 要素のリストに包む、という一手間で、単独のオブジェクトと、繰り返しのブロックを同じ仕組みで扱えています。読み手にとっては、「`[値]` と `[]` だけで、有るか無いかを切り替えている」と覚えれば十分です。

## まとめ
- `dynamic` の `for_each` に `[値]` か `[]` を渡すと、ブロックの有無を切り替えられます。
- `null` の判定と三項演算子を組み合わせると、省略可能な設定を安全に扱えます。
- `.value` で、ブロックの中の値を読めます。
