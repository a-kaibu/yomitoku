---
title: "レプリケーショングループの一員なら、ノードの設定を省く"
description: "terraform-aws-elasticache の単体クラスター設定。レプリケーショングループに属するときは、ノード数やポートなどを null にして、グループの設定に任せる。"
language: hcl
project: "terraform-aws-elasticache"
repo: https://github.com/terraform-aws-modules/terraform-aws-elasticache
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "41a277b73b9d375a2856886ab8469fd3f8b6d0ef"
file: main.tf
lines: [41, 46]
format: 2
function: "resource \"aws_elasticache_cluster\"（this）"
difficulty: 2
tags: ["ネットワーク", "API設計"]
---

## ひとことで
ElastiCache には、単独のクラスターと、レプリケーショングループの一員として動くクラスターがあります。レプリケーショングループの一員になると、ノードの台数やポートなどは、グループ側の設定で決まります。このコードは、`in_replication_group` が真のとき、それらの値を `null` にして、グループの設定と衝突しないようにしています。

## コード
```hcl:line-numbers=41
  node_type                    = local.in_replication_group ? null : var.node_type
  notification_topic_arn       = local.in_replication_group ? null : var.notification_topic_arn
  num_cache_nodes              = local.in_replication_group ? null : var.num_cache_nodes
  outpost_mode                 = var.outpost_mode
  parameter_group_name         = local.in_replication_group ? null : local.parameter_group_name_result
  port                         = local.in_replication_group ? null : coalesce(var.port, local.port)
```

## 前提知識
- ElastiCache のクラスター: キャッシュのノードを 1 つ以上まとめた単位です。
- レプリケーショングループ: プライマリとレプリカをまとめて、高可用性を持たせる単位です。その中のノードは、グループの設定に従います。
- `num_cache_nodes`: ノードの台数です。単独のクラスターで指定します。
- `node_type`: ノードの大きさ（種類）です。
- `null`: 属性を送らないという意味です。グループの設定に任せられます。
- 三項演算子: `条件 ? null : 値` は、条件が真なら送らず、偽なら値を使います。

## 何をしているか
### 1. ノードの大きさと台数は、グループでは送らない

```hcl:line-numbers=41
  node_type                    = local.in_replication_group ? null : var.node_type
```

グループに属するときは `node_type` を送りません。大きさはグループの設定で決まるためです。単独のときだけ、利用者の `node_type` を使います。

```hcl:line-numbers=43
  num_cache_nodes              = local.in_replication_group ? null : var.num_cache_nodes
```

台数も同じです。グループ内のノードの数は、グループ側で管理されるので、ここでは送りません。

### 2. 通知とパラメータも、同じ判定で省く

```hcl:line-numbers=45
  parameter_group_name         = local.in_replication_group ? null : local.parameter_group_name_result
```

パラメータグループは、グループ側の設定を使うときは `null` にします。そうしないと、単独のクラスターの設定と、グループの設定が二重になってしまいます。

### 3. ポートは、利用者の指定か既定値か

```hcl:line-numbers=46
  port                         = local.in_replication_group ? null : coalesce(var.port, local.port)
```

単独のときは、利用者のポートが空なら、エンジンに応じた既定のポートを使います。グループのときは、ポートもグループ側に任せるので `null` です。

## ここがすごい
同じ判定 `local.in_replication_group` を、属性ごとに三項演算子で書いています。1 つの条件で、どの属性を送るかが一括で決まるので、読み手は条件の意味だけを理解すれば、全部の行が読めます。

また、グループの設定と単独の設定を、同じリソースの中で切り替えられるようにしている点も大切です。利用者は、グループの一員になるかどうかを 1 つのフラグで決めるだけです。

## まとめ
- 1 つの判定を、属性ごとの三項演算子に広げると、設定の切り替えが読みやすくなります。
- グループに任せる属性は `null` にすると、二重の設定を避けられます。
- `coalesce` は、単独のときだけ既定値を使う場面で役立ちます。
