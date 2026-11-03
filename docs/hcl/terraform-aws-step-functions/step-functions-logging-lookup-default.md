---
title: "ログ設定の省略時は、専用のログ先を lookup で補う"
description: "terraform-aws-step-functions のログ設定。log_destination を lookup で読み、省略時は作成したロググループの ARN に :* を付けた値を使う。"
language: hcl
project: "terraform-aws-step-functions"
repo: https://github.com/terraform-aws-modules/terraform-aws-step-functions
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "16c7a1ffaa72643d714a7b3924216edce9413482"
file: main.tf
lines: [36, 44]
format: 2
function: "resource \"aws_sfn_state_machine\"（dynamic \"logging_configuration\"）"
difficulty: 2
tags: ["入出力", "防御的プログラミング"]
---

## ひとことで
Step Functions は、ステートマシン（処理の流れ）の実行記録を CloudWatch Logs に送れます。送り先の設定は、利用者が書いても書かなくても動くことが望ましいです。このコードは、`lookup` で項目を 1 つずつ読み、送り先が無いときはモジュールが作ったロググループを既定にします。

## コード
```hcl:line-numbers=36
  dynamic "logging_configuration" {
    for_each = local.enable_logging ? [true] : []

    content {
      log_destination        = lookup(var.logging_configuration, "log_destination", "${local.log_group_arn}:*")
      include_execution_data = lookup(var.logging_configuration, "include_execution_data", null)
      level                  = lookup(var.logging_configuration, "level", null)
    }
  }
```

## 前提知識
- Step Functions: 複数の処理を順番や分岐でつなぐ、AWS のワークフローサービスです。
- ステートマシン: 処理の流れを定義したものです。JSON（Amazon States Language）で書きます。
- CloudWatch Logs のロググループ: ログを入れておく場所です。ARN で指定します。
- `lookup(マップ, キー, 既定値)`: マップにキーがあればその値を、無ければ既定値を返します。
- `"${...}:*"`: CloudWatch Logs の送り先は、ロググループの ARN の末尾に `:*` を付けて、すべてのストリームを指す形で書きます。
- `dynamic` と `[true]`: 条件が真のときだけブロックを 1 つ作る書き方です。

## 何をしているか
### 1. ログを有効にするときだけ、ブロックを作る

```hcl:line-numbers=37
    for_each = local.enable_logging ? [true] : []
```

`local.enable_logging` が真のときだけ、ログの設定ブロックを 1 つ作ります。偽なら、ログの設定そのものが省かれます。

### 2. 送り先は、利用者の値か既定の ARN か

```hcl:line-numbers=40
      log_destination        = lookup(var.logging_configuration, "log_destination", "${local.log_group_arn}:*")
```

利用者が `logging_configuration` に `log_destination` を書けば、その値を使います。書いていなければ、モジュールが用意したロググループの ARN に `:*` を付けたものを使います。利用者は送り先を決めなくても、ログが出る状態になります。

### 3. 他の項目も、同じ形で既定値を持つ

`include_execution_data` と `level` も、`lookup` で読み、既定値は `null` にしています。`null` は「AWS の既定値に任せる」という意味です。利用者が書いた項目だけが、AWS に送られます。

## ここがすごい
`lookup` の 3 つ目の引数に既定値を書けるので、利用者の設定を 1 項目ずつ確かめる必要がありません。`var.logging_configuration` は、書かれていない項目があっても、エラーにならずに既定値を返します。

また、送り先の既定値を、モジュールが作ったロググループの ARN から組み立てている点もよい設計です。利用者は ARN を調べずに、すぐにログを確認できます。

## まとめ
- `lookup(マップ, キー, 既定値)` で、マップの項目を安全に既定値付きで読めます。
- 既定の送り先を、作ったリソースの ARN から組み立てると、利用者は ARN を書かずに済みます。
- 省略した項目は `null` にすると、AWS 側の既定の動きに任せられます。
