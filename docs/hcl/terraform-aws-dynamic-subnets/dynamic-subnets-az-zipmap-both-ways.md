---
title: "AZ の ID と名前の対応表を、両方向に作る"
description: "terraform-aws-dynamic-subnets の az_id_map と az_name_map。zipmap で ID と名前を入れ替えた二つのマップを作り、取得できなければ空のマップにする。"
language: hcl
project: "terraform-aws-dynamic-subnets"
repo: https://github.com/cloudposse/terraform-aws-dynamic-subnets
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "ab53498a69d8a48b0c454482ffbbd112c29d450a"
file: main.tf
lines: [32, 33]
format: 2
function: "locals（zipmap と try による対応表）"
difficulty: 2
tags: ["データ構造", "防御的プログラミング"]
---

## ひとことで
サブネットを AZ ごとに作るとき、AZ の名前と ID の両方が必要になることがあります。このコードは、AWS から取った二つの一覧を `zipmap` で組み合わせ、名前から ID、ID から名前を引けるマップを二つ作っています。ID が取れない環境では、空のマップにして先へ進みます。

## コード
```hcl:line-numbers=32
  az_id_map   = try(zipmap(data.aws_availability_zones.default[0].zone_ids, data.aws_availability_zones.default[0].names), {})
  az_name_map = try(zipmap(data.aws_availability_zones.default[0].names, data.aws_availability_zones.default[0].zone_ids), {})
```

## 前提知識
- `zipmap(キーの一覧, 値の一覧)`: 二つのリストを、同じ位置どうしで対応させたマップを作ります。
- AZ の ID: `use1-az1` のように、アカウントをまたいで同じ AZ を指す固定の名前です。
- `try(式, {})`: 式が失敗したら、空のマップを返します。

## 何をしているか
### 1. ID から名前を引くマップを作る

```hcl:line-numbers=32
  az_id_map   = try(zipmap(data.aws_availability_zones.default[0].zone_ids, data.aws_availability_zones.default[0].names), {})
```

`zone_ids` をキー、`names` を値にした `zipmap` を作ります。ID を入れると、AZ の名前が返ります。

### 2. 名前から ID を引くマップを作る

```hcl:line-numbers=33
  az_name_map = try(zipmap(data.aws_availability_zones.default[0].names, data.aws_availability_zones.default[0].zone_ids), {})
```

上と逆に、`names` をキーにします。二つの一覧の順番が同じなので、対応が正しく取れます。

## ここがすごい
二つの一覧をつなぐ処理を、同じ形の式を入れ替えるだけで書いています。ID が取れないリージョンでは `try` が空のマップを返し、利用側は値の有無だけを見れば済みます。

## まとめ
- `zipmap` で、二つの一覧を対応づけたマップにできます。
- キーと値を入れ替えると、逆方向の対応表がすぐに作れます。
- 取得できないかもしれない値は、`try` で空の既定を用意すると安全です。
