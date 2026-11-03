---
title: "AZ の選び方を、3 つの候補のマップにまとめる"
description: "terraform-aws-dynamic-subnets の AZ 選択。ID 指定・名前指定・すべての AZ の 3 つを、それぞれ条件付きのリストとしてマップにまとめる。"
language: hcl
project: "terraform-aws-dynamic-subnets"
repo: https://github.com/cloudposse/terraform-aws-dynamic-subnets
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "ab53498a69d8a48b0c454482ffbbd112c29d450a"
file: main.tf
lines: [37, 41]
format: 2
function: "locals（az_option_map）"
difficulty: 2
tags: ["ネットワーク", "データ構造"]
---

## ひとことで
サブネットを作るには、どの AZ（アベイラビリティゾーン）に置くかを決める必要があります。利用者は、AZ の ID で指定したり、名前で指定したり、何も指定せずにすべての AZ を使ったりできます。このコードは、3 つの候補を 1 つのマップにまとめ、どれを使うかは後の式で選びます。

## コード
```hcl:line-numbers=37
  az_option_map = {
    from_az_ids = local.e ? [for id in var.availability_zone_ids : local.az_id_map[id]] : []
    from_az_var = local.e ? var.availability_zones : []
    all_azs     = local.e ? sort(data.aws_availability_zones.default[0].names) : []
  }
```

## 前提知識
- AZ（アベイラビリティゾーン）: 同じリージョンの中の、独立したデータセンター群です。
- AZ の ID と名前: AZ の名前（`ap-northeast-1a` など）は、アカウントごとに対応が違うことがあります。AZ の ID（`apne1-az1` など）は全アカウントで共通です。
- `for` 式: リストの各要素を変換して、新しいリストを作ります。
- `sort(リスト)`: リストを並べ替えます。並びが安定するので、差分が出にくくなります。
- 条件付きの空リスト: `local.e ? ... : []` は、選ばれない候補を空にして、他の候補と区別します。

## 何をしているか
### 1. AZ の ID から、名前を引く

```hcl:line-numbers=38
    from_az_ids = local.e ? [for id in var.availability_zone_ids : local.az_id_map[id]] : []
```

利用者が AZ の ID を指定したときは、ID を `local.az_id_map` で名前に変換します。ID で書けば、アカウントごとの名前の違いを気にしなくて済みます。

### 2. 名前を、そのまま使う

```hcl:line-numbers=39
    from_az_var = local.e ? var.availability_zones : []
```

利用者が AZ の名前を直接渡したときは、その値をそのまま使います。

### 3. すべての AZ を、並べ替えて使う

```hcl:line-numbers=40
    all_azs     = local.e ? sort(data.aws_availability_zones.default[0].names) : []
```

何も指定しなければ、アカウントで使える AZ の一覧を取り、`sort` で並べ替えます。並べ替えておくと、AZ の順番が毎回同じになります。

## ここがすごい
3 つの候補を、同じ形のマップにしているので、後の処理は「どの候補が空でないか」だけを見れば済みます。候補の数が増えても、マップにもう 1 行足すだけで対応できます。

また、どの候補も `local.e` という条件で守られているのも大切です。作成しないときは、3 つとも空になり、データソースの参照も発生しません。判断を 1 か所にまとめているので、読み手が迷いにくい形です。

## まとめ
- 似た候補は、マップにまとめると、後の選択処理が単純になります。
- ID と名前の違いは、変換を 1 か所で行うと、利用者は好きな方で書けます。
- `sort` で並びを固定すると、同じ設定で同じ結果が得られます。
