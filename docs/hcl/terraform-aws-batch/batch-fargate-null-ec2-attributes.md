---
title: "Fargate のときは EC2 向けの設定を null にする"
description: "terraform-aws-batch の compute_resources。タイプが FARGATE か FARGATE_SPOT のとき、EC2 専用の設定を contains と三項演算子で null にする。"
language: hcl
project: "terraform-aws-batch"
repo: https://github.com/terraform-aws-modules/terraform-aws-batch
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "93a3e2ec1ab003dde08e95b3da055ba040c04ca9"
file: main.tf
lines: [39, 41]
format: 2
function: "locals ではなく compute_environment の compute_resources（contains と三項演算子）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
AWS Batch の実行環境には、EC2 と Fargate の二つの種類があります。Fargate では、EC2 専用の設定を指定できません。このコードは、種類が Fargate のときだけ、EC2 向けの設定を `null` にしています。

## コード
```hcl:line-numbers=39
      ec2_key_pair  = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.ec2_key_pair
      instance_role = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : try(aws_iam_instance_profile.instance[0].arn, compute_resources.value.instance_role)
      instance_type = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.instance_types
```

## 前提知識
- Fargate: サーバーを管理せずにコンテナを動かす AWS の方式です。
- `contains(リスト, 値)`: リストに値が含まれるかを判定します。
- `null`: 属性を省略したのと同じ扱いになります。

## 何をしているか
### 1. Fargate かどうかを判定する

```hcl:line-numbers=39
      ec2_key_pair  = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.ec2_key_pair
```

`contains` で、種類が `FARGATE` か `FARGATE_SPOT` の場合を判定します。Fargate なら、キーペアは `null` になります。

### 2. EC2 専用の値を、Fargate では省く

```hcl:line-numbers=40
      instance_role = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : try(aws_iam_instance_profile.instance[0].arn, compute_resources.value.instance_role)
      instance_type = contains(["FARGATE", "FARGATE_SPOT"], compute_resources.value.type) ? null : compute_resources.value.instance_types
```

インスタンスのロールとインスタンスの種類も、同じ判定で `null` にします。Fargate では、これらの設定は送られません。

## ここがすごい
同じ判定を、複数の属性に繰り返し書いています。判定の条件を揃えておくと、Fargate と EC2 の差が、どの行を見ても分かります。

## まとめ
- `contains` で、種類の一覧に対する判定を書けます。
- 対象外の設定は `null` にすると、属性を省略したのと同じになります。
- 同じ条件を複数の属性で使うときは、条件の書き方をそろえると読みやすくなります。
