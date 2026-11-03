---
title: "レジストリの脆弱性スキャンを、ルールごとに振り分ける"
description: "terraform-aws-ecr のレジストリスキャン設定。ルールの一覧を dynamic で 1 つずつ作り、頻度とリポジトリのフィルタを入れ子で指定する。"
language: hcl
project: "terraform-aws-ecr"
repo: https://github.com/terraform-aws-modules/terraform-aws-ecr
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "f05e615fa452e813935986295e7770f8fa96948b"
file: main.tf
lines: [300, 312]
format: 2
function: "resource \"aws_ecr_registry_scanning_configuration\"（this・dynamic \"rule\"）"
difficulty: 2
tags: ["セキュリティ", "API設計"]
---

## ひとことで
ECR（コンテナイメージのレジストリ）は、保存したイメージの脆弱性を自動でスキャンできます。どのリポジトリを、どのくらいの頻度でスキャンするかは、「ルール」の一覧で決めます。このコードは、利用者が渡したルールを `dynamic` で 1 つずつ作り、その中でリポジトリ名のフィルタも入れ子で作ります。

## コード
```hcl:line-numbers=300
resource "aws_ecr_registry_scanning_configuration" "this" {
  count = var.create && var.manage_registry_scanning_configuration ? 1 : 0

  scan_type = var.registry_scan_type
  region    = var.region

  dynamic "rule" {
    for_each = var.registry_scan_rules != null ? var.registry_scan_rules : []

    content {
      scan_frequency = rule.value.scan_frequency

      dynamic "repository_filter" {
```

## 前提知識
- ECR（Elastic Container Registry）: Docker などのコンテナイメージを保存する AWS のサービスです。
- 脆弱性スキャン: イメージの中のソフトウェアに、既知のセキュリティ上の問題がないかを調べる機能です。
- スキャンの種類（scan_type）: スキャンの深さを選ぶ値です。
- `scan_frequency`: いつスキャンするかの頻度です。
- `dynamic` の入れ子: ルールの中に、フィルタのブロックを並べられます。
- `rule.value`: `dynamic` の中で、その要素（ルール）の値を指します。

## 何をしているか
### 1. 管理するかどうかを条件で決める

```hcl:line-numbers=301
  count = var.create && var.manage_registry_scanning_configuration ? 1 : 0
```

モジュールを作る設定と、スキャンの管理を有効にする設定の両方が真のときだけ、この設定が作られます。レジストリの設定は、アカウントに 1 つだけあるので、利用者が管理しないときは作らないようにしています。

### 2. ルールを、利用者の一覧から 1 つずつ作る

```hcl:line-numbers=306
  dynamic "rule" {
    for_each = var.registry_scan_rules != null ? var.registry_scan_rules : []
```

`registry_scan_rules` は、ルールのリストです。指定がなければ空のリストになり、ルールは作られません。指定があれば、それぞれのルールを `rule` のブロックとして作ります。

### 3. 頻度を書き、フィルタを入れ子で足す

```hcl:line-numbers=310
      scan_frequency = rule.value.scan_frequency
```

ルールごとに頻度を決めます。その中の `repository_filter` は、どのリポジトリにそのルールを適用するかを決めます。`rule.value` で、そのルールの値を読みます。こうすると、「本番は毎日、開発は連続的に」といった違いを、1 つのリソースの中で書けます。

## ここがすごい
ルールは、利用者が何種類でも書けるように、一覧で受け取る形になっています。1 つのリソースで、リポジトリごとに違うスキャンを並べられるのは、`dynamic` を入れ子にしているからです。

さらに、`count` と `dynamic` を役割で分けています。レジストリ全体の設定は `count` で 1 つだけ作り、その中のルールは `dynamic` で増やします。どの範囲が 1 つで、どの範囲が複数かが、ひと目で分かります。

## まとめ
- `count` は「作るかどうか」、`dynamic` は「何個作るか」に使うと、役割が分かれます。
- `dynamic` は入れ子にできるので、ルールとフィルタを段ごとに並べられます。
- 一覧で受け取る設定は、利用者が好きな数だけ書けるので、柔軟性があります。
