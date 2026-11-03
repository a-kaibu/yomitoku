---
title: "Lambda のロググループ名を、関数名から決める"
description: "terraform-aws-notify-slack の CloudWatch Logs のロググループ。Lambda の標準の /aws/lambda/ の接頭辞と関数名をつなげ、保持期間と暗号化を変数から渡す。"
language: hcl
project: "terraform-aws-notify-slack"
repo: https://github.com/terraform-aws-modules/terraform-aws-notify-slack
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "a7765ac0a547f95c8aa48459f84077be8562c0f7"
file: main.tf
lines: [54, 61]
format: 2
function: "resource \"aws_cloudwatch_log_group\"（lambda）"
difficulty: 1
tags: ["入出力", "API設計"]
---

## ひとことで
Lambda 関数のログは、CloudWatch Logs に自動で `/aws/lambda/関数名` という名前のロググループに書かれます。ただし、名前を自分で決めて、保持期間や暗号化を付けたいこともあります。このコードは、Lambda の標準の名前の形を使ってロググループを作り、保持期間と暗号化の設定を変数から渡します。

## コード
```hcl:line-numbers=54
resource "aws_cloudwatch_log_group" "lambda" {
  count = var.create ? 1 : 0

  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = var.cloudwatch_log_group_retention_in_days
  kms_key_id        = var.cloudwatch_log_group_kms_key_id

  tags = merge(var.tags, var.cloudwatch_log_group_tags)
```

## 前提知識
- CloudWatch Logs のロググループ: ログを入れておく器です。ログの保持期間や暗号化を、グループごとに決められます。
- `/aws/lambda/`: Lambda が標準で使うロググループの接頭辞です。この名前にしておくと、Lambda のログと自然に結び付きます。
- `retention_in_days`: ログを何日残すかです。期限を過ぎたログは自動で消えます。
- `kms_key_id`: ログを暗号化するための KMS 鍵です。指定しなければ、AWS の既定の暗号化が使われます。
- `merge(A, B)`: タグのマップを 1 つにまとめる関数です。後ろの値が優先されます。

## 何をしているか
### 1. 名前は、Lambda の形に従う

```hcl:line-numbers=57
  name              = "/aws/lambda/${var.lambda_function_name}"
```

ロググループの名前は `/aws/lambda/` に関数名をつなげたものです。これで、Lambda が書くログの場所と一致します。関数名を変えれば、ロググループの名前も自動で変わります。

### 2. 保持期間と暗号化を、変数から渡す

```hcl:line-numbers=58
  retention_in_days = var.cloudwatch_log_group_retention_in_days
  kms_key_id        = var.cloudwatch_log_group_kms_key_id
```

保持期間と KMS 鍵は、利用者が決めた値をそのまま使います。どちらも既定の値を持つので、何も書かなければ標準の動きになります。

### 3. タグを、利用者のものと重ねる

```hcl:line-numbers=61
  tags = merge(var.tags, var.cloudwatch_log_group_tags)
```

共通のタグと、ロググループ専用のタグを `merge` で重ねます。後ろの専用のタグが優先されるので、個別の値で上書きできます。

## ここがすごい
ロググループの名前を、Lambda の標準の形に合わせたことで、利用者は名前を決める必要がありません。さらに、関数名を変えるだけで、ログの場所も自動で追随します。

また、保持期間や暗号化を変数から渡せるようにしているので、ログを長く残すかどうか、暗号化するかどうかを、利用者が決められます。標準の形を保ったまま、細かな調整を許しています。

## まとめ
- サービスが決めた名前の形に合わせると、ログの場所を迷わずに済みます。
- 保持期間と暗号化は、変数から渡すと、利用者が環境に合わせて調整できます。
- 共通のタグと個別のタグは、`merge` で後ろを優先して重ねられます。
