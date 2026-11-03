---
title: "Fargate のときは、EC2 専用の設定を null にして隠す"
description: "terraform-aws-batch のコンピュート環境。種類が FARGATE か FARGATE_SPOT なら、EC2 用の割り当て設定を三項演算子で null にする。"
language: hcl
project: "terraform-aws-batch"
repo: https://github.com/terraform-aws-modules/terraform-aws-batch
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "93a3e2ec1ab003dde08e95b3da055ba040c04ca9"
file: main.tf
lines: [22, 28]
format: 2
function: "resource \"aws_batch_compute_environment\"（dynamic \"compute_resources\"）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
AWS Batch のコンピュート環境は、EC2 で動かす方式と、Fargate（サーバーを意識せず動かす方式）で動かす方式の 2 種類があります。EC2 の方にしかない設定（割り当ての戦略や入札の割合など）は、Fargate では指定できません。このコードは、Fargate のときにそれらの値を `null` にして、AWS に送らないようにしています。

## コード
```hcl:line-numbers=22
  dynamic "compute_resources" {
    for_each = each.value.compute_resources != null ? [each.value.compute_resources] : []

    content {
      allocation_strategy = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.allocation_strategy
      bid_percentage      = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.bid_percentage
      desired_vcpus       = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.desired_vcpus
```

## 前提知識
- AWS Batch: 大量のバッチ処理（ジョブ）を、キューに入れて順番に計算させるサービスです。
- コンピュート環境: ジョブを実行する計算資源の集まりです。EC2 の台数の枠か、Fargate の枠で作ります。
- Fargate: サーバーの管理を AWS に任せて、コンテナを動かす方式です。
- `contains(リスト, 値)`: リストの中に値があれば `true` を返します。
- `null`: 「その設定を送らない」ことを表します。`null` にした属性は、AWS 側の既定値が使われます。
- `dynamic` ブロック: 指定があるときだけ、`compute_resources` ブロックを 1 つ作ります。

## 何をしているか
### 1. 指定があるときだけブロックを作る

```hcl:line-numbers=23
    for_each = each.value.compute_resources != null ? [each.value.compute_resources] : []
```

`compute_resources` は、計算資源の設定をまとめたオブジェクトです。指定が無ければ、ブロックは作られません。指定があれば、1 つだけ作ります。

### 2. Fargate かどうかを、種類の値で判定する

```hcl:line-numbers=26
      allocation_strategy = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.allocation_strategy
```

`contains` で、種類（`type`）が `FARGATE` か `FARGATE_SPOT` のどちらかを調べます。そうなら `null` を入れて、割り当ての戦略を送りません。そうでなければ、利用者の値をそのまま使います。

### 3. 同じ判定を、他の属性にも使う

`bid_percentage`（入札の割合）と `desired_vcpus`（目標の vCPU 数）も、同じ `contains` の判定で `null` にしています。判定を何度も書いていますが、条件は同じなので、読み手は 1 つ理解すれば 3 行分を読めます。

## ここがすごい
利用者は、EC2 と Fargate を切り替えるときに、設定の書き換えを減らせます。Fargate のときに EC2 の値を書いてしまっても、この式がそれを捨てるので、AWS からエラーが返ることを防げます。

「送らない値は `null` にする」という書き方は、設定の意味を変えずに、種類ごとの差を吸収する定番です。`if` で別々のブロックを作るより短く、どの属性が種類で変わるのかが、3 行に並んで見えます。

## まとめ
- `contains` と三項演算子で、種類ごとに送る値を切り替えられます。
- `null` は「送らない」の意味になり、AWS の既定値が使われます。
- 同じ判定を複数の属性に並べると、どの属性が種類で変わるのかが分かりやすくなります。
