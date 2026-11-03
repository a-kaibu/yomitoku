---
title: "プロビジョニング済みの同時実行を、-1 のときは作らない"
description: "terraform-aws-lambda のプロビジョニング済み同時実行。設定値が -1 より大きいときだけ、現在のバージョンに対する設定を作る。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [292, 300]
format: 2
function: "resource \"aws_lambda_provisioned_concurrency_config\"（current_version）"
difficulty: 2
tags: ["API設計", "メモリ管理"]
---

## ひとことで
Lambda には、事前に実行環境を温めておく「プロビジョニング済み同時実行」という設定があります。温めた環境の数を決めると、呼び出しの遅れ（コールドスタート）を減らせます。このコードは、利用者の値が `-1` のときは「作らない」という意味にし、それ以外の値のときだけ設定を作ります。

## コード
```hcl:line-numbers=292
resource "aws_lambda_provisioned_concurrency_config" "current_version" {
  count = local.create && var.create_function && !var.create_layer && var.provisioned_concurrent_executions > -1 ? 1 : 0

  region = var.region

  function_name = aws_lambda_function.this[0].function_name
  qualifier     = aws_lambda_function.this[0].version

  provisioned_concurrent_executions = var.provisioned_concurrent_executions
```

## 前提知識
- コールドスタート: Lambda が新しい実行環境を用意するときにかかる、最初の遅れです。
- プロビジョニング済み同時実行: 指定した数の実行環境を、常に温めておく設定です。料金がかかります。
- バージョンとエイリアス: Lambda の関数の特定の版です。設定は、特定のバージョンに付けます。
- `qualifier`: 関数の版やエイリアスを指定する値です。
- `-1` の意味: このモジュールでは、設定を作らないことを表す合図として使っています。

## 何をしているか
### 1. 作る条件を 4 つ確かめる

```hcl:line-numbers=293
  count = local.create && var.create_function && !var.create_layer && var.provisioned_concurrent_executions > -1 ? 1 : 0
```

モジュールを作る、関数を作る、レイヤーではない、そして `provisioned_concurrent_executions` が `-1` より大きい、の 4 つがそろったときに 1 つ作ります。`-1` の場合は、4 つ目の条件で偽になり、何も作られません。

### 2. 最新のバージョンに設定する

```hcl:line-numbers=297
  function_name = aws_lambda_function.this[0].function_name
  qualifier     = aws_lambda_function.this[0].version
```

関数の名前と、今のバージョン番号を指定します。プロビジョニング済み同時実行は、関数の特定の版にだけ付けられるので、`version` を使っています。

### 3. 同時実行数を渡す

```hcl:line-numbers=300
  provisioned_concurrent_executions = var.provisioned_concurrent_executions
```

温めておく実行環境の数を、利用者の値のまま渡します。

## ここがすごい
「作らない」を表す値を、`-1` という負の数で決めています。`0` は「0 個用意する」という意味になり、「作らない」とは区別されます。その結果、利用者は 0 と -1 を使い分けられ、意味のずれが起きません。

また、作る条件を `count` の中の 1 行にまとめ、関数の作成や、レイヤーのときの扱いとも連動させています。温めた環境は料金がかかるので、不要なときに作らない判定が、コストの面でも効いています。

## まとめ
- 特別な値（ここでは `-1`）で「作らない」を表すと、設定の意味がはっきりします。
- `count` の条件に、関連する作成条件をまとめて書けます。
- 特定の版にだけ付く設定は、`version` を指定して対象を明確にします。
