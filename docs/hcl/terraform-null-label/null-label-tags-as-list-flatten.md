---
title: "タグを、キーと値の組の一覧に変える"
description: "terraform-null-label の tags_as_list_of_maps。タグのマップを for 式で回し、キーと値の組のマップにしてから flatten で一つの一覧にする。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE は Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [115, 121]
format: 2
function: "locals（tags_as_list_of_maps の flatten と for 式）"
difficulty: 3
tags: ["API設計", "データ構造"]
---

## ひとことで
タグは、キーと値のマップとして受け取ります。しかし、ほかの仕組みでは、キーと値の組が並んだ一覧が必要なこともあります。このコードは、タグのマップを、キーと値の組のマップが並んだ一覧に変換しています。`flatten` で、入れ子のリストを一段に潰します。

## コード
```hcl:line-numbers=115
  tags_as_list_of_maps = flatten([
    for key in keys(local.tags) : merge(
      {
        key   = key
        value = local.tags[key]
    }, local.additional_tag_map)
  ])
```

## 前提知識
- `keys(マップ)`: マップのキーの一覧を返します。
- `merge(マップ1, マップ2)`: 複数のマップを一つにまとめます。後のマップが優先されます。
- `flatten(リスト)`: 入れ子になったリストを、一段のリストに平らにします。

## 何をしているか
### 1. タグを一つずつ取り出す

```hcl:line-numbers=116
    for key in keys(local.tags) : merge(
```

`keys` で得たキーを一つずつ回します。タグの数だけ、以下の処理が繰り返されます。

### 2. 一つのタグを、組のマップにする

```hcl:line-numbers=117
      {
        key   = key
        value = local.tags[key]
    }, local.additional_tag_map)
```

それぞれのタグを、`key` と `value` のマップに変えます。追加のマップ（`local.additional_tag_map`）も、同じ `merge` で足されます。

### 3. 全部を一段のリストにする

最後に `flatten` が、タグごとに作ったリストを一つにまとめます。戻り値は、キーと値の組が並んだ一覧です。

## ここがすごい
マップを一覧に変える処理を、一つの `for` 式と `flatten` で書いています。`merge` で追加の情報を足せるので、呼び出し側は必要な形の一覧をそのまま受け取れます。

## まとめ
- `for` 式でマップのキーを回すと、要素ごとに形を変えられます。
- `flatten` は、入れ子のリストを一段にする定番の道具です。
- 形式の違う資源に合わせるには、変換の処理を一か所にまとめると保守しやすくなります。
