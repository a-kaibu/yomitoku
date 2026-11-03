---
title: "関連する 2 つのリストの長さを max で求める"
description: "terraform-aws-vpc の locals。サブネット本体の CIDR 一覧と、IPv6 の接頭辞一覧の長さを比べ、max で大きいほうを数として使う書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: main.tf
lines: [1, 8]
format: 2
function: "locals（len_public_subnets など）"
difficulty: 2
tags: ["数値計算", "イディオム"]
---

## ひとことで
`terraform-aws-vpc` は、サブネットを作る回数を、IPv4 の CIDR 一覧と IPv6 の接頭辞一覧の長さの大きいほうで決めます。`max(length(a), length(b))` という形を、サブネットの種類ごとに繰り返しています。

## コード
```hcl:line-numbers=1
locals {
  len_public_subnets      = max(length(var.public_subnets), length(var.public_subnet_ipv6_prefixes))
  len_private_subnets     = max(length(var.private_subnets), length(var.private_subnet_ipv6_prefixes))
  len_database_subnets    = max(length(var.database_subnets), length(var.database_subnet_ipv6_prefixes))
  len_elasticache_subnets = max(length(var.elasticache_subnets), length(var.elasticache_subnet_ipv6_prefixes))
  len_redshift_subnets    = max(length(var.redshift_subnets), length(var.redshift_subnet_ipv6_prefixes))
  len_intra_subnets       = max(length(var.intra_subnets), length(var.intra_subnet_ipv6_prefixes))
  len_outpost_subnets     = max(length(var.outpost_subnets), length(var.outpost_subnet_ipv6_prefixes))
```

## 前提知識
- `locals`: モジュール内で使う値をまとめて名前付けするブロックです。
- `length(リスト)`: リストの要素の数を返します。
- `max(数1, 数2, ...)`: 与えられた数の中で最大の値を返します。
- `var.public_subnets`: 利用者が渡した、公開サブネットの CIDR（IP アドレスの範囲）のリストです。
- `var.public_subnet_ipv6_prefixes`: IPv6 のサブネットに使う、番号の接頭辞の一覧です。

## 何をしているか
### 1. サブネットの種類ごとに数を決める
```hcl:line-numbers=2
  len_public_subnets      = max(length(var.public_subnets), length(var.public_subnet_ipv6_prefixes))
```

`len_public_subnets` は、`public_subnets` の長さと `public_subnet_ipv6_prefixes` の長さの、大きいほうです。IPv4 だけを使うとき、後者の長さは 0 なので、結果は前者の長さになります。IPv6 だけを使うときは、後者の長さが結果になります。

### 2. 種類ごとの数から全体の最大を求める
```hcl:line-numbers=10
  max_subnet_length = max(
    local.len_private_subnets,
    local.len_public_subnets,
    local.len_elasticache_subnets,
    local.len_database_subnets,
    local.len_redshift_subnets,
  )
```

`max_subnet_length` は、各種類の数の最大値です。この値は、種類ごとの数をまとめて 1 つの基準にするためのものです。すべての種類の数を一度に比べることで、どこか 1 か所でも長い一覧があれば、その長さを取り上げられます。

## ここがすごい
IPv4 と IPv6 のどちらを使うかを、`if` 文で書き分けていないのが工夫です。長さの大きいほうを取るだけで、「使われている方に合わせる」という判断が自然に行われます。

また、ひとつの `locals` の中に、長さを比べる式をそろえて並べているので、サブネットの種類が増えても、同じ形の行を追加するだけで済みます。読み手は、1 行の意味を理解すれば、残りもすぐに読めます。

さらに、`locals` に並べた式は、どれも同じ形なので、読み手は 1 つを理解すると残りも同様に読めます。IPv6 の接頭辞を足すだけで、サブネットの数が自然に増える、という利点もあります。

## まとめ
- `max` と `length` を組み合わせると、大きいほうの長さを 1 行で求められます。
- 2 つの一覧のどちらか一方しか使わないときも、同じ式で正しく動きます。
- 同じ形の式を並べると、種類が増えても読み方が変わりません。

