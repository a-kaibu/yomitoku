---
title: "有効フラグと文字列の状態を 1 つの値に変える"
description: "terraform-aws-s3-bucket のライフサイクルルール。enabled の真偽値と status の文字列のどちらでも受け取り、AWS の Enabled か Disabled に変換する式。"
language: hcl
project: "terraform-aws-s3-bucket"
repo: https://github.com/terraform-aws-modules/terraform-aws-s3-bucket
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "9afa4fc8c8f1e0b3fd913474c1bef8d0c454b235"
file: main.tf
lines: [382, 387]
format: 2
function: "resource \"aws_s3_bucket_lifecycle_configuration\"（dynamic \"rule\"）"
difficulty: 3
tags: ["型システム", "文字列処理"]
---

## ひとことで
ライフサイクルルールの `status` は、AWS では `Enabled` か `Disabled` の文字列です。このモジュールは、利用者が `enabled = true` のような真偽値で書いても、`status = "enabled"` のような文字列で書いても、どちらでも同じ `Enabled` か `Disabled` に変換します。

## コード
```hcl:line-numbers=382
  dynamic "rule" {
    for_each = var.lifecycle_rule

    content {
      id     = rule.value.id
      status = rule.value.enabled != null ? (rule.value.enabled ? "Enabled" : "Disabled") : try(tobool(rule.value.status) ? "Enabled" : "Disabled", title(lower(rule.value.status)))
```

## 前提知識
- `dynamic "rule" { for_each = ... content { ... } }`: 利用者のルールの一覧から、ルールのブロックを 1 件ずつ作ります。
- `rule.value`: `dynamic` ブロックの今の要素を指します。
- `null`: 値がないことを表します。`!= null` で、値が入っているかを確かめられます。
- `tobool(値)`: 値を真偽値に変換する関数です。文字列の `"true"` などを真偽値にできますが、変換できない値はエラーになります。
- `try(式, 既定値)`: 式がエラーになったら既定値を返します。
- `title(lower(...))`: 文字列の大文字小文字をそろえる関数です。

## 何をしているか
### 1. 真偽値の enabled を優先する
```hcl:line-numbers=387
      status = rule.value.enabled != null ? (rule.value.enabled ? "Enabled" : "Disabled") : try(tobool(rule.value.status) ? "Enabled" : "Disabled", title(lower(rule.value.status)))
```

まず `rule.value.enabled != null` を調べ、値があれば `rule.value.enabled` が真なら `Enabled`、偽なら `Disabled` を選びます。三項演算子を入れ子にして、真偽値の指定を 1 段目で扱っています。

### 2. 文字列の status を変換する
同じ行の後半、`try(...)` の部分が、`status` の文字列を扱います。`tobool(rule.value.status)` が成功すれば、その真偽値で `Enabled` か `Disabled` を決めます。変換に失敗すれば、`title(lower(rule.value.status))` の結果をそのまま使い、利用者が `Enabled` と書けばそのまま通るようにしています。

## ここがすごい
利用者にとって、「真偽値で書く」と「文字列で書く」のどちらが自然かは人によって違います。このモジュールは、両方を受け入れることで、どちらの書き方でも同じ結果を得られるようにしています。

ただし、入れ子の三項演算子と `try` が 1 行に詰め込まれているので、読み取りにくさがあります。読み手は、「まず enabled、次に status」の順番を追って理解する必要があります。

## まとめ
- `!= null` で、どちらの指定があるかを判定できます。
- `tobool` と `try` の組み合わせで、真偽値と文字列の両方を受け入れられます。
- 入力の形が複数あるときは、変換を 1 か所にまとめると、AWS 側の値を一種類に保てます。

