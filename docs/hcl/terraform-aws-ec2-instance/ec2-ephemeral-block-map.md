---
title: "一時ストレージの割り当てを、名前付きのマップで受け取る"
description: "terraform-aws-ec2-instance の ephemeral_block_device。マップのキーを使わず、利用者が渡したマップの各要素から、デバイス名などを 1 つずつ設定する。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [95, 103]
format: 2
function: "resource \"aws_instance\"（dynamic \"ephemeral_block_device\"）"
difficulty: 1
tags: ["API設計", "メモリ管理"]
---

## ひとことで
EC2 のインスタンスには、再起動すると中身が消える一時ストレージ（インスタンスストア）を付けられます。このモジュールでは、一時ストレージの設定を、名前付きのマップで受け取ります。マップの各要素を `dynamic` で 1 つずつブロックにし、デバイス名や仮想名を設定します。

## コード
```hcl:line-numbers=95
  dynamic "ephemeral_block_device" {
    for_each = var.ephemeral_block_device != null ? var.ephemeral_block_device : {}

    content {
      device_name  = ephemeral_block_device.value.device_name
      no_device    = ephemeral_block_device.value.no_device
      virtual_name = ephemeral_block_device.value.virtual_name
    }
  }
```

## 前提知識
- 一時ストレージ（ephemeral storage）: インスタンスに直接付いているディスクです。速いですが、インスタンスを止めたり壊したりすると中身が失われます。
- デバイス名: OS から見たディスクの名前（例: `/dev/sdb`）です。
- 仮想名（virtual_name）: インスタンスストアを表す AWS 上の名前です（例: `ephemeral0`）。
- `no_device`: 指定したデバイスを、インスタンスに付けないことを表します。
- マップの `for_each`: マップのキーと値をそれぞれ使って、ブロックを繰り返します。

## 何をしているか
### 1. 指定があるときだけ、要素を回す

```hcl:line-numbers=95
  dynamic "ephemeral_block_device" {
    for_each = var.ephemeral_block_device != null ? var.ephemeral_block_device : {}
```

`ephemeral_block_device` が無ければ、空のマップ `{}` を回すので、ブロックは 1 つも作られません。指定があれば、マップの要素の数だけブロックが作られます。

### 2. 各要素の値を、そのまま設定する

```hcl:line-numbers=99
      device_name  = ephemeral_block_device.value.device_name
      no_device    = ephemeral_block_device.value.no_device
      virtual_name = ephemeral_block_device.value.virtual_name
```

`ephemeral_block_device.value` は、マップの 1 つの要素、つまり利用者が書いた設定です。3 つの項目を、AWS の同じ名前の属性へそのまま渡しています。読み替えはありません。

### 3. ブロックを閉じる

最後の `}` は、`content` のブロックと `dynamic` のブロックを閉じています。`dynamic` の中で、ブロックの中身だけを書く、という形がはっきり見えます。

## ここがすごい
一時ストレージは、用途によって数が変わります。マップで受け取り、`dynamic` で回すと、利用者は必要な数だけ、名前を付けて指定できます。名前がキーになるので、ディスクの一覧を読むときにも、どのディスクかが分かりやすくなります。

また、`no_device` を別の項目として持てるのも大切です。特定のデバイスを、わざと外すような設定も同じ形で書けます。

## まとめ
- 数が変わる設定は、マップで受け取り、`dynamic` で回すと扱いやすくなります。
- 指定が無いときは `{}` にすると、ブロックを作らずに済みます。
- マップのキーで名前を付けると、利用者が設定を読み返すときにも分かりやすくなります。
