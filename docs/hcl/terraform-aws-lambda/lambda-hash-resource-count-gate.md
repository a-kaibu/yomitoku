---
title: "ハッシュ計算の資源を、設定で作るかどうか決める"
description: "terraform-aws-lambda の terraform_data。ignore_source_code_hash が真のときは count を 0 にし、資源そのものを作らない。"
language: hcl
project: "terraform-aws-lambda"
repo: https://github.com/terraform-aws-modules/terraform-aws-lambda
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "e73238631a030105fc8d09789033cc0bfed83310"
file: main.tf
lines: [29, 30]
format: 2
function: "resource \"terraform_data\"（count による作成の切り替え）"
difficulty: 1
tags: ["防御的プログラミング", "API設計"]
---

## ひとことで
Lambda のコードの変更を検出するために、ファイルのハッシュを計算する資源を作ります。ただし、利用者がハッシュの計算を望まないときは、この資源をまったく作りません。`count` の三項演算子で、作るかどうかを切り替えています。

## コード
```hcl:line-numbers=29
resource "terraform_data" "package_filename_for_hash" {
  count = var.ignore_source_code_hash ? 0 : 1
```

## 前提知識
- `terraform_data`: 値を保持するだけの資源です。他の資源の依存関係を組むときに使います。
- `count`: 数を指定して資源を複数作る引数です。`0` にすると、その資源は作られません。
- 三項演算子 `条件 ? 真 : 偽`: 条件に応じて値を選びます。

## 何をしているか
### 1. 無効化されていれば、件数を 0 にする

```hcl:line-numbers=30
  count = var.ignore_source_code_hash ? 0 : 1
```

`var.ignore_source_code_hash` が真なら `0` になり、資源は作られません。偽なら `1` になり、資源が 1 つ作られます。

### 2. 参照する側は、資源があるときだけ添字を読む

ハッシュの値は、この資源の出力から読まれます。その読み出しは、無効化されていないときの分岐の中にあるため、`count` が 0 のときに `[0]` を読んで失敗することはありません。

## ここがすごい
「機能を使わないときは、資源ごと消す」という考え方が、`count` ひとつで実現できています。使わない機能の資源が残らないので、plan の出力もすっきりします。

## まとめ
- `count = 条件 ? 0 : 1` で、資源を作るかどうかを切り替えられます。
- 無効化時に資源を消すと、不要な計算や差分を防げます。
- 参照側は、資源が無い場合の分岐も一緒に書くと安全です。
