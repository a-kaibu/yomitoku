---
title: "利用者のセキュリティグループに、モジュールの分を連結する"
description: "terraform-aws-elasticache の security_group_ids。作成したセキュリティグループを concat で利用者の一覧の後ろに足し、エンジンごとにポートを 11211 か 6379 に決める。"
language: hcl
project: "terraform-aws-elasticache"
repo: https://github.com/terraform-aws-modules/terraform-aws-elasticache
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "41a277b73b9d375a2856886ab8469fd3f8b6d0ef"
file: main.tf
lines: [3, 8]
format: 2
function: "locals（security_group_ids・port・tags）"
difficulty: 1
tags: ["ネットワーク", "API設計"]
---

## ひとことで
ElastiCache は、Redis や Memcached のような、メモリ上で動くキャッシュサーバーを AWS で動かすサービスです。このモジュールは、利用者が指定したセキュリティグループに、モジュールが作った分を足します。また、エンジンによって違うポート番号を、1 行の式で選びます。

## コード
```hcl:line-numbers=3
  in_replication_group = var.replication_group_id != null

  security_group_ids = local.create_security_group ? concat(var.security_group_ids, [aws_security_group.this[0].id]) : var.security_group_ids
  port               = var.engine == "memcached" ? 11211 : 6379

  tags = merge(var.tags, { terraform-aws-modules = "elasticache" })
```

## 前提知識
- ElastiCache: AWS のインメモリのキャッシュサービスです。Redis と Memcached という 2 種類のエンジンを選べます。
- セキュリティグループ: 通信を許可するポートや送信元を決める、AWS の仮想的なファイアウォールです。
- `concat(A, B)`: 2 つのリストを前後につなげた、新しいリストを作ります。
- ポート番号: 通信の入口の番号です。Redis の既定は 6379、Memcached の既定は 11211 です。
- 三項演算子 `条件 ? A : B`: 条件が真なら A、偽なら B を返します。
- `merge`: マップを足して 1 つにまとめる関数です。

## 何をしているか
### 1. 作ったセキュリティグループを、利用者の分の後ろに足す

```hcl:line-numbers=5
  security_group_ids = local.create_security_group ? concat(var.security_group_ids, [aws_security_group.this[0].id]) : var.security_group_ids
```

`local.create_security_group` が真なら、利用者の `security_group_ids` のリストと、モジュールが作ったセキュリティグループの ID を 1 つにつなげます。`[aws_security_group.this[0].id]` は、1 つの ID を持つリストにしてから `concat` に渡すための書き方です。

偽なら、利用者の一覧をそのまま使います。どちらの場合も、後ろのリソースは `local.security_group_ids` だけを見ればよいので、分岐が 1 か所にまとまります。

### 2. エンジンでポート番号を決める

```hcl:line-numbers=6
  port               = var.engine == "memcached" ? 11211 : 6379
```

`engine` が `memcached` なら 11211、それ以外なら 6379 を使います。6379 は Redis の既定のポートです。エンジンを 2 種類に限ることで、利用者はポートを書かなくても、正しい番号を使えます。

### 3. タグに、このモジュールの印を付ける

```hcl:line-numbers=8
  tags = merge(var.tags, { terraform-aws-modules = "elasticache" })
```

`merge` の後ろに、このモジュールの名前を入れたタグを置いています。利用者のタグが同じキーを持っていても、後ろのものが優先されるので、この印は必ず付きます。

## ここがすごい
利用者が渡す一覧に、モジュールの都合で作ったものを後ろから足すやり方は、柔軟性と安全性を両立させています。利用者は、既存のセキュリティグループをそのまま使えますし、何も指定しなければモジュールが作った 1 つだけになります。どちらの場合も、同じ変数を読むだけでよいので、呼び出し側の書き方は変わりません。

ポートを `engine` の値から決めるのも、単純ですが大切な工夫です。利用者がポートを書き忘れて、Memcached なのに 6379 を開けてしまう、といった間違いを防げます。

## まとめ
- `concat` で、利用者の一覧とモジュールが作ったものを 1 つのリストにまとめられます。
- 三項演算子の 1 行で、作る・作らない、のどちらも同じ変数に渡せます。
- エンジンの種類からポートを決めれば、利用者は番号を覚えなくてよくなります。
