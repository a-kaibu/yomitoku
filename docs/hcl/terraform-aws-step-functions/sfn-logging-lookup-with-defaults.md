---
title: "ログ設定の既定値を、lookup で一つずつ補う"
description: "terraform-aws-step-functions の logging_configuration。ログの送り先、実行データ、レベルを lookup で読み、無い項目だけ既定値を使う。"
language: hcl
project: "terraform-aws-step-functions"
repo: https://github.com/terraform-aws-modules/terraform-aws-step-functions
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "16c7a1ffaa72643d714a7b3924216edce9413482"
file: main.tf
lines: [40, 42]
format: 2
function: "dynamic \"logging_configuration\"（lookup による既定値）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
ログの設定には、送り先、実行データを含めるか、レベルの三つの項目があります。利用者はそのうち一部だけを書くことがあります。このコードは、項目ごとに `lookup` で読み、書かれていないものだけ既定値を使っています。

## コード
```hcl:line-numbers=40
      log_destination        = lookup(var.logging_configuration, "log_destination", "${local.log_group_arn}:*")
      include_execution_data = lookup(var.logging_configuration, "include_execution_data", null)
      level                  = lookup(var.logging_configuration, "level", null)
```

## 前提知識
- `lookup(マップ, キー, 既定値)`: キーがあればその値、無ければ既定値を返します。
- 既定値の `"${local.log_group_arn}:*"`: 文字列の中に式を埋め込んでいます。送り先の既定値は、ロググループの ARN から作られます。
- `dynamic` ブロック: `for_each` の要素の数だけ、ブロックを作ります。

## 何をしているか
### 1. 送り先は、既定のロググループにする

```hcl:line-numbers=40
      log_destination        = lookup(var.logging_configuration, "log_destination", "${local.log_group_arn}:*")
```

`log_destination` が指定されていなければ、モジュールが作るロググループを送り先にします。既定の送り先は、末尾に `:*` を付けた形のロググループの ARN です。

### 2. 残りの項目は、無ければ null にする

```hcl:line-numbers=41
      include_execution_data = lookup(var.logging_configuration, "include_execution_data", null)
      level                  = lookup(var.logging_configuration, "level", null)
```

実行データを含めるかと、レベルは、既定値を `null` にしています。`null` の属性は、設定を送らないのと同じ扱いになります。

## ここがすごい
項目ごとに、既定値を別々に決められます。送り先だけは意味のある既定値を置き、残りは「指定がなければ送らない」にしています。利用者は、変えたい項目だけを書けばよくなります。

## まとめ
- 項目ごとに `lookup` で読むと、一部だけの指定に強くなります。
- 既定値は、項目の意味に合わせて決めると安全です。
- `null` を既定にすると、指定しなかった項目は送られません。
