---
title: "ネットワークインターフェースの番号を、省略時はキーから決める"
description: "terraform-aws-ec2-instance の network_interface。device_index を指定しなければ、マップのキーをそのまま番号として使う。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [169, 179]
format: 2
function: "resource \"aws_instance\"（dynamic \"network_interface\"）"
difficulty: 2
tags: ["ネットワーク", "API設計"]
---

## ひとことで
EC2 インスタンスには、複数のネットワークインターフェース（ENI）をつなげられます。それぞれのインターフェースには、インスタンスの中での番号（デバイスインデックス）が必要です。このコードは、利用者が番号を書かなければ、マップのキーをそのまま番号として使います。

## コード
```hcl:line-numbers=169
  dynamic "network_interface" {
    for_each = var.network_interface != null ? var.network_interface : {}

    content {
      delete_on_termination = network_interface.value.delete_on_termination
      device_index          = coalesce(network_interface.value.device_index, network_interface.key)
      network_card_index    = network_interface.value.network_card_index
      network_interface_id  = network_interface.value.network_interface_id

    }
  }
```

## 前提知識
- ネットワークインターフェース（ENI）: インスタンスに付ける仮想の網つなぎ口です。IP アドレスやセキュリティグループを持たせられます。
- デバイスインデックス: インスタンスの中で、そのインターフェースに付く番号です。`0` が最初のインターフェースになります。
- `dynamic` ブロック: 利用者が渡した数だけ、同じ形のブロックを作ります。
- `coalesce`: 空でない最初の値を返します。`null` の番号は飛ばされます。
- マップのキー: `for_each` でブロックを回すとき、`network_interface.key` で、その要素のキーを使えます。

## 何をしているか
### 1. 指定がある時だけ、要素を回す

```hcl:line-numbers=170
    for_each = var.network_interface != null ? var.network_interface : {}
```

`network_interface` が `null` なら、空のマップを使うので、インターフェースは追加されません。値があれば、その数だけ `content` のブロックが作られます。

### 2. デバイスインデックスを、指定値かキーにする

```hcl:line-numbers=174
      device_index          = coalesce(network_interface.value.device_index, network_interface.key)
```

利用者が `device_index` を書いていれば、その値を使います。書いていなければ、マップのキー（`network_interface.key`）が番号になります。キーを `"0"` や `"1"` のような番号の文字列にしておけば、番号を 2 回書かずに済みます。

### 3. 他の属性はそのまま渡す

`delete_on_termination` や `network_interface_id` は、利用者の値をそのまま使います。ここでは加工せず、番号の決め方だけを特別扱いしています。

## ここがすごい
マップのキーを番号の既定値にする、という書き方はとても簡潔です。利用者は、インターフェースを「名前付きで」並べるだけで、番号の書き忘れや、番号の重複を気にしなくて済みます。キーが一意であれば、番号も一意になるので、設計上の事故が起きにくくなります。

さらに `coalesce` を使うと、「番号を明示したい」利用者は `device_index` を書けば上書きできます。既定の動きと、必要なときの上書きを、同じ式で両立させています。

## まとめ
- `coalesce(指定値, 既定値)` は、指定があればそれを、無ければ既定値を使う定番の書き方です。
- マップのキーを既定値に使うと、ブロックの識別子をそのまま番号として使えます。
- `dynamic` で、利用者が渡した数だけブロックを作れます。
