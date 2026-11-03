---
title: "EKS のログ先を、クラスター名から決まる名前で作る"
description: "terraform-aws-eks の CloudWatch Logs。/aws/eks/クラスター名/cluster という名前を作り、保持期間などは変数から、名前のタグは最後に付ける。"
language: hcl
project: "terraform-aws-eks"
repo: https://github.com/terraform-aws-modules/terraform-aws-eks
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "91b8a8d944e3cf169483108acd12d5b1e47856f7"
file: main.tf
lines: [291, 306]
format: 2
function: "resource \"aws_cloudwatch_log_group\"（this・EKS クラスターログ）"
difficulty: 1
tags: ["入出力", "API設計"]
---

## ひとことで
EKS のクラスターは、コントロールプレーンのログ（API サーバーや監査のログなど）を CloudWatch Logs に送れます。送り先のロググループの名前は、EKS の慣習に従って `/aws/eks/クラスター名/cluster` とします。このコードは、その名前をクラスター名から組み立て、保持期間や暗号化は利用者の指定から渡します。

## コード
```hcl:line-numbers=291
resource "aws_cloudwatch_log_group" "this" {
  count = local.create && var.create_cloudwatch_log_group ? 1 : 0

  region = var.region

  name              = "/aws/eks/${var.name}/cluster"
  retention_in_days = var.cloudwatch_log_group_retention_in_days
  kms_key_id        = var.cloudwatch_log_group_kms_key_id
  log_group_class   = var.cloudwatch_log_group_class

  tags = merge(
    var.tags,
    var.cloudwatch_log_group_tags,
    { Name = "/aws/eks/${var.name}/cluster" }
  )
}
```

## 前提知識
- EKS のコントロールプレーンのログ: API サーバーや認証、監査などの記録です。障害の調査やセキュリティの監視に使います。
- CloudWatch Logs のロググループ: ログを保存する器で、名前と保持期間などを持ちます。
- `retention_in_days`: ログを残す日数です。
- `log_group_class`: ログの保存の種類（標準や低頻度アクセスなど）です。
- `merge(A, B, C)`: 3 つのマップを 1 つにまとめます。後ろほど優先されます。

## 何をしているか
### 1. 有効なときだけ、ロググループを作る

```hcl:line-numbers=292
  count = local.create && var.create_cloudwatch_log_group ? 1 : 0
```

クラスターを作り、ロググループの作成を有効にしたときだけ、1 つ作ります。どちらかが偽なら、ログの器は作られません。

### 2. 名前をクラスター名から組み立てる

```hcl:line-numbers=296
  name              = "/aws/eks/${var.name}/cluster"
```

EKS がログを書く場所と同じ形の名前を、クラスター名から作ります。利用者はクラスター名を決めるだけで、ロググループの名前も正しく決まります。

### 3. タグの最後に、名前のタグを付ける

```hcl:line-numbers=301
  tags = merge(
    var.tags,
    var.cloudwatch_log_group_tags,
    { Name = "/aws/eks/${var.name}/cluster" }
  )
```

共通のタグ、ロググループ専用のタグ、そして `Name` の順に `merge` します。`Name` は最後に来るので、利用者が同じ名前のタグを書いても、モジュールの名前が優先されます。

## ここがすごい
ロググループの名前は、AWS の慣習に合わせて自動で決まるので、ログを探す人が場所に迷いません。クラスター名さえ分かれば、ログの場所も分かる、という一貫性があります。

また、タグの重ね方で、`Name` を最後に置いているのがよく考えられています。名前は、このモジュールが決めた値であるべきなので、利用者の上書きから守っています。

## まとめ
- サービスの慣習に合わせた名前を作ると、利用者が場所を迷わずに済みます。
- 保持期間などは変数から渡すと、環境ごとに調整できます。
- 重要なタグは `merge` の最後に置くと、上書きされにくくなります。
