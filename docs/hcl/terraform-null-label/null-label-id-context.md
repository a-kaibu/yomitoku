---
title: "ID の部品を並べて、空でないものだけ区切り文字でつなぐ"
description: "Cloud Posse の null-label が、namespace や environment などの部品から、空の部品を飛ばして ID を組み立てる仕組み。labels と id_full の 2 段階で作る。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [140, 151]
format: 2
function: "locals（id_context・labels・id_full）"
difficulty: 2
tags: ["文字列処理", "イディオム"]
---

## ひとことで
`id_context` は、ID の部品（namespace、environment、stage、name、attributes）をマップにまとめたものです。`labels` で空の部品を飛ばして並べ、`id_full` で区切り文字をはさんでつなげて、最終的な ID を作ります。部品の順番は `label_order` という設定で入れ替えられます。

## コード
```hcl:line-numbers=140
  id_context = {
    namespace   = local.namespace
    tenant      = local.tenant
    environment = local.environment
    stage       = local.stage
    name        = local.name
    attributes  = join(local.delimiter, local.attributes)
  }

  labels = [for l in local.label_order : local.id_context[l] if length(local.id_context[l]) > 0]

  id_full = join(local.delimiter, local.labels)
```

## 前提知識
- マップ: `キー = 値` の組の集まりです。`local.id_context["name"]` のように、キーを使って値を取り出します。
- `for` 式: `[for l in リスト : 式 if 条件]` は、リストの各要素を変換し、条件に合うものだけを残します。
- `length(値)`: 文字列の長さを返します。`> 0` で空でないかを判定します。
- `join(区切り, リスト)`: リストの要素を、区切り文字でつないで 1 つの文字列にします。
- `local.label_order`: 部品をどの順番で並べるかを表すリストです。既定値は `["namespace", "environment", "stage", "name", "attributes"]` です。

## 何をしているか
### 1. 部品をマップにまとめる
```hcl:line-numbers=140
  id_context = {
    namespace   = local.namespace
    tenant      = local.tenant
    environment = local.environment
    stage       = local.stage
    name        = local.name
    attributes  = join(local.delimiter, local.attributes)
  }
```

`id_context` は、ID の各部品の名前をキーにしたマップです。`attributes` だけは `join(local.delimiter, local.attributes)` で、属性の複数の値をまず区切り文字でつないだ文字列にしてから入れています。こうすると、どの部品も「文字列 1 つ」として同じ形で扱えます。

### 2. 空の部品を飛ばして並べる
```hcl:line-numbers=149
  labels = [for l in local.label_order : local.id_context[l] if length(local.id_context[l]) > 0]
```

`for l in local.label_order` で、設定された順番に部品を 1 つずつ取り出します。`if length(local.id_context[l]) > 0` があるので、利用者が環境（environment）を指定しなければ、その部品は並びから消えます。順番を表すリストと、部品の値を表すマップが別々にあるので、順番だけを入れ替えても部品の処理は変わりません。

### 3. 区切り文字をはさんでつなぐ
```hcl:line-numbers=151
  id_full = join(local.delimiter, local.labels)
```

`join(local.delimiter, local.labels)` で、残った部品を区切り文字（既定は `-`）でつなぎます。例えば namespace が `cp`、environment が `prod`、name が `api` なら、`cp-prod-api` になります。`join` は空のリストに対しては空文字を返すので、すべての部品が空の場合も壊れません。

## ここがすごい
空の部品を飛ばす処理を、`for` 式の `if` という 1 か所に書いているのが工夫点です。たとえば `if` を使わずに区切り文字を直接つなぐと、部品が空のときに `prod--api` のような二重の区切りが残ってしまいます。このモジュールは、空の部品を先に取り除いてから `join` しているので、区切り文字が連続しない ID になります。

また、`id_context` と `labels` を分けたことで、後の処理で「部品の値そのもの」と「並べた後の部品」を使い分けられます。タグや短い ID の生成は、この 2 つを別々に参照しています。

## まとめ
- マップで部品をまとめると、順番と値を独立に扱えます。
- `for` 式の `if` で空の部品を飛ばすと、区切り文字の重複を防げます。
- `join` は部品を 1 つの文字列にまとめる最後の一手として使うと、読みやすくなります。

