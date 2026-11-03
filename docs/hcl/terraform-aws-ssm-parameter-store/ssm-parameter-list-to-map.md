---
title: "パラメータの一覧を名前付きマップに変え、既定値と重ねる"
description: "terraform-aws-ssm-parameter-store の parameter_write。リストを name をキーにした for 式でマップに変え、既定値を merge で重ねる。"
language: hcl
project: "terraform-aws-ssm-parameter-store"
repo: https://github.com/cloudposse/terraform-aws-ssm-parameter-store
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "27001b2644d69f2e33c35fb09999f98517d5381d"
file: main.tf
lines: [1, 6]
format: 2
function: "locals（parameter_write・parameter_write_ignore_values・parameter_read）"
difficulty: 2
tags: ["データ構造", "API設計"]
---

## ひとことで
SSM パラメータストアには、設定値を名前付きで保存できます。利用者は、パラメータの一覧を「リスト」で書けますが、Terraform のリソースは「名前をキーにしたマップ」で管理すると扱いやすくなります。このコードは、リストを名前付きのマップに変え、既定の値を重ねるところを `locals` で行っています。

## コード
```hcl:line-numbers=1
locals {
  enabled                       = module.this.enabled
  parameter_write               = local.enabled && !var.ignore_value_changes ? { for e in var.parameter_write : e.name => merge(var.parameter_write_defaults, e) } : {}
  parameter_write_ignore_values = local.enabled && var.ignore_value_changes ? { for e in var.parameter_write : e.name => merge(var.parameter_write_defaults, e) } : {}
  parameter_read                = local.enabled ? var.parameter_read : []
}
```

## 前提知識
- SSM パラメータストア: 設定値を名前で保存し、アプリや他の AWS サービスから読める場所です。`String` や `SecureString`（暗号化）などの型があります。
- リストとマップ: リストは順番のある値の並び、マップは「キー → 値」の組です。`for_each` に使えるのはマップ（や集合）です。
- `for` 式: `{ for e in 集まり : キー => 値 }` の形で、リストからマップを作ります。
- `merge(A, B)`: マップを重ねて 1 つにまとめる関数で、後ろの値が優先されます。
- `module.this.enabled`: このモジュールを有効にするかどうかの値です。モジュールの中では、この値が偽のときに何も作らないようにします。

## 何をしているか
### 1. 有効かどうかを、最初に 1 つの値にする

```hcl:line-numbers=2
  enabled                       = module.this.enabled
```

`enabled` は、以降の式で何度も使う値です。`locals` にまとめておくと、それぞれの式で同じ条件を書かずに済みます。

### 2. リストを、name をキーにしたマップに変える

```hcl:line-numbers=3
  parameter_write               = local.enabled && !var.ignore_value_changes ? { for e in var.parameter_write : e.name => merge(var.parameter_write_defaults, e) } : {}
```

`var.parameter_write` は、パラメータの設定を並べたリストです。`for` 式は、それぞれの要素 `e` のキーに `e.name`（パラメータの名前）を使い、値に「既定値に `e` を重ねたもの」を入れます。`merge(var.parameter_write_defaults, e)` で、利用者が省略した `type` や `tier` の値を、既定値から補えます。

結果のマップは、`aws_ssm_parameter` の `for_each` にそのまま渡せます。キーがパラメータの名前なので、リソースの識別子としても安定します。

### 3. 値の変更を無視する場合は、別のマップを使う

```hcl:line-numbers=4
  parameter_write_ignore_values = local.enabled && var.ignore_value_changes ? { for e in var.parameter_write : e.name => merge(var.parameter_write_defaults, e) } : {}
```

`ignore_value_changes` が真のときは、同じ変換を使いつつ、別のマップ `parameter_write_ignore_values` を作ります。こちらは、別のリソース（`aws_ssm_parameter.ignore_value_changes`）に渡されます。どちらか一方のマップだけが空でないので、2 つのリソースが同時に同じパラメータを作ることはありません。

### 4. 読み取る名前は、リストのまま使う

```hcl:line-numbers=5
  parameter_read                = local.enabled ? var.parameter_read : []
```

読み取りのパラメータは、名前の一覧だけで足ります。そのためマップに変換せず、リストのまま `data "aws_ssm_parameter" "read"` の `count` と `element` で使います。

## ここがすごい
リストで受け取り、マップに変換するという書き方は、利用者にとっての使いやすさと、Terraform のリソース管理の安定性を両立させています。リストは書きやすい反面、途中の要素を消すと番号がずれます。マップのキーは名前なので、どのパラメータを消しても、他のパラメータは作り直されません。

また、`ignore_value_changes` で 2 つのマップに振り分ける工夫も見どころです。同じ変換を 2 回書いていますが、条件の違いが 1 行で読み取れます。関数の中で分岐を増やすより、読みやすさが保たれています。

## まとめ
- `for` 式でリストを、キーが安定したマップに変えられます。
- `merge(既定値, 利用者の値)` で、省略された項目を既定値から補えます。
- 条件で 2 つのマップを切り替えると、同じ入力から目的の違うリソースを作れます。
