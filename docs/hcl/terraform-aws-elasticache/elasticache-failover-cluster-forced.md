---
title: "クラスターモードでは、自動フェイルオーバーを強制的に有効にする"
description: "terraform-aws-elasticache のレプリケーショングループ。マルチ AZ かクラスターモードなら自動フェイルオーバーを true にし、利用者の設定は無視する。"
language: hcl
project: "terraform-aws-elasticache"
repo: https://github.com/terraform-aws-modules/terraform-aws-elasticache
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "41a277b73b9d375a2856886ab8469fd3f8b6d0ef"
file: main.tf
lines: [83, 88]
format: 2
function: "resource \"aws_elasticache_replication_group\"（this）"
difficulty: 2
tags: ["ネットワーク", "防御的プログラミング"]
---

## ひとことで
ElastiCache のレプリケーショングループは、読み書きを受けるプライマリと、その控えのレプリカで構成されます。プライマリが落ちたときに、レプリカを新しいプライマリへ昇格させる仕組みが自動フェイルオーバーです。このコードは、マルチ AZ またはクラスターモードのときは、利用者が false を書いても自動フェイルオーバーを有効にします。

## コード
```hcl:line-numbers=83
  auto_minor_version_upgrade  = var.auto_minor_version_upgrade
  automatic_failover_enabled  = var.multi_az_enabled || var.cluster_mode_enabled ? true : var.automatic_failover_enabled
  cluster_mode                = var.cluster_mode
  data_tiering_enabled        = var.data_tiering_enabled
  description                 = coalesce(var.description, "Replication group")
  engine                      = var.engine
```

## 前提知識
- レプリケーショングループ: 1 つのプライマリと、複数のレプリカをまとめた単位です。
- マルチ AZ: レプリカを別の AZ（データセンター）に置き、1 つの AZ が落ちても続けて動くようにする構成です。
- クラスターモード: データを複数のシャードに分けて持つ構成です。
- 自動フェイルオーバー: プライマリが落ちたとき、人の手を使わずにレプリカを昇格させる機能です。
- `||`、`?:`: `a || b ? x : y` は、まず `a || b` を計算し、その真偽で `x` か `y` を選びます。
- `coalesce`: 空でない最初の値を返す関数です。

## 何をしているか
### 1. 2 つの条件のどちらかで、フェイルオーバーを有効にする

```hcl:line-numbers=84
  automatic_failover_enabled  = var.multi_az_enabled || var.cluster_mode_enabled ? true : var.automatic_failover_enabled
```

`var.multi_az_enabled` か `var.cluster_mode_enabled` のどちらかが真なら、`true` になります。どちらも偽のときだけ、利用者の `automatic_failover_enabled` の値をそのまま使います。`||` は三項演算子より先に計算されるので、式は「（マルチ AZ またはクラスター）なら true、それ以外は利用者の値」という意味になります。

### 2. モードの指定は、利用者がそのまま渡す

```hcl:line-numbers=85
  cluster_mode                = var.cluster_mode
```

クラスターモードの値は、利用者の指定をそのまま渡します。どのモードを使うかは利用者が決め、フェイルオーバーの扱いだけをモジュールが補っています。

### 3. 説明文は、無ければ既定の文字を入れる

```hcl:line-numbers=87
  description                 = coalesce(var.description, "Replication group")
```

説明を書かなければ、`"Replication group"` という文字が入ります。AWS の画面で、どのリソースか分かるようにするための既定値です。

## ここがすごい
この式は、「利用者の選択肢を全部与えるのではなく、危険な組み合わせだけを防ぐ」という考え方です。クラスターモードで自動フェイルオーバーを切ると、障害時に読み書きが止まる、という設計上の穴ができます。その穴を、式 1 行で塞いでいます。

さらに、利用者が `automatic_failover_enabled` を書いていても、他の条件が真なら無視されます。読み手は、その優先順位を式の中で読めるので、ドキュメントを探さなくても動きが分かります。

## まとめ
- `||` と `?:` を組み合わせると、「どれかが真なら強制」を 1 行で書けます。
- 危険な組み合わせだけを、式で固定すると、利用者の自由度を保ちながら事故を防げます。
- `coalesce` は説明文のような、空だと困る値の既定値に向いています。
