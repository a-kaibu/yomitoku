---
title: "ログの送り先を、作った CloudWatch Logs か利用者の指定で切り替える"
description: "terraform-aws-elasticache のログ配信。送り先が CloudWatch Logs のときは作成したロググループを使い、それ以外は利用者の指定をそのまま使う。"
language: hcl
project: "terraform-aws-elasticache"
repo: https://github.com/terraform-aws-modules/terraform-aws-elasticache
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "41a277b73b9d375a2856886ab8469fd3f8b6d0ef"
file: main.tf
lines: [95, 104]
format: 2
function: "resource \"aws_elasticache_replication_group\"（dynamic \"log_delivery_configuration\"）"
difficulty: 2
tags: ["入出力", "API設計"]
---

## ひとことで
ElastiCache は、スローログなどのログを、CloudWatch Logs や Kinesis Data Firehose などの送り先へ配信できます。送り先が CloudWatch Logs のときは、このモジュールが作ったロググループの名前を使い、それ以外は利用者が指定した送り先をそのまま使います。このコードは、その切り替えを 1 行の式で行っています。

## コード
```hcl:line-numbers=95
  dynamic "log_delivery_configuration" {
    for_each = { for k, v in var.log_delivery_configuration : k => v if var.engine != "memcached" }

    content {
      destination      = try(log_delivery_configuration.value.create_cloudwatch_log_group, true) && log_delivery_configuration.value.destination_type == "cloudwatch-logs" ? aws_cloudwatch_log_group.this[log_delivery_configuration.key].name : log_delivery_configuration.value.destination
      destination_type = log_delivery_configuration.value.destination_type
      log_format       = log_delivery_configuration.value.log_format
      log_type         = try(log_delivery_configuration.value.log_type, log_delivery_configuration.key)
    }
  }
```

## 前提知識
- スローログ: 処理に時間がかかったコマンドを記録するログです。性能の問題を調べるために使います。
- CloudWatch Logs: AWS のログを保存して検索できるサービスです。ロググループという単位でログをまとめます。
- Kinesis Data Firehose: ログを別の保存先（S3 など）へ流すための AWS のサービスです。
- `try(値, 代わり)`: 値がエラーになったら、代わりの値を使います。
- `for_each` にマップを渡す: 「キーが名前」の要素ごとにブロックを作ります。

## 何をしているか
### 1. memcached では、ログ配信を作らない

```hcl:line-numbers=96
    for_each = { for k, v in var.log_delivery_configuration : k => v if var.engine != "memcached" }
```

ログ配信は Redis の機能なので、エンジンが memcached のときは、マップを空にして何も作りません。キーがそのまま識別子になるので、ログの種類ごとに 1 つずつ作られます。

### 2. 送り先を、CloudWatch Logs か利用者の値から選ぶ

```hcl:line-numbers=99
      destination      = try(log_delivery_configuration.value.create_cloudwatch_log_group, true) && log_delivery_configuration.value.destination_type == "cloudwatch-logs" ? aws_cloudwatch_log_group.this[log_delivery_configuration.key].name : log_delivery_configuration.value.destination
```

送り先の種類が `cloudwatch-logs` で、かつロググループを作る設定（既定は真）のときは、このモジュールが作ったロググループの名前を使います。それ以外は、利用者が `destination` に書いた値をそのまま使います。`try` は、`create_cloudwatch_log_group` の指定がないときに `true` を使うための仕組みです。

### 3. ログの種類は、キー名で補う

```hcl:line-numbers=102
      log_type         = try(log_delivery_configuration.value.log_type, log_delivery_configuration.key)
```

`log_type` を省略したら、マップのキー名がログの種類として使われます。例えば `slow-log` というキーで書けば、種類もそれになります。

## ここがすごい
送り先が 2 種類あるのに、利用者は同じ項目名で書けます。モジュールが作った CloudWatch のロググループを使うか、外で作った送り先を使うかは、式の中で自動で決まります。

また、キー名を既定の種類にする書き方は、マップの設計をうまく使っています。利用者は、ログの種類を 2 回書かずに済み、キーを見るだけで種類が分かります。

## まとめ
- `try` で既定の値を書くと、省略された項目を補えます。
- 送り先の種類ごとに、作る資源と利用者の値を切り替えられます。
- マップのキーを既定値に使うと、設定の書き忘れを減らせます。
