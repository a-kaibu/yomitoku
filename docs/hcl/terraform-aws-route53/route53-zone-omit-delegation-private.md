---
title: "ルートの Route 53 ゾーンで、委任セットを送らない"
description: "terraform-aws-route53 のホストゾーン。VPC を指定したプライベートゾーンでは、委任セットや加速回復を null にし、AWS が受け付けない組み合わせを避ける。"
language: hcl
project: "terraform-aws-route53"
repo: https://github.com/terraform-aws-modules/terraform-aws-route53
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "883f987d6bb328c09bd4dfc5a04024534b371d59"
file: main.tf
lines: [22, 23]
format: 2
function: "resource \"aws_route53_zone\"（this・delegation_set_id）"
difficulty: 2
tags: ["ネットワーク", "API設計"]
---

## ひとことで
Route 53 のホストゾーンには、インターネットに公開するパブリックゾーンと、VPC の中だけで使うプライベートゾーンがあります。委任セット（ネームサーバーの組）や加速回復は、パブリックゾーンのための設定です。このコードは、VPC が指定されたプライベートゾーンでは、それらを `null` にして送らないようにしています。

## コード
```hcl:line-numbers=22
  delegation_set_id           = var.vpc == null ? var.delegation_set_id : null
  enable_accelerated_recovery = var.vpc == null ? var.enable_accelerated_recovery : null
```

## 前提知識
- パブリックゾーン: インターネット全体に向けて、DNS の答えを返すゾーンです。
- プライベートゾーン: 指定した VPC の中だけで名前解決される、内部向けのゾーンです。
- 委任セット（delegation set）: パブリックゾーンのネームサーバーを、複数のゾーンで共有するための組です。
- 加速回復（accelerated recovery）: ゾーンの復旧を速めるための設定です。
- `null`: 属性を送らないことを表します。

## 何をしているか
### 1. 委任セットは、プライベートでは送らない

```hcl:line-numbers=22
  delegation_set_id           = var.vpc == null ? var.delegation_set_id : null
```

`var.vpc` が `null` のとき、つまりパブリックゾーンのときだけ、利用者の `delegation_set_id` を使います。VPC を指定したときは `null` です。プライベートゾーンには、委任セットという考え方が無いためです。

### 2. 加速回復も、同じ条件で省く

```hcl:line-numbers=23
  enable_accelerated_recovery = var.vpc == null ? var.enable_accelerated_recovery : null
```

加速回復も、パブリックゾーンのときだけ送ります。判断の条件は、委任セットと同じ `var.vpc == null` です。

## ここがすごい
「どのゾーンの種類か」を 1 つの変数 `vpc` の有無で判定しています。利用者は、VPC を渡すかどうかだけを決めれば、AWS が受け付ける組み合わせになります。

誤った組み合わせを送ると、AWS が API の呼び出しを拒否します。この式は、その失敗を利用者の書き方の問題にせず、モジュールの側で防いでいます。

## まとめ
- ゾーンの種類で使えない属性は、同じ条件で `null` にすると、安全な組み合わせになります。
- 1 つの変数（ここでは `vpc`）の有無で種類を判定できると、利用者の書き方が簡単です。
- 誤った組み合わせを、モジュールの中で防ぐと、利用者は AWS の制約を覚えなくて済みます。
