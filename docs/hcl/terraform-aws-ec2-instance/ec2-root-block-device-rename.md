---
title: "ルートボリュームの設定名を、AWS の名前に読み替える"
description: "terraform-aws-ec2-instance の root_block_device。利用者の size と type を、AWS の volume_size と volume_type に渡し、他の項目はそのまま使う。"
language: hcl
project: "terraform-aws-ec2-instance"
repo: https://github.com/terraform-aws-modules/terraform-aws-ec2-instance
license: Apache-2.0
copyright: "terraform-aws-modules contributors（LICENSE は Apache-2.0 の本文）"
commit: "4dfedcdd1f26006009c52439bbadba40a76ddb79"
file: main.tf
lines: [198, 210]
format: 2
function: "resource \"aws_instance\"（dynamic \"root_block_device\"）"
difficulty: 1
tags: ["API設計", "防御的プログラミング"]
---

## ひとことで
EC2 インスタンスには、OS が入るルートのディスク（ボリューム）を設定するブロックがあります。このモジュールでは、利用者が書く項目名（`size` や `type`）は、AWS のリソースの名前（`volume_size` や `volume_type`）とは違います。このコードは、その読み替えを 1 か所で行っています。

## コード
```hcl:line-numbers=198
    for_each = var.root_block_device != null ? [var.root_block_device] : []

    content {
      delete_on_termination = root_block_device.value.delete_on_termination
      encrypted             = root_block_device.value.encrypted
      iops                  = root_block_device.value.iops
      kms_key_id            = root_block_device.value.kms_key_id
      tags                  = root_block_device.value.tags
      throughput            = root_block_device.value.throughput
      volume_size           = root_block_device.value.size
      volume_type           = root_block_device.value.type
    }
  }
```

## 前提知識
- EBS（Elastic Block Store）: EC2 に付けるディスクです。ルートボリュームは、OS を起動するためのディスクです。
- ボリュームの種類（type）: `gp3` や `io2` など、性能と料金の違うディスクの種類です。
- IOPS / スループット: ディスクの読み書きの速さの指標です。種類によって使える範囲が違います。
- `dynamic` ブロック: 指定があるときだけ、ブロックを 1 つ作る書き方です。
- 読み替え: モジュールの利用者向けの名前と、AWS の正式な名前が違うとき、間に入って渡す値を変えることです。

## 何をしているか
### 1. 指定があるときだけ、ルートボリュームの設定を作る

```hcl:line-numbers=198
    for_each = var.root_block_device != null ? [var.root_block_device] : []
```

`root_block_device` を指定していなければ、AWS の既定のルートディスクが使われます。指定があれば、1 つのブロックを作ります。

### 2. 名前を読み替える

```hcl:line-numbers=207
      volume_size           = root_block_device.value.size
      volume_type           = root_block_device.value.type
```

利用者は `size` と `type` と書きます。モジュールは、それを AWS の正式な属性 `volume_size` と `volume_type` に渡します。利用者は短い名前で書け、AWS 側は正式な名前を受け取れます。

### 3. 他の項目は、そのまま渡す

`encrypted`、`kms_key_id`、`iops`、`throughput` などは、名前を変えずに渡しています。読み替えが必要なものだけを、特別扱いする書き方です。

## ここがすごい
名前の読み替えを、1 つのブロックの中に閉じ込めているので、利用者は AWS のドキュメントを開かなくても、短い名前で設定できます。モジュールの中身が、AWS の名前にどう対応するかは、この数行を見れば分かります。

さらに、暗号化の設定（`encrypted` と `kms_key_id`）を、同じブロックで隣に並べています。ディスクの性能と安全性の設定が、一か所で読めるのは、設定を見直すときに役立ちます。

## まとめ
- 利用者向けの名前と、AWS の名前が違うときは、読み替えを 1 か所に集めると分かりやすくなります。
- `dynamic` で、ルートディスクの指定があるときだけブロックを作れます。
- 暗号化やディスクの性能の設定は、近くに並べると一緒に確認できます。
