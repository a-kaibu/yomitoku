---
title: "バースト型のインスタンスだけ、CPU クレジットを指定する"
description: "terraform-aws-ec2-instance の credit_specification。t 系のインスタンスのときだけ cpu_credits を送り、それ以外では null にする。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [78, 80]
format: 2
function: "resource \"aws_instance\"（credit_specification）"
difficulty: 2
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
EC2 の t2、t3 などのバースト型インスタンスは、CPU の使用量に応じた「CPU クレジット」を貯めたり使ったりして動きます。この設定は、バースト型でないインスタンスには意味がありません。このコードは、インスタンスの種類を判定し、バースト型のときだけ CPU クレジットの指定を送ります。

## コード
```hcl:line-numbers=78
  credit_specification {
    cpu_credits = local.is_t_instance_type ? var.cpu_credits : null
  }
```

## 前提知識
- バースト型インスタンス: 普段は低い CPU の使用率で動き、急に高い負荷が必要なときに、貯めたクレジットを使って性能を上げるタイプです。t 系が代表的です。
- CPU クレジット: バースト型の CPU の使用量の枠です。使わない時間に貯まり、高負荷のときに減ります。
- `credit_specification`: バースト型のインスタンスで、クレジットの扱い（`standard` か `unlimited`）を決めるブロックです。
- `is_t_instance_type`: このモジュールが、インスタンスの種類名（`t2.micro` など）から、バースト型かどうかを判定した真偽値です。
- `null`: 属性を送らないという意味です。

## 何をしているか
### 1. バースト型のときだけ、クレジットの設定を送る

```hcl:line-numbers=79
    cpu_credits = local.is_t_instance_type ? var.cpu_credits : null
```

`local.is_t_instance_type` が真なら、利用者の `cpu_credits` を使います。偽なら `null` です。`null` を送らないことで、非バースト型のインスタンスに、無効な設定が付かなくなります。

### 2. 種類の判定は、名前から行う

ファイルの前のほうの `local` では、`replace` と正規表現を使って、インスタンスの種類名が `t2`、`t3`、`t3a`、`t4g` のどれかかを調べています。この判定の結果が、ここで使われています。

## ここがすごい
インスタンスの種類によって有効な設定が違うとき、モジュールが判定を 1 か所で行い、そこから属性を切り替えています。利用者は、`instance_type` を変えるだけで、CPU クレジットの扱いも自動で正しくなります。

また、`cpu_credits` の値を書いていても、非バースト型では `null` になって無視されます。設定の書き忘れや不要な指定によるエラーを、式が吸収しています。

## まとめ
- 種類ごとに有効な設定が違うときは、判定を 1 か所の `local` にまとめると分かりやすくなります。
- 無効な組み合わせは、三項演算子で `null` にすると、エラーを防げます。
- 名前から種類を判定する方法は、設定の一覧が変わっても一か所の修正で済みます。
