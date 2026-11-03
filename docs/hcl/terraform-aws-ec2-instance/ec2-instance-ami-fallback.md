---
title: "AMI の ID を、直接指定と SSM の最新値から選ぶ"
description: "terraform-aws-ec2-instance の AMI 選び。利用者が ID を書けばそれを使い、空なら SSM パラメータから最新の AMI ID を読む。coalesce で 1 行にまとめている。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [31, 35]
format: 2
function: "data \"aws_ssm_parameter\"（this）と locals（ami）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
EC2 のインスタンスを作るには、どの OS のイメージ（AMI）から起動するかを決める必要があります。このモジュールでは、利用者が AMI の ID を直接書けばそれを使い、空のときは AWS の SSM パラメータストアに置かれた「最新の AMI ID」を読み込みます。どちらを使うかは、`coalesce` の 1 行で決まります。

## コード
```hcl:line-numbers=31
data "aws_ssm_parameter" "this" {
  region = var.region

  name = var.ami_ssm_parameter
}
```

## 前提知識
- AMI（Amazon Machine Image）: EC2 を起動するときの、OS やソフトウェアが入ったひな形です。ID（`ami-` で始まる文字列）で指定します。
- SSM パラメータストア: AWS が設定値を名前付きで保存しておく場所です。AWS 自身が「最新の Amazon Linux の AMI ID」のような値を公開していることがあります。
- `data` ブロック: 既に存在する情報を読み取るための書き方です。ここでは SSM の値を読みます。
- `coalesce(a, b)`: 最初に空でない値を返します。`null` や空文字列は「空」として飛ばされます。
- `try(x, null)`: `x` の計算がエラーになったら `null` を返します。
- `nonsensitive(...)`: Terraform が機密として扱う値を、普通の値として扱えるようにする関数です。

## 何をしているか
### 1. SSM パラメータを読む

```hcl:line-numbers=31
data "aws_ssm_parameter" "this" {
  region = var.region

  name = var.ami_ssm_parameter
}
```

`var.ami_ssm_parameter` に入っている名前のパラメータを読みます。これは、AWS が公開している「最新の AMI ID」のパラメータ名を利用者が渡す形です。OS のバージョンが上がっても、利用者が AMI ID を書き換えなくて済みます。

### 2. 直接指定か、SSM の値かを選ぶ

```hcl:line-numbers=8
  ami = try(coalesce(var.ami, try(nonsensitive(data.aws_ssm_parameter.this.value), null)), null)
```

`coalesce(var.ami, ...)` は、`var.ami` が空でなければそれを返します。空なら、2 番目の候補の SSM の値を使います。SSM の値の読み取りが失敗したときは内側の `try` が `null` を返し、外側の `try` も `null` を返します。つまり、どちらの方法でも ID が決まらないときは、`null` のまま AWS 側に判断を任せます。

## ここがすごい
利用者が「ID を直接書く」と「最新を自動で使う」のどちらも選べるように、同じ変数の中で `coalesce` の順番を決めているのがよくできています。直接指定の方が優先されるので、テストでは固定の ID、本番では自動の最新、といった使い分けが、変数を 1 つ変えるだけで済みます。

また、`nonsensitive` を使っているのも注目点です。SSM の値は、Terraform の中では機密扱いになることがあります。そのままだと `ami` の値も機密になり、他の場所で扱いにくくなります。`nonsensitive` で通常の値として扱うことで、AMI ID を他の設定で使えるようにしています。

## まとめ
- `coalesce` は「空でない最初の値」を選ぶ関数で、既定値の指定に向いています。
- SSM パラメータを使うと、AMI ID を利用者が毎回書き換えずに済みます。
- `try` と組み合わせると、読み取りの失敗を `null` として扱えます。
