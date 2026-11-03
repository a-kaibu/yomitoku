---
title: "空でないルートテーブルの一覧を coalescelist で選ぶ"
description: "terraform-aws-vpc の database サブネットの関連付け。database のルートテーブルが無ければ private のものに戻す coalescelist と、番号を計算する三項演算子の組み合わせ。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [491, 501]
format: 2
function: "resource \"aws_route_table_association\"（database）"
difficulty: 3
tags: ["イディオム", "設計パターン"]
---

## ひとことで
`aws_route_table_association` の `database` は、データベース用のサブネットを、どのルートテーブルに関連付けるかを決めます。専用のルートテーブルが無ければ、プライベート用のものを使います。その選択を `coalescelist` と三項演算子で表しています。

## コード
```hcl:line-numbers=491
resource "aws_route_table_association" "database" {
  count = local.create_database_subnets && (local.create_database_route_table || local.create_private_subnets) ? local.len_database_subnets : 0

  region = var.region

  subnet_id = element(aws_subnet.database[*].id, count.index)
  route_table_id = element(
    coalescelist(aws_route_table.database[*].id, aws_route_table.private[*].id),
    var.create_database_subnet_route_table ? var.single_nat_gateway || var.create_database_internet_gateway_route ? 0 : count.index : count.index,
  )
}
```

## 前提知識
- ルートテーブル: サブネットの通信の行き先を決める表です。サブネットは 1 つのルートテーブルに関連付けられます。
- `aws_route_table_association`: サブネットとルートテーブルを結びつけるリソースです。
- `coalescelist(リストA, リストB)`: 最初に空でないリストを返す関数です。
- `element(リスト, 番号)`: 番号で要素を取り出します。
- `[*]` の書き方: `aws_route_table.database[*].id` のように、`count` で作られたリソースの ID を全部まとめてリストにします。
- 三項演算子は、入れ子にすると「条件 ? (条件 ? 値1 : 値2) : 値3」のように読みます。

## 何をしているか
### 1. 参照するリストを決める
```hcl:line-numbers=497
  route_table_id = element(
    coalescelist(aws_route_table.database[*].id, aws_route_table.private[*].id),
```

`element(coalescelist(...), ...)` の最初の部分では、データベース用のルートテーブルの ID の一覧が空でなければそれを、空ならプライベートのルートテーブルの ID の一覧を使います。どちらのルートテーブルも、`count` で作られるかどうかが変わるため、空になる場合があります。`coalescelist` はその切り替えを 1 つの式にまとめます。

### 2. 使う番号を決める
```hcl:line-numbers=499
    var.create_database_subnet_route_table ? var.single_nat_gateway || var.create_database_internet_gateway_route ? 0 : count.index : count.index,
```

3 番目の引数は、関連付けに使うルートテーブルの番号です。専用のルートテーブルを作らない場合は、常に今の `count.index` を使います。作る場合でも、単一の NAT ゲートウェイか、インターネットゲートウェイへの経路を使うときは 0 番目を使い、それ以外は `count.index` を使います。条件が 2 段に入れ子になっているため、読むときは順番にたどる必要があります。

## ここがすごい
「どちらのルートテーブルを使うか」を、リソースを作る条件とは別に、`element` の引数の中で計算しているのが工夫です。リソースの数は変えずに、関連付け先だけを切り替えられます。

一方で、入れ子の三項演算子は、読みにくさの原因にもなります。このモジュールは、コメントや別の `locals` に分けずに、そのまま書いているので、規則を追うには落ち着いて読む必要があります。読み手にとっては、「なぜ 0 番目なのか」を考えることが、理解の近道になります。

## まとめ
- `coalescelist` で、空でない候補を順に選べます。
- 番号の計算を三項演算子で書くと、リソースを増やさずに切り替えを表現できます。
- 入れ子の条件は、読みにくいので、長くなるときは `locals` に名前を付けると良いです。
