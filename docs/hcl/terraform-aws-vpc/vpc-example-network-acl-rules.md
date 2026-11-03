---
title: "ネットワーク ACL のルールを、名前付きの一覧で表す"
description: "terraform-aws-vpc の network-acls 例。サブネットの種類ごとの ACL ルールを、locals の中のマップとリストで書き、ICMP の echo 要求まで表す書き方。"
language: hcl
project: "terraform-aws-vpc"
repo: https://github.com/terraform-aws-modules/terraform-aws-vpc
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "b3abd6df2ecf052451a361ed55b8f06f8742a795"
file: examples/network-acls/main.tf
lines: [20, 40]
format: 2
function: "locals（network_acls.default_inbound・default_outbound）"
difficulty: 1
tags: ["データ構造", "API設計"]
---

## ひとことで
ネットワーク ACL のルールは、番号・動作（許可か拒否）・ポート・プロトコル・許可元などの項目を持ちます。この例では、ルールの一覧を `network_acls` という 1 つのマップにまとめ、サブネットの種類ごとに名前を付けて分けています。

## コード
```hcl:line-numbers=20
  network_acls = {
    default_inbound = [
      {
        rule_number = 900
        rule_action = "allow"
        from_port   = 1024
        to_port     = 65535
        protocol    = "tcp"
        cidr_block  = "0.0.0.0/0"
      },
    ]
    default_outbound = [
      {
        rule_number = 900
        rule_action = "allow"
        from_port   = 32768
        to_port     = 65535
        protocol    = "tcp"
        cidr_block  = "0.0.0.0/0"
      },
    ]
```

## 前提知識
- ネットワーク ACL: サブネットの出入りを許可・拒否するルールの一覧です。番号の小さいルールから順に判断されます。
- マップのリテラル: `キー = 値` の組を `{ ... }` で書きます。ここでは `default_inbound` などがキーです。
- リストのリテラル: `[ ... ]` の中に、同じ形のマップを並べます。末尾の `,` は省略してもかまいません。
- `rule_number`: ルールの番号です。`rule_action`: `allow` か `deny` です。
- `from_port` と `to_port`: 通信のポートの範囲です。`protocol` は `tcp` などです。
- `cidr_block` と `ipv6_cidr_block`: 送信元や送信先の範囲です。

## 何をしているか
### 1. ルールの種類ごとに名前を付ける
```hcl:line-numbers=20
  network_acls = {
    default_inbound = [
      {
```

`network_acls` は、ルールの一覧に名前を付けたマップです。`default_inbound` は、受信の既定のルールを表します。モジュールの引数には、この名前を使って一覧を渡します。

### 2. 1 件のルールを同じ形で書く
```hcl:line-numbers=23
        rule_number = 900
        rule_action = "allow"
        from_port   = 1024
        to_port     = 65535
        protocol    = "tcp"
        cidr_block  = "0.0.0.0/0"
      },
```

各ルールは、番号、動作、ポートの範囲、プロトコル、許可元の 6 つの項目を持ちます。どのルールも同じ形なので、読み手は 1 件を読めば、残りの読み方が分かります。

### 3. ICMP のルールを表す
```hcl:line-numbers=116
      {
        rule_number = 140
        rule_action = "allow"
        icmp_code   = -1
        icmp_type   = 8
        protocol    = "icmp"
        cidr_block  = "10.0.0.0/22"
      },
```

ICMP はポートを持たないので、`from_port` の代わりに `icmp_type` と `icmp_code` を書きます。`icmp_type = 8` は echo 要求（ping の送信）を表し、`icmp_code = -1` は「すべてのコード」を意味します。ポートの項目を書かないため、ICMP のルールは TCP のルールとは別の形になります。

## ここがすごい
ルールの一覧を、サブネットの種類ごとにマップで分けておくと、モジュールの引数に `local.network_acls["public_inbound"]` のように渡せます。ルールの追加や変更が、この一か所だけで済みます。

また、ルールの番号が 100 や 110 のように間隔を空けてあるのは、後から間に新しいルールを挿入できるようにするための、ネットワーク管理の定番の工夫です。

## まとめ
- マップとリストを組み合わせると、ルールの一覧を種類ごとに整理できます。
- ICMP は、ポートの代わりに type と code で表します。
- ルールの番号に間隔を空けると、後から追加しやすくなります。

