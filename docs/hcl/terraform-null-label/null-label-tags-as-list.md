---
title: "タグを key と value の組のリストに変える flatten"
description: "Cloud Posse の null-label が、マップのタグを「1 件ずつの key と value」のリストに変換する処理。flatten と merge を組み合わせた短いイディオムを読む。"
language: hcl
project: "terraform-null-label"
repo: https://github.com/cloudposse/terraform-null-label
license: Apache-2.0
copyright: "Cloud Posse, LLC（LICENSE に著作権表示は無し・Apache-2.0 の本文）"
commit: "38364d79c1082de13373666252e1276975919543"
file: main.tf
lines: [115, 121]
format: 2
function: "locals（tags_as_list_of_maps）"
difficulty: 2
tags: ["イディオム", "データ構造"]
---

## ひとことで
`tags_as_list_of_maps` は、マップ形式のタグを「`key` と `value` を持つ 1 件分のマップ」の一覧に変換します。マップのままでは扱いにくいリソースに、タグを 1 件ずつ渡せるようにするための形です。`for` 式で作ったリストの中にさらにリストが入るので、`flatten` でそれを 1 段にまとめています。

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
- マップとリスト: マップは `キー = 値` の組の集まり、リストは順番のある値の並びです。
- `keys(マップ)`: マップのキーをリストで返します。
- `for key in リスト : 式`: リストの要素ごとに式を評価し、その結果を集めます。
- `merge(マップA, マップB)`: 複数のマップを 1 つにまとめる関数です。同じキーがあれば後のマップの値が使われます。
- `flatten(リストのリスト)`: 入れ子のリストを 1 段のリストにする関数です。
- `local.additional_tag_map`: 全てのタグに追加で付けたい情報のマップです。

## 何をしているか
### 1. タグのキーを 1 つずつ取り出す
```hcl:line-numbers=116
    for key in keys(local.tags) : merge(
      {
        key   = key
        value = local.tags[key]
    }, local.additional_tag_map)
```

`keys(local.tags)` で、タグのキーを 1 つずつ取り出します。各キーについて、`key = key` と `value = local.tags[key]` の 2 つの値を持つマップを作ります。これは「キーと値を並べた 1 件分」の表現です。

### 2. 追加の情報を各要素に足す
```hcl:line-numbers=119
        value = local.tags[key]
    }, local.additional_tag_map)
```

`merge({ key, value }, local.additional_tag_map)` によって、各要素に `additional_tag_map` の内容が加わります。たとえば全部のタグに同じ属性を付けたいときに、このマップへ値を入れておけば、すべての要素に反映されます。

### 3. `flatten` の役割を確かめる
```hcl:line-numbers=115
  tags_as_list_of_maps = flatten([
```

`flatten` は入れ子のリストを 1 段にする関数です。ただし、この `for` 式が返すのは `merge` の結果であるマップの一覧で、リストのリストではありません。そのため、ここでの `flatten` は要素の形を変えていません。読み手が「入れ子をほどいているのだろう」と誤解しやすい部分なので、実際の役割を確かめておくと、将来この式を書き換えるときに迷いにくくなります。

## ここがすごい
タグのマップを別の形に変えるとき、モジュールは `for` 式の中で `merge` を使い、追加情報の付与を 1 行で済ませています。もし `merge` を使わなければ、すべてのタグに対して追加の値を手で書き足すことになり、設定の変更が多くの行に広がります。

また、変換の規則が 1 つの式に集まっているので、読み手は「キーと値の組に変える」「追加情報を足す」という 2 つの処理だけを追えば理解できます。

## まとめ
- `for` 式で、マップのキーを 1 件ずつ別のマップにできます。
- `merge` で各要素に共通の情報を足すと、設定の変更箇所を減らせます。
- `flatten` は入れ子のリストをほどく関数です。`for` 式の結果が既にマップの一覧なら、効果を確かめてから使いましょう。

