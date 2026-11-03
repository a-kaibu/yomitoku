---
title: "AZ の値が名前か ID かを、正規表現で見分ける"
description: "terraform-aws-vpc のサブネット。azs に入った値が ap-northeast-1a のような名前か、apne1-az1 のような ID かを regexall で判定し、対応する属性へ振り分ける。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [932, 933]
format: 2
function: "resource \"aws_subnet\"（intra・availability_zone と availability_zone_id）"
difficulty: 2
tags: ["文字列処理", "ネットワーク"]
---

## ひとことで
サブネットを作るときは、AZ を指定します。AZ には、`ap-northeast-1a` のような名前と、`apne1-az1` のような ID があり、AWS の属性は別々です。利用者は、どちらの形式でも `azs` に書けます。このコードは、正規表現で値の形を見て、名前なら `availability_zone`、ID なら `availability_zone_id` に振り分けます。

## コード
```hcl:line-numbers=932
  availability_zone                              = length(regexall("^[a-z]+-", element(var.azs, count.index))) > 0 ? element(var.azs, count.index) : null
  availability_zone_id                           = length(regexall("^[a-z]+-", element(var.azs, count.index))) == 0 ? element(var.azs, count.index) : null
```

## 前提知識
- AZ の名前: `リージョン名 + 文字` の形です（例: `ap-northeast-1a`）。アカウントごとに、物理的な場所との対応が違うことがあります。
- AZ の ID: `apne1-az1` のように、全アカウントで共通の識別子です。
- `regexall(パターン, 文字列)`: パターンに合う部分をすべて探します。結果が空でなければ、パターンに一致したことになります。
- `^[a-z]+-`: 文字列の先頭が、英小文字の並びとハイフンで始まるかを表す正規表現です。名前の形を見分けるために使われています。
- `element(リスト, 番号)`: リストの指定した番号の要素を取ります。

## 何をしているか
### 1. 名前の形なら、availability_zone に入れる

```hcl:line-numbers=932
  availability_zone                              = length(regexall("^[a-z]+-", element(var.azs, count.index))) > 0 ? element(var.azs, count.index) : null
```

`element(var.azs, count.index)` で、今作っているサブネットの AZ を取り出します。その値が `^[a-z]+-` に合えば、`regexall` の結果は空でないので、その値を `availability_zone` に入れます。合わなければ `null` です。

### 2. ID の形なら、availability_zone_id に入れる

```hcl:line-numbers=933
  availability_zone_id                           = length(regexall("^[a-z]+-", element(var.azs, count.index))) == 0 ? element(var.azs, count.index) : null
```

次の行は、上の行の逆です。合わないとき（`apne1-az1` のような ID のとき）だけ、`availability_zone_id` に値を入れます。判定の式は同じなので、両方の行を並べると、どちらかが必ず 1 つだけ値を持つことが分かります。

## ここがすごい
利用者は、AZ の形式を気にせずに、`azs` に値を並べられます。名前と ID を混ぜても、モジュールが正しい属性に振り分けます。

また、判定の式を 2 行で完全に反対にして、必ず一方だけが値を持つようにしている点が堅実です。両方に値が入ったり、両方が空になったりする事故を、同じ式の反転で防いでいます。

## まとめ
- `regexall` の結果が空かどうかで、値の形を判定できます。
- 形式が 2 種類ある値は、判定の式を反対にして 2 つの属性に振り分けると、片方だけに値が入ります。
- 利用者が書きやすい形を受けつけ、AWS が要求する属性に変換するのは、モジュールの役割です。
